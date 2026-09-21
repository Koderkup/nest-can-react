import { Controller, Get, Header } from '@nestjs/common';
import { renderPage } from 'nest-can-react';
import WelcomePage from './welcome.page';
import { WelcomeService } from './welcome.service';

@Controller('welcome')
export class WelcomeController {
  constructor(private readonly welcome: WelcomeService) {}

  @Get()
  @Header('content-type', 'text/html')
  index() {
    return renderPage(WelcomePage, this.welcome.getPage(), {
      mode: 'hydrated',
    });
  }
}
