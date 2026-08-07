import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { MastersService } from '@/masters/masters.service';
import { CreateHospitalDto } from '@/masters/dto/create-hospital.dto';
import { UpdateHospitalDto } from '@/masters/dto/update-hospital.dto';
import { HospitalQueryDto } from '@/masters/dto/hospital-query.dto';
import { CreateStaffDto } from '@/masters/dto/create-staff.dto';

@ApiTags('masters')
@ApiCookieAuth('access_token')
@Controller({ path: 'masters', version: '1' })
@UseGuards(JwtAuthGuard)
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

  @Get('states')
  @ApiOperation({ summary: 'List all states' })
  @ApiOkResponse({ description: 'Array of states' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  listStates() {
    return this.mastersService.listStates();
  }

  @Get('districts')
  @ApiOperation({ summary: 'List districts, optionally filtered by state name' })
  @ApiOkResponse({ description: 'Array of districts' })
  listDistricts(@Query('state') state?: string) {
    return this.mastersService.listDistricts(state);
  }

  @Get('hospitals')
  @ApiOperation({
    summary: 'List hospitals with computed stats, filterable by search/state/district',
  })
  @ApiOkResponse({ description: 'Array of hospitals with stats' })
  listHospitals(@Query() query: HospitalQueryDto) {
    return this.mastersService.listHospitals(query);
  }

  @Get('hospitals/:id')
  @ApiOperation({ summary: 'Get a single hospital by id, with computed stats' })
  @ApiOkResponse({ description: 'Hospital detail' })
  getHospital(@Param('id') id: string) {
    return this.mastersService.getHospitalById(id);
  }

  @Post('hospitals')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a hospital (admin only)' })
  @ApiOkResponse({ description: 'Created hospital' })
  createHospital(@Body() dto: CreateHospitalDto) {
    return this.mastersService.createHospital(dto);
  }

  @Patch('hospitals/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update a hospital (admin only)' })
  @ApiOkResponse({ description: 'Updated hospital' })
  updateHospital(@Param('id') id: string, @Body() dto: UpdateHospitalDto) {
    return this.mastersService.updateHospital(id, dto);
  }

  @Delete('hospitals/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a hospital (admin only)' })
  @ApiOkResponse({ description: 'Deletion confirmation' })
  deleteHospital(@Param('id') id: string) {
    return this.mastersService.deleteHospital(id);
  }

  @Get('audiologists')
  @ApiOperation({ summary: 'List audiologist users, optionally filtered by hospital' })
  @ApiOkResponse({ description: 'Array of audiologists' })
  listAudiologists(@Query('hospitalId') hospitalId?: string) {
    return this.mastersService.listAudiologists(hospitalId);
  }

  @Get('risk-categories')
  @ApiOperation({ summary: 'List risk category master data' })
  @ApiOkResponse({ description: 'Array of risk categories' })
  listRiskCategories() {
    return this.mastersService.listRiskCategories();
  }

  @Get('recommendation-types')
  @ApiOperation({ summary: 'List recommendation type master data' })
  @ApiOkResponse({ description: 'Array of recommendation types' })
  listRecommendationTypes() {
    return this.mastersService.listRecommendationTypes();
  }

  @Get('staff')
  @ApiOperation({ summary: 'List staff, optionally filtered by hospital' })
  @ApiOkResponse({ description: 'Array of staff members' })
  listStaff(@Query('hospitalId') hospitalId?: string) {
    return this.mastersService.listStaff(hospitalId);
  }

  @Post('staff')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Register a new staff member (admin only)' })
  @ApiOkResponse({ description: 'Created staff member' })
  createStaff(@Body() dto: CreateStaffDto) {
    return this.mastersService.createStaff(dto);
  }

  @Delete('staff/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Remove a staff member (admin only)' })
  @ApiOkResponse({ description: 'Deletion confirmation' })
  deleteStaff(@Param('id') id: string) {
    return this.mastersService.deleteStaff(id);
  }
}
