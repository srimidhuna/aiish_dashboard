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
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/strategies/jwt.strategy';
import { BabiesService } from '@/babies/babies.service';
import { CreateBabyDto } from '@/babies/dto/create-baby.dto';
import { UpdateBabyDto } from '@/babies/dto/update-baby.dto';
import { QueryBabiesDto } from '@/babies/dto/query-babies.dto';

@ApiTags('babies')
@ApiCookieAuth('access_token')
@Controller({ path: 'babies', version: '1' })
@UseGuards(JwtAuthGuard)
export class BabiesController {
  constructor(private readonly babiesService: BabiesService) {}

  @Get()
  @ApiOperation({ summary: 'List babies (filterable)' })
  @ApiOkResponse({ description: 'Array of babies' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  findAll(@Query() query: QueryBabiesDto) {
    return this.babiesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single baby by id' })
  @ApiOkResponse({ description: 'Baby detail' })
  findOne(@Param('id') id: string) {
    return this.babiesService.getById(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: "Get a baby's patient timeline" })
  @ApiOkResponse({ description: 'Array of timeline events' })
  getTimeline(@Param('id') id: string) {
    return this.babiesService.getTimeline(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new baby' })
  @ApiOkResponse({ description: 'Created baby' })
  create(@Body() dto: CreateBabyDto, @CurrentUser() user: JwtPayload) {
    return this.babiesService.create(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a baby' })
  @ApiOkResponse({ description: 'Updated baby' })
  update(@Param('id') id: string, @Body() dto: UpdateBabyDto) {
    return this.babiesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a baby' })
  @ApiOkResponse({ description: 'Deletion confirmation' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.babiesService.remove(id, user.sub);
  }
}
