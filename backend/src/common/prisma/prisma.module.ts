import { Global, Module } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

/**
 * PrismaModule is marked @Global so PrismaService can be injected
 * into any feature module without needing to import PrismaModule there.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
