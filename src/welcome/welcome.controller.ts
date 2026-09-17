import { Controller, Get, Header } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { renderPage } from '../core';
import WelcomePage from './welcome.page';

@Controller()
export class WelcomeController {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Get()
  @Header('content-type', 'text/html')
  index() {
    return renderPage(WelcomePage, this.moduleRef, { mode: 'static' });
  }
}
