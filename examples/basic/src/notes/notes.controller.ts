import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { renderPage } from 'nest-can-react';
import { NotesService } from './notes.service';
import { NoteDraft } from './notes.types';

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  async index(
    @Query('q') q: string | undefined,
    @Query('status') status: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    await renderPage('notes', this.notes.listPage({ q, status }), {
      request,
      response,
    });
  }

  @Get(':id')
  async show(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      await renderPage('note', this.notes.detailPage(id), {
        request,
        response,
      });
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      await renderPage(
        'missing',
        { id, resource: 'Note' },
        {
          request,
          response,
          statusCode: 404,
        },
      );
    }
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
