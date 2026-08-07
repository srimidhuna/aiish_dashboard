import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
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
import { ScreeningService } from '@/screening/screening.service';
import { CreateScreeningDto } from '@/screening/dto/create-screening.dto';
import { UpdateScreeningDto } from '@/screening/dto/update-screening.dto';
import { QueryScreeningDto } from '@/screening/dto/query-screening.dto';

@ApiTags('screening')
@ApiCookieAuth('access_token')
@Controller({ path: 'screening', version: '1' })
@UseGuards(JwtAuthGuard)
export class ScreeningController {
  constructor(private readonly screeningService: ScreeningService) {}

  @Get()
  @ApiOperation({ summary: 'List screenings (filterable)' })
  @ApiOkResponse({ description: 'Array of screenings' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  findAll(@Query() query: QueryScreeningDto, @CurrentUser() user: JwtPayload) {
    // Staff (audiologist) can only see screenings from their own hospital
    if (user.role === 'audiologist' && user.hospitalId) {
      query.hospitalId = user.hospitalId;
    }
    return this.screeningService.list(query);
  }

  @Get('by-baby/:babyId')
  @ApiOperation({ summary: 'List all screenings for a baby' })
  @ApiOkResponse({ description: 'Array of screenings' })
  findByBaby(@Param('babyId') babyId: string) {
    return this.screeningService.getByBabyId(babyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single screening by id' })
  @ApiOkResponse({ description: 'Screening detail' })
  findOne(@Param('id') id: string) {
    return this.screeningService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a screening (draft, scheduled, or completed)' })
  @ApiOkResponse({ description: 'Created screening' })
  create(@Body() dto: CreateScreeningDto, @CurrentUser() user: JwtPayload) {
    return this.screeningService.create(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a screening (e.g. draft/scheduled -> completed)' })
  @ApiOkResponse({ description: 'Updated screening' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScreeningDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.screeningService.update(id, dto, user.sub);
  }
}
