import { Controller, Get, Header } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { renderPage } from '../core';
import NotePage from './note.page';

@Controller('note')
export class NoteController {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Get()
  @Header('content-type', 'text/html')
  index() {
    return renderPage(NotePage, this.moduleRef, { mode: 'hydrated' });
  }
}
