import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateScreeningDto } from '@/screening/dto/create-screening.dto';
import { UpdateScreeningDto } from '@/screening/dto/update-screening.dto';
import { QueryScreeningDto } from '@/screening/dto/query-screening.dto';

@Injectable()
export class ScreeningService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryScreeningDto) {
    // Built dynamically from validated (class-validator @IsIn) query params —
    // cast once to the Prisma input type rather than fighting per-field enum typing.
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.result) where.overallResult = query.result;
    if (query.audiologistId) where.assignedAudiologistId = query.audiologistId;
    if (query.babyId) where.babyId = query.babyId;
    if (query.dateFrom || query.dateTo) {
      where.testedAt = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      };
    }
    if (query.hospitalId || query.districtId || query.state) {
      where.baby = {
        ...(query.hospitalId ? { hospitalId: query.hospitalId } : {}),
        ...(query.districtId ? { districtId: query.districtId } : {}),
        ...(query.state ? { district: { state: { name: query.state } } } : {}),
      };
    }

    return this.prisma.screening.findMany({
      where: where as Prisma.ScreeningWhereInput,
      include: {
        baby: { include: { district: { include: { state: true } }, hospital: true } },
        assignedAudiologist: true,
      },
      orderBy: { testedAt: 'desc' },
    });
  }

  async getById(id: string) {
    const screening = await this.prisma.screening.findUnique({
      where: { id },
      include: { baby: true, assignedAudiologist: true },
    });
    if (!screening) throw new NotFoundException('Screening not found');
    return screening;
  }

  async getByBabyId(babyId: string) {
    return this.prisma.screening.findMany({ where: { babyId }, orderBy: { testedAt: 'desc' } });
  }

  async create(dto: CreateScreeningDto, testedById: string) {
    const data: Record<string, unknown> = {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      testedById,
      assignedAudiologistId: dto.assignedAudiologistId ?? testedById,
      testedAt: new Date(),
    };

    const screening = await this.prisma.screening.create({
      data: data as Prisma.ScreeningUncheckedCreateInput,
    });

    if (screening.status === 'completed') {
      await this.onCompleted(screening.babyId, screening.overallResult, testedById);
    }

    return screening;
  }

  async update(id: string, dto: UpdateScreeningDto, actingUserId: string) {
    const existing = await this.getById(id);

    const data: Record<string, unknown> = {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };

    const screening = await this.prisma.screening.update({
      where: { id },
      data: data as Prisma.ScreeningUncheckedUpdateInput,
    });

    if (existing.status !== 'completed' && screening.status === 'completed') {
      await this.onCompleted(screening.babyId, screening.overallResult, actingUserId);
    }

    return screening;
  }

  private async onCompleted(babyId: string, overallResult: string | null, actingUserId: string) {
    await this.prisma.patientTimeline.create({
      data: {
        babyId,
        event: 'screened',
        description: `Screening completed. Result: ${overallResult ?? 'N/A'}`,
        createdById: actingUserId,
      },
    });
    await this.prisma.baby.update({
      where: { id: babyId },
      data: { status: overallResult === 'refer' ? 'follow_up_required' : 'completed' },
    });
  }
}
