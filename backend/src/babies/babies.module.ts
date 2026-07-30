import { Module } from '@nestjs/common';
import { BabiesController } from '@/babies/babies.controller';
import { BabiesService } from '@/babies/babies.service';

@Module({
  controllers: [BabiesController],
  providers: [BabiesService],
})
export class BabiesModule {}
