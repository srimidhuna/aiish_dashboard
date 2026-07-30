import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '@/common/prisma/prisma.module';
import { HealthModule } from '@/health/health.module';
import { AuthModule } from '@/auth/auth.module';
import { BabiesModule } from '@/babies/babies.module';
import { ScreeningModule } from '@/screening/screening.module';
import { FollowUpModule } from '@/follow-up/follow-up.module';
import { MastersModule } from '@/masters/masters.module';
import { DashboardModule } from '@/dashboard/dashboard.module';

@Module({
  imports: [
    // Config — loads .env and makes ConfigService available globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Shared Prisma client — global, available in all feature modules
    PrismaModule,

    // Unversioned /health endpoint
    HealthModule,

    // Feature modules
    AuthModule,
    BabiesModule,
    ScreeningModule,
    FollowUpModule,
    MastersModule,
    DashboardModule,
  ],
})
export class AppModule {}
