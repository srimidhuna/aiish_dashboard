import { Module } from '@nestjs/common';
import { ScreeningController } from '@/screening/screening.controller';
import { ScreeningService } from '@/screening/screening.service';

@Module({
  controllers: [ScreeningController],
  providers: [ScreeningService],
})
export class ScreeningModule {}
