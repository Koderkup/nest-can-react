import { Controller, Get, Header, Res } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Response } from 'express';

import Dashboard from './demo/pages/dashboard.page';
import Home from './demo/pages/home.page';
import Users from './demo/pages/users.page';
import { renderPage } from './core/renderer';

@Controller()
export class AppController {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Get()
  @Header('content-type', 'text/html')
  home() {
    return renderPage(Home, this.moduleRef, { mode: 'static' });
  }

  @Get('users')
  @Header('content-type', 'text/html')
  users() {
    return renderPage(Users, this.moduleRef, { mode: 'hydrated' });
  }

  @Get('dashboard')
  dashboard(@Res() response: Response) {
    return renderPage(Dashboard, this.moduleRef, {
      mode: 'streaming',
      response,
    });
  }
}
