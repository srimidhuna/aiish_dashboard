import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateHospitalDto } from '@/masters/dto/create-hospital.dto';
import { UpdateHospitalDto } from '@/masters/dto/update-hospital.dto';
import { HospitalQueryDto } from '@/masters/dto/hospital-query.dto';
import { CreateStaffDto } from '@/masters/dto/create-staff.dto';

@Injectable()
export class MastersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Geography ────────────────────────────────────────────────────────────

  async listStates() {
    return this.prisma.state.findMany({ orderBy: { name: 'asc' } });
  }

  async listDistricts(state?: string) {
    return this.prisma.district.findMany({
      where: state ? { state: { name: state } } : undefined,
      include: { state: true },
      orderBy: { name: 'asc' },
    });
  }

  // ── Hospitals ────────────────────────────────────────────────────────────

  private async withStats(hospitalId: string) {
    const [totalChildren, totalScreenings, referCount, pendingFollowUps] = await Promise.all([
      this.prisma.baby.count({ where: { hospitalId, deletedAt: null } }),
      this.prisma.screening.count({ where: { baby: { hospitalId }, status: 'completed' } }),
      this.prisma.screening.count({
        where: { baby: { hospitalId }, status: 'completed', overallResult: 'refer' },
      }),
      this.prisma.followUp.count({
        where: { baby: { hospitalId }, status: { in: ['scheduled', 'rescheduled'] } },
      }),
    ]);

    return {
      totalChildren,
      totalScreenings,
      referralCount: referCount,
      pendingFollowUps,
    };
  }

  async listHospitals(query: HospitalQueryDto) {
    const where: Prisma.HospitalWhereInput = {};
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query.districtId) {
      where.districtId = query.districtId;
    }
    if (query.state) {
      where.district = { state: { name: query.state } };
    }

    const hospitals = await this.prisma.hospital.findMany({
      where,
      include: { district: { include: { state: true } }, primaryAudiologist: true },
      orderBy: { name: 'asc' },
    });

    return Promise.all(
      hospitals.map(async (h) => ({
        ...h,
        district: h.district.name,
        state: h.district.state.name,
        stats: await this.withStats(h.id),
      })),
    );
  }

  async getHospitalById(id: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
      include: { district: { include: { state: true } }, primaryAudiologist: true },
    });
    if (!hospital) throw new NotFoundException('Hospital not found');

    return {
      ...hospital,
      district: hospital.district.name,
      state: hospital.district.state.name,
      stats: await this.withStats(hospital.id),
    };
  }

  async createHospital(dto: CreateHospitalDto) {
    return this.prisma.hospital.create({ data: dto });
  }

  async updateHospital(id: string, dto: UpdateHospitalDto) {
    await this.getHospitalById(id);
    return this.prisma.hospital.update({ where: { id }, data: dto });
  }

  async deleteHospital(id: string) {
    await this.getHospitalById(id);
    await this.prisma.hospital.delete({ where: { id } });
    return { message: 'Hospital deleted successfully.' };
  }

  // ── Audiologists (Users with role=audiologist) ──────────────────────────

  async listAudiologists(hospitalId?: string) {
    return this.prisma.user.findMany({
      where: {
        role: 'audiologist',
        deletedAt: null,
        ...(hospitalId ? { hospitalId } : {}),
      },
      select: { id: true, fullName: true, email: true, hospitalId: true },
      orderBy: { fullName: 'asc' },
    });
  }

  // ── Risk categories / recommendation types ──────────────────────────────

  async listRiskCategories() {
    return this.prisma.riskCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async listRecommendationTypes() {
    return this.prisma.recommendationType.findMany({ orderBy: { label: 'asc' } });
  }

  // ── Staff ────────────────────────────────────────────────────────────────

  async listStaff(hospitalId?: string) {
    return this.prisma.staff.findMany({
      where: hospitalId ? { hospitalId } : undefined,
      orderBy: { fullName: 'asc' },
    });
  }

  async createStaff(dto: CreateStaffDto) {
    const { dateOfBirth, ...rest } = dto;
    return this.prisma.staff.create({
      data: {
        ...rest,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
    });
  }

  async deleteStaff(id: string) {
    const existing = await this.prisma.staff.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Staff member not found');
    await this.prisma.staff.update({ where: { id }, data: { status: 'deleted' } });
    return { message: 'Staff member removed successfully' };
  }
}
