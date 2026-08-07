import { Controller, Get, UseGuards, Query, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/strategies/jwt.strategy';
import { DashboardService } from '@/dashboard/dashboard.service';

@ApiTags('dashboard')
@ApiCookieAuth('access_token')
@Controller({ path: 'dashboard', version: '1' })
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Executive overview KPIs' })
  @ApiOkResponse({ description: 'Overview stats' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  getOverview(@Query('year') year?: string, @Query('month') month?: string, @Query('day') day?: string) {
    return this.dashboardService.getOverview(year, month, day);
  }

  @Get('activity-timeline')
  @ApiOperation({ summary: 'Recent activity across all patients' })
  @ApiOkResponse({ description: 'Array of timeline events' })
  getActivityTimeline(@Query('year') year?: string, @Query('month') month?: string, @Query('day') day?: string) {
    return this.dashboardService.getActivityTimeline(year, month, day);
  }

  @Get('high-risk-babies')
  @ApiOperation({ summary: 'Recent high risk babies' })
  @ApiOkResponse({ description: 'Array of high risk babies' })
  getHighRiskBabies(@Query('year') year?: string, @Query('month') month?: string, @Query('day') day?: string) {
    return this.dashboardService.getHighRiskBabies(year, month, day);
  }

  @Get('upcoming-follow-ups')
  @ApiOperation({ summary: 'Upcoming scheduled follow-ups' })
  @ApiOkResponse({ description: 'Array of follow-ups' })
  getUpcomingFollowUps(@Query('year') year?: string, @Query('month') month?: string, @Query('day') day?: string) {
    return this.dashboardService.getUpcomingFollowUps(year, month, day);
  }

  @Get('todays-follow-ups')
  @ApiOperation({ summary: 'Todays scheduled follow-ups' })
  @ApiOkResponse({ description: 'Array of todays follow-ups' })
  getTodaysFollowUps(@Query('year') year?: string, @Query('month') month?: string, @Query('day') day?: string) {
    return this.dashboardService.getTodaysFollowUps(year, month, day);
  }

  @Get('notifications')
  @ApiOperation({
    summary: 'Derived notifications (overdue/due-today follow-ups, high-risk unscreened)',
  })
  @ApiOkResponse({ description: 'Array of notifications' })
  getNotifications(@Query('year') year?: string, @Query('month') month?: string, @Query('day') day?: string) {
    return this.dashboardService.getNotifications(year, month, day);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Gender/urban-rural/state/district/hospital performance analytics' })
  @ApiOkResponse({ description: 'Analytics payload' })
  getAnalytics(@Query('year') year?: string, @Query('month') month?: string, @Query('day') day?: string) {
    return this.dashboardService.getAnalytics(year, month, day);
  }

  @Get('available-years')
  @ApiOperation({ summary: 'Get list of available years in the dataset' })
  @ApiOkResponse({ description: 'Array of years' })
  getAvailableYears() {
    return this.dashboardService.getAvailableYears();
  }

  /**
   * Staff (audiologist) dashboard overview.
   * - Admin: can pass any ?hospitalId= query param.
   * - Audiologist: hospitalId is always taken from their JWT (cannot be overridden).
   */
  @Get('staff-overview')
  @ApiOperation({ summary: 'Hospital-scoped KPIs for staff (audiologist) dashboard' })
  @ApiOkResponse({ description: 'Staff dashboard stats' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  getStaffOverview(
    @CurrentUser() user: JwtPayload,
    @Query('hospitalId') queryHospitalId?: string,
  ) {
    // Audiologists are pinned to their own hospital; admins may specify any hospitalId
    const hospitalId =
      user.role === 'audiologist'
        ? user.hospitalId
        : queryHospitalId ?? user.hospitalId;

    if (!hospitalId) {
      throw new BadRequestException('hospitalId is required for staff overview.');
    }

    return this.dashboardService.getStaffOverview(hospitalId);
  }
}
