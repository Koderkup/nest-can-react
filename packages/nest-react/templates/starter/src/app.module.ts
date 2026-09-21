import { Module } from '@nestjs/common';
import { NestReactModule } from 'nest-react';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
})
export class AppModule {}
