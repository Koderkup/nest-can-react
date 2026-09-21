import { Controller, Get, Header, Post, UseGuards } from '@nestjs/common';
import { renderPage } from '../core';
import PulsePage from './pulse.page';
import { PulseService } from './pulse.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('pulse')
export class PulseController {
  constructor(private readonly pulse: PulseService) {}
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @Header('content-type', 'text/html')
  index() {
    return renderPage(
      <PulsePage status={this.pulse.getStatus()} />,

      { mode: 'static' },
    );
  }

  @Post('beat')
  beat() {
    return this.pulse.beat();
  }
}
