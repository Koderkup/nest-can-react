import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { render } from 'nest-can-react';
import { NotePage, NotesPage } from '../react-pages';
import { NotesService } from './notes.service';
import { NoteDraft } from './notes.types';

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  index() {
    return render(NotesPage);
  }

  @Get(':id')
  show() {
    return render(NotePage);
  }

  @Post()
  create(@Body() body: NoteDraft) {
    return this.notes.create(body);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.notes.setStatus(id, 'archived');
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.notes.setStatus(id, 'open');
  }

  @Post(':id/pin')
  pin(@Param('id') id: string) {
    return this.notes.togglePin(id);
  }

  @Post(':id/delete')
  remove(@Param('id') id: string) {
    return this.notes.remove(id);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() body: NoteDraft) {
    return this.notes.update(id, body);
  }
}
