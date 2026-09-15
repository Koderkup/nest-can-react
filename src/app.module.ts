import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { NestReactModule } from './core';
import { DashboardService } from './demo/services/dashboard.service';
import { GreetingService } from './demo/services/greeting.service';
import { UsersService } from './demo/services/users.service';

@Module({
  imports: [NestReactModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, DashboardService, GreetingService, UsersService],
})
export class AppModule {}
