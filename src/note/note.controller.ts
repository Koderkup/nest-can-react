import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { renderPage } from '../core';
import NotePage from './note.page';
import { NoteService } from './note.service';

@Controller('note')
export class NoteController {
  constructor(private readonly notes: NoteService) {}

  @Get()
  @Header('content-type', 'text/html')
  index() {
    return renderPage(
      NotePage,
      { text: this.notes.getText() },
      { mode: 'hydrated' },
    );
  }

  @Post()
  save(@Body() body: { text?: string }) {
    return { text: this.notes.save(body.text ?? '') };
  }
}
