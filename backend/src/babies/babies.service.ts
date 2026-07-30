import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateBabyDto } from '@/babies/dto/create-baby.dto';
import { UpdateBabyDto } from '@/babies/dto/update-baby.dto';
import { QueryBabiesDto } from '@/babies/dto/query-babies.dto';

const BABY_INCLUDE = {
  district: { include: { state: true } },
  hospital: true,
  riskFactors: { include: { riskCategory: true } },
  assessment: true,
  screenings: { orderBy: { testedAt: Prisma.SortOrder.desc } },
} satisfies Prisma.BabyInclude;

@Injectable()
export class BabiesService {
  constructor(private readonly prisma: PrismaService) {}

  private denormalize<T extends { district: { name: string; state: { name: string } } }>(baby: T) {
    return { ...baby, district: baby.district.name, state: baby.district.state.name };
  }

  async list(query: QueryBabiesDto) {
    const where: Prisma.BabyWhereInput = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { mrNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.hospitalId) where.hospitalId = query.hospitalId;
    if (query.districtId) where.districtId = query.districtId;
    if (query.state) where.district = { state: { name: query.state } };
    if (query.gender) where.gender = query.gender;
    if (query.riskFactor === 'YES') where.riskFactors = { some: {} };
    if (query.riskFactor === 'NO') where.riskFactors = { none: {} };
    if (query.audiologistId) {
      where.screenings = { some: { assignedAudiologistId: query.audiologistId } };
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      };
    }

    const babies = await this.prisma.baby.findMany({
      where,
      include: BABY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    const denormalized = babies.map((b) => this.denormalize(b));

    if (!query.referralStatus || query.referralStatus === 'ALL') {
      return denormalized;
    }

    return denormalized.filter((b) => {
      const latestCompleted = b.screenings.find((s) => s.status === 'completed');
      const status = latestCompleted
        ? latestCompleted.overallResult === 'refer'
          ? 'REFER'
          : 'PASS'
        : 'PENDING';
      return status === query.referralStatus;
    });
  }

  async getById(id: string) {
    const baby = await this.prisma.baby.findFirst({
      where: { id, deletedAt: null },
      include: BABY_INCLUDE,
    });
    if (!baby) throw new NotFoundException('Baby not found');
    return this.denormalize(baby);
  }

  async getTimeline(babyId: string) {
    await this.getById(babyId);
    return this.prisma.patientTimeline.findMany({
      where: { babyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateBabyDto, createdById: string) {
    const { riskFactorIds, assessment, ...babyData } = dto;

    const baby = await this.prisma.baby.create({
      data: {
        ...(babyData as Prisma.BabyUncheckedCreateInput),
        dob: new Date(dto.dob),
        createdById,
        riskFactors: riskFactorIds?.length
          ? { create: riskFactorIds.map((riskCategoryId) => ({ riskCategoryId })) }
          : undefined,
        assessment: assessment
          ? { create: assessment as Prisma.AudiologistAssessmentUncheckedCreateWithoutBabyInput }
          : undefined,
      },
      include: BABY_INCLUDE,
    });

    await this.prisma.patientTimeline.create({
      data: {
        babyId: baby.id,
        event: 'registered',
        description: 'Registered in the system',
        createdById,
      },
    });

    return this.denormalize(baby);
  }

  async update(id: string, dto: UpdateBabyDto) {
    await this.getById(id);
    const { riskFactorIds, assessment, dob, ...babyData } = dto;

    if (riskFactorIds) {
      await this.prisma.babyRiskFactor.deleteMany({ where: { babyId: id } });
      if (riskFactorIds.length) {
        await this.prisma.babyRiskFactor.createMany({
          data: riskFactorIds.map((riskCategoryId) => ({ babyId: id, riskCategoryId })),
        });
      }
    }

    if (assessment) {
      await this.prisma.audiologistAssessment.upsert({
        where: { babyId: id },
        update: assessment as Prisma.AudiologistAssessmentUncheckedUpdateInput,
        create: {
          babyId: id,
          ...(assessment as Prisma.AudiologistAssessmentUncheckedCreateWithoutBabyInput),
        },
      });
    }

    const baby = await this.prisma.baby.update({
      where: { id },
      data: {
        ...(babyData as Prisma.BabyUncheckedUpdateInput),
        ...(dob ? { dob: new Date(dob) } : {}),
      },
      include: BABY_INCLUDE,
    });

    return this.denormalize(baby);
  }

  async remove(id: string, deletedById: string) {
    await this.getById(id);
    await this.prisma.baby.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById },
    });
    return { message: 'Baby deleted successfully.' };
  }
}
