import { Module } from '@nestjs/common';
import { FollowUpController } from '@/follow-up/follow-up.controller';
import { FollowUpService } from '@/follow-up/follow-up.service';

@Module({
  controllers: [FollowUpController],
  providers: [FollowUpService],
})
export class FollowUpModule {}
