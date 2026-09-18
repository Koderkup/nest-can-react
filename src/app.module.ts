import { Module } from '@nestjs/common';
import { NestReactModule } from './core';
import { AuthModule } from './auth/auth.module';
import { NoteModule } from './note/note.module';
import { PulseModule } from './pulse/pulse.module';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  imports: [
    NestReactModule.forRoot(),
    WelcomeModule,
    NoteModule,
    PulseModule,
    AuthModule,
  ],
})
export class AppModule {}
