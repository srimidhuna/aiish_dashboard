import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DashboardService } from './src/dashboard/dashboard.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dashboardService = app.get(DashboardService);
  const overview = await dashboardService.getOverview();
  console.log('Overview:', overview);
  await app.close();
}
bootstrap();
