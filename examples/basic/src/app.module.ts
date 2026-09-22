import { Module } from '@nestjs/common';
import { NestReactModule } from 'nest-can-react';
import { HomeController } from './home.controller';
import { NotesModule } from './notes/notes.module';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  controllers: [HomeController],
  imports: [NestReactModule.forRoot(), WelcomeModule, NotesModule],
})
export class AppModule {}
