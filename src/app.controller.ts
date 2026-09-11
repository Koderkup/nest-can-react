import { Controller, Get, Header } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import Dashboard from './demo/pages/dashboard';
import Home from './demo/pages/home';
import Users from './demo/pages/users';
import { renderPage } from './core/renderer';

@Controller()
export class AppController {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Get()
  @Header('content-type', 'text/html')
  home() {
    return renderPage(Home, this.moduleRef);
  }

  @Get('users')
  @Header('content-type', 'text/html')
  users() {
    return renderPage(Users, this.moduleRef);
  }

  @Get('dashboard')
  @Header('content-type', 'text/html')
  dashboard() {
    return renderPage(Dashboard, this.moduleRef);
  }
}
