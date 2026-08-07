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
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/strategies/jwt.strategy';
import { FollowUpService } from '@/follow-up/follow-up.service';
import { CreateFollowUpDto } from '@/follow-up/dto/create-follow-up.dto';
import { UpdateFollowUpDto } from '@/follow-up/dto/update-follow-up.dto';
import { QueryFollowUpDto } from '@/follow-up/dto/query-follow-up.dto';
import { UpdateStatusDto } from '@/follow-up/dto/update-status.dto';
import { RescheduleDto } from '@/follow-up/dto/reschedule.dto';

@ApiTags('follow-up')
@ApiCookieAuth('access_token')
@Controller({ path: 'follow-up', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Get()
  @ApiOperation({ summary: 'List follow-ups (filterable) — admin only' })
  @ApiOkResponse({ description: 'Array of follow-ups' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  findAll(@Query() query: QueryFollowUpDto) {
    return this.followUpService.list(query);
  }

  @Get('by-baby/:babyId')
  @ApiOperation({ summary: 'List all follow-ups for a baby — admin only' })
  @ApiOkResponse({ description: 'Array of follow-ups' })
  findByBaby(@Param('babyId') babyId: string) {
    return this.followUpService.getByBabyId(babyId);
  }

  @Post()
  @ApiOperation({ summary: 'Schedule a follow-up — admin only' })
  @ApiOkResponse({ description: 'Created follow-up' })
  create(@Body() dto: CreateFollowUpDto, @CurrentUser() user: JwtPayload) {
    return this.followUpService.create(dto, user.sub, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a follow-up — admin only' })
  @ApiOkResponse({ description: 'Updated follow-up' })
  update(@Param('id') id: string, @Body() dto: UpdateFollowUpDto) {
    return this.followUpService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update follow-up status — admin only' })
  @ApiOkResponse({ description: 'Updated follow-up' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.followUpService.updateStatus(id, dto.status, user.sub);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a follow-up — admin only' })
  @ApiOkResponse({ description: 'Updated follow-up' })
  reschedule(@Param('id') id: string, @Body() dto: RescheduleDto, @CurrentUser() user: JwtPayload) {
    return this.followUpService.reschedule(id, dto.scheduledDate, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a follow-up — admin only' })
  @ApiOkResponse({ description: 'Deletion confirmation' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.followUpService.remove(id, user.sub);
  }
}
