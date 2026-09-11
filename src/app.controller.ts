import { Controller, Get } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import Home from './frontend/pages/home';
import { renderPage } from './frontend/renderer';

@Controller()
export class AppController {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Get()
  home() {
    return renderPage(Home);
  }
}