import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { DashboardService } from './dashboard.service';
import { NestReactModule } from './frontend/nest-react.module';
import { GreetingService } from './greeting.service';
import { UsersService } from './users.service';

@Module({
  imports: [NestReactModule],
  controllers: [AppController],
  providers: [AppService, DashboardService, GreetingService, UsersService],
})
export class AppModule {}
