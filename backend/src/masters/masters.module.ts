import { Module } from '@nestjs/common';
import { MastersController } from '@/masters/masters.controller';
import { MastersService } from '@/masters/masters.service';

@Module({
  controllers: [MastersController],
  providers: [MastersService],
})
export class MastersModule {}
