import { Controller, Get, Header } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import Dashboard from './frontend/pages/dashboard';
import Home from './frontend/pages/home';
import Users from './frontend/pages/users';
import { renderPage } from './frontend/renderer';

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
