import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { GreetingService } from './greeting.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [GreetingService, AppService],
})
export class AppModule {}
