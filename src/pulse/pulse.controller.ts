import { Controller, Get, Header, Res } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Response } from 'express';
import { renderPage } from '../core';
import PulsePage from './pulse.page';

@Controller('pulse')
export class PulseController {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Get()
  @Header('content-type', 'text/html')
  index(@Res() response: Response) {
    return renderPage(PulsePage, this.moduleRef, {
      mode: 'streaming',
      response,
    });
  }
}
