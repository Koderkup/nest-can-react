import { Controller, Get, Header } from '@nestjs/common';
import { renderPage } from 'nest-react';
import WelcomePage from './welcome.page';
import { WelcomeService } from './welcome.service';

@Controller()
export class WelcomeController {
  constructor(private readonly welcome: WelcomeService) {}

  @Get()
  @Header('content-type', 'text/html')
  home() {
    return this.index();
  }

  @Get('welcome')
  @Header('content-type', 'text/html')
  index() {
    return renderPage(WelcomePage, this.welcome.getPage(), {
      mode: 'hydrated',
    });
  }
}
