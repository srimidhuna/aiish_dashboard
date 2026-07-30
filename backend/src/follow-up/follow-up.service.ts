import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateFollowUpDto } from '@/follow-up/dto/create-follow-up.dto';
import { UpdateFollowUpDto } from '@/follow-up/dto/update-follow-up.dto';
import { QueryFollowUpDto } from '@/follow-up/dto/query-follow-up.dto';

const FOLLOW_UP_INCLUDE = {
  baby: true,
  recommendations: { include: { recommendationType: true } },
} satisfies Prisma.FollowUpInclude;

@Injectable()
export class FollowUpService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryFollowUpDto) {
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
}
