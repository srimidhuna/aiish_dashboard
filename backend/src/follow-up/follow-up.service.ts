import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateFollowUpDto } from '@/follow-up/dto/create-follow-up.dto';
import { UpdateFollowUpDto } from '@/follow-up/dto/update-follow-up.dto';
import { QueryFollowUpDto } from '@/follow-up/dto/query-follow-up.dto';
import { LogPhoneCallDto } from '@/follow-up/dto/log-phone-call.dto';

const FOLLOW_UP_INCLUDE = {
  baby: true,
  recommendations: { include: { recommendationType: true } },
} satisfies Prisma.FollowUpInclude;

@Injectable()
export class FollowUpService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryFollowUpDto) {
    // ── Auto-mark overdue follow-ups as 'missed' ──────────────────────────────
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    await this.prisma.followUp.updateMany({
      where: {
        status: { in: ['scheduled', 'rescheduled'] },
        followUpType: { not: 'phone' },
        scheduledDate: { lt: startOfToday },
      },
      data: { status: 'missed' },
    });
    // ─────────────────────────────────────────────────────────────────────────

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.babyId) where.babyId = query.babyId;
    if (query.hospitalId || query.districtId || query.state) {
      where.baby = {
        ...(query.hospitalId ? { hospitalId: query.hospitalId } : {}),
        ...(query.districtId ? { districtId: query.districtId } : {}),
        ...(query.state ? { district: { state: { name: query.state } } } : {}),
      };
    }

    return this.prisma.followUp.findMany({
      where: where as Prisma.FollowUpWhereInput,
      include: FOLLOW_UP_INCLUDE,
      orderBy: { scheduledDate: 'asc' },
    });
  }


  async getByBabyId(babyId: string) {
    return this.prisma.followUp.findMany({
      where: { babyId },
      include: FOLLOW_UP_INCLUDE,
      orderBy: { scheduledDate: 'desc' },
    });
  }

  private async getById(id: string) {
    const followUp = await this.prisma.followUp.findUnique({
      where: { id },
      include: FOLLOW_UP_INCLUDE,
    });
    if (!followUp) throw new NotFoundException('Follow-up not found');
    return followUp;
  }

  async create(dto: CreateFollowUpDto, providerId: string, createdById: string) {
    const { recommendationTypeIds, ...rest } = dto;

    const followUp = await this.prisma.followUp.create({
      data: {
        ...(rest as unknown as Prisma.FollowUpUncheckedCreateInput),
        scheduledDate: new Date(dto.scheduledDate),
        providerId,
        recommendations: recommendationTypeIds?.length
          ? {
              create: recommendationTypeIds.map((recommendationTypeId) => ({
                recommendationTypeId,
              })),
            }
          : undefined,
      },
      include: FOLLOW_UP_INCLUDE,
    });

    await this.prisma.patientTimeline.create({
      data: {
        babyId: followUp.babyId,
        event: 'follow_up_created',
        description: `Follow-up scheduled for ${followUp.scheduledDate.toLocaleDateString()}`,
        createdById,
      },
    });

    return followUp;
  }

  async update(id: string, dto: UpdateFollowUpDto) {
    await this.getById(id);
    const { recommendationTypeIds, scheduledDate, ...rest } = dto;

    if (recommendationTypeIds) {
      await this.prisma.babyRecommendation.deleteMany({ where: { followUpId: id } });
      if (recommendationTypeIds.length) {
        await this.prisma.babyRecommendation.createMany({
          data: recommendationTypeIds.map((recommendationTypeId) => ({
            followUpId: id,
            recommendationTypeId,
          })),
        });
      }
    }

    return this.prisma.followUp.update({
      where: { id },
      data: {
        ...(rest as unknown as Prisma.FollowUpUncheckedUpdateInput),
        ...(scheduledDate ? { scheduledDate: new Date(scheduledDate) } : {}),
      },
      include: FOLLOW_UP_INCLUDE,
    });
  }

  async updateStatus(id: string, status: string, actingUserId: string) {
    const existing = await this.getById(id);
    const followUp = await this.prisma.followUp.update({
      where: { id },
      data: {
        status: status as Prisma.FollowUpUncheckedUpdateInput['status'],
        actualDate: status === 'completed' ? new Date() : undefined,
      },
    });

    await this.prisma.patientTimeline.create({
      data: {
        babyId: existing.babyId,
        event: 'other',
        description: `Follow-up status changed to ${status}`,
        createdById: actingUserId,
      },
    });

    return followUp;
  }

  async reschedule(id: string, scheduledDate: string, actingUserId: string) {
    const existing = await this.getById(id);
    const followUp = await this.prisma.followUp.update({
      where: { id },
      data: { scheduledDate: new Date(scheduledDate), status: 'rescheduled' },
    });

    await this.prisma.patientTimeline.create({
      data: {
        babyId: existing.babyId,
        event: 'other',
        description: `Follow-up rescheduled to ${new Date(scheduledDate).toLocaleDateString()}`,
        createdById: actingUserId,
      },
    });

    return followUp;
  }

  async remove(id: string, actingUserId: string) {
    const existing = await this.getById(id);
    await this.prisma.followUp.delete({ where: { id } });

    await this.prisma.patientTimeline.create({
      data: {
        babyId: existing.babyId,
        event: 'other',
        description: 'A scheduled follow-up was deleted.',
        createdById: actingUserId,
      },
    });

    return { message: 'Follow-up deleted successfully.' };
  }

  async getPhoneSurveillanceList(hospitalId?: string) {
    const babies = await this.prisma.baby.findMany({
      where: {
        deletedAt: null,
        ...(hospitalId ? { hospitalId } : {}),
      },
      include: {
        district: { include: { state: true } },
        hospital: true,
        riskFactors: { include: { riskCategory: true } },
        assessment: true,
        screenings: {
          where: { status: 'completed' },
          orderBy: { testedAt: 'desc' },
        },
        followUps: {
          where: { followUpType: 'phone' },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result = [];

    for (const b of babies) {
      // 1. Must have HRR (High Risk Register)
      const hasRiskCategory = (b.riskFactors?.length ?? 0) > 0;
      const hasAssessmentRisk =
        !!b.assessment?.familyHistoryHearingLoss ||
        !!b.assessment?.consanguinityDegree ||
        !!b.assessment?.caregiverConcern;

      if (!hasRiskCategory && !hasAssessmentRisk) continue;

      // 2. Must have passed all tests in screening (latest completed screening has overallResult === 'pass')
      const passScreening = b.screenings.find((s) => s.overallResult === 'pass');
      if (!passScreening) continue;

      // Compile risk factors
      const riskFactorLabels: string[] = [];
      if (b.riskFactors) {
        b.riskFactors.forEach((rf) => {
          if (rf.riskCategory?.label) riskFactorLabels.push(rf.riskCategory.label);
        });
      }
      if (b.assessment?.familyHistoryHearingLoss) riskFactorLabels.push('Family History of Hearing Loss');
      if (b.assessment?.consanguinityDegree) {
        const deg = b.assessment.consanguinityDegree;
        riskFactorLabels.push(`Consanguinity (${deg.charAt(0).toUpperCase() + deg.slice(1)} degree)`);
      }
      if (b.assessment?.caregiverConcern) riskFactorLabels.push('Caregiver Concern');
      if (b.assessment?.craniofacialRemarks) riskFactorLabels.push(`Craniofacial: ${b.assessment.craniofacialRemarks}`);

      // 3. 6 months from screening pass date (or dob/createdAt)
      const refDate = new Date(passScreening.testedAt || b.dob || b.createdAt);
      const dueDate = new Date(refDate);
      dueDate.setMonth(dueDate.getMonth() + 6);
      const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      const phoneFollowUp = b.followUps[0];
      const isCompleted = phoneFollowUp?.status === 'completed';
      const isDue = !isCompleted && dueDateStart.getTime() <= today.getTime();
      const diffTime = dueDateStart.getTime() - today.getTime();
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      result.push({
        id: b.id,
        mrNumber: b.mrNumber ?? '',
        pocdNumber: b.pocdNumber ?? '',
        firstName: b.firstName ?? '',
        lastName: b.lastName ?? '',
        dob: b.dob ? b.dob.toISOString() : '',
        gender: b.gender,
        motherName: b.motherName,
        fatherName: b.fatherName ?? '',
        contactNumber: b.phone1 ?? '',
        whatsappNumber: b.whatsappNumber ?? '',
        phone2: b.phone2 ?? '',
        hospitalName: b.hospital?.name ?? '',
        district: b.district?.name ?? '',
        state: b.district?.state?.name ?? '',
        riskFactors: riskFactorLabels,
        screeningPassDate: refDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: isCompleted ? 'completed' : isDue ? 'due' : 'upcoming',
        isDue,
        daysUntilDue,
        followUpId: phoneFollowUp?.id,
        callStatus: phoneFollowUp?.status,
        callNotes: phoneFollowUp?.notes ?? '',
        callDate: phoneFollowUp?.actualDate ? phoneFollowUp.actualDate.toISOString() : '',
      });
    }

    return result.sort((a, b) => {
      const order: Record<string, number> = { due: 0, upcoming: 1, completed: 2 };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }

  async logPhoneCall(dto: LogPhoneCallDto, actingUserId: string) {
    const existing = await this.prisma.followUp.findFirst({
      where: {
        babyId: dto.babyId,
        followUpType: 'phone',
      },
      orderBy: { createdAt: 'desc' },
    });

    const callDate = dto.callDate ? new Date(dto.callDate) : new Date();

    let followUp;
    if (existing) {
      followUp = await this.prisma.followUp.update({
        where: { id: existing.id },
        data: {
          status: dto.status as any,
          notes: dto.notes,
          nextSteps: dto.nextSteps,
          actualDate: dto.status === 'completed' ? callDate : existing.actualDate,
        },
      });
    } else {
      followUp = await this.prisma.followUp.create({
        data: {
          babyId: dto.babyId,
          followUpType: 'phone',
          scheduledDate: callDate,
          actualDate: dto.status === 'completed' ? callDate : undefined,
          status: dto.status as any,
          notes: dto.notes,
          nextSteps: dto.nextSteps,
          providerId: actingUserId,
        },
      });
    }

    await this.prisma.patientTimeline.create({
      data: {
        babyId: dto.babyId,
        event: 'other',
        description: `6-Month Phone Follow-up: ${dto.status.toUpperCase()}${dto.notes ? ` — ${dto.notes}` : ''}`,
        createdById: actingUserId,
      },
    });

    return followUp;
  }
}
