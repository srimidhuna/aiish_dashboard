import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateHospitalDto } from '@/masters/dto/create-hospital.dto';
import { UpdateHospitalDto } from '@/masters/dto/update-hospital.dto';
import { HospitalQueryDto } from '@/masters/dto/hospital-query.dto';
import { CreateStaffDto } from '@/masters/dto/create-staff.dto';
import { UpdateStaffDto } from '@/masters/dto/update-staff.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class MastersService {
  private readonly logger = new Logger(MastersService.name);

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
    try {
      await this.prisma.hospital.delete({ where: { id } });
    } catch (err: unknown) {
      // Prisma P2003 = foreign key constraint — hospital has babies/users linked
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete this hospital because it has children or users linked to it. ' +
          'Please reassign or remove them first.',
        );
      }
      throw err;
    }
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
    const { dateOfBirth, password, ...rest } = dto;

    // Check for duplicate email across both Staff and User tables, and duplicate employeeId
    const [existingStaff, existingUser, existingEmployee] = await Promise.all([
      this.prisma.staff.findFirst({ where: { email: dto.email } }),
      this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } }),
      this.prisma.staff.findUnique({ where: { employeeId: dto.employeeId } }),
    ]);
    if (existingStaff || existingUser) {
      throw new ConflictException(
        `A staff member or user account with email "${dto.email}" already exists.`,
      );
    }
    if (existingEmployee) {
      throw new ConflictException(
        `A staff member with Employee ID "${dto.employeeId}" already exists.`,
      );
    }

    // Map staff role string to a valid UserRole enum value
    const userRoleMap: Record<string, UserRole> = {
      audiologist: UserRole.audiologist,
      doctor: UserRole.doctor,
    };
    const userRole: UserRole = userRoleMap[dto.role] ?? UserRole.audiologist;

    // Hash password — never store plain text
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Require hospitalId for User (User.hospitalId is non-nullable in the schema)
    const hospitalId = dto.hospitalId;
    if (!hospitalId) {
      throw new BadRequestException(
        'hospitalId is required when registering a staff member so a login account can be created.',
      );
    }

    // Execute both inserts in a transaction
    const [staff] = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          hospitalId,
          role: userRole,
        },
      });

      const newStaff = await tx.staff.create({
        data: {
          ...rest,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        },
      });

      this.logger.log(
        `Staff registered: employeeId=${newStaff.employeeId}, userId=${newUser.id}, role=${userRole}`,
      );

      return [newStaff, newUser] as const;
    });

    return staff;
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    const existing = await this.prisma.staff.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Staff member not found');

    const { dateOfBirth, email, password, ...rest } = dto;
    
    // We will update both the Staff table and optionally the User table (if email is changing and user was found by original email/staff logic).
    // The easiest way is to find the corresponding user. Here we can match by email since the staff usually shares email with user.
    // However, if email is updated, we need to update the User table as well.
    let userToUpdate = null;
    if (existing.email) {
       userToUpdate = await this.prisma.user.findUnique({ where: { email: existing.email } });
    }

    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    const [staff] = await this.prisma.$transaction(async (tx) => {
      const updatedStaff = await tx.staff.update({
        where: { id },
        data: {
          ...rest,
          ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
          ...(email ? { email } : {}),
        },
      });

      // if email or role changed, sync to user table
      if (userToUpdate && (email || rest.role || rest.fullName || passwordHash)) {
        await tx.user.update({
          where: { id: userToUpdate.id },
          data: {
            ...(email ? { email } : {}),
            ...(rest.fullName ? { fullName: rest.fullName } : {}),
            ...(passwordHash ? { passwordHash } : {}),
            // if role changed, we could update it too, but omitting for now to prevent breaking enums unless needed.
          }
        });
      }

      return [updatedStaff];
    });

    return staff;
  }

  async deleteStaff(id: string) {
    const existing = await this.prisma.staff.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Staff member not found');
    await this.prisma.staff.update({ where: { id }, data: { status: 'deleted' } });
    return { message: 'Staff member removed successfully' };
  }
}
