import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NestReactModule } from 'nest-react';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
