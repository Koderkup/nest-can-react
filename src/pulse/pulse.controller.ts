import { Controller, Get, Header, Post } from '@nestjs/common';
import { renderPage } from '../core';
import PulsePage from './pulse.page';
import { PulseService } from './pulse.service';

@Controller('pulse')
export class PulseController {
  constructor(private readonly pulse: PulseService) {}

  @Get()
  @Header('content-type', 'text/html')
  index() {
    return renderPage(
      PulsePage,
      { status: this.pulse.getStatus() },
      { mode: 'static' },
    );
  }

  @Post('beat')
  beat() {
    return this.pulse.beat();
  }
}
