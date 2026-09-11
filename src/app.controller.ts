import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import Home, { greetingLoad } from './frontend/pages/home';
import { commit, revalidate } from './frontend/commit';
import { runWithFrontendContext } from './frontend/context';
import { inject } from './frontend/inject';
import { refreshLoad } from './frontend/load';
import { renderPage } from './frontend/renderer';
import { GreetingService } from './greeting.service';

const updateGreeting = commit(async (message: string) => {
  inject<GreetingService>(GreetingService).setGreeting(message);
  return revalidate(greetingLoad.key);
});

@Controller()
export class AppController {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Get()
  @Header('content-type', 'text/html')
  home() {
    return renderPage(Home, this.moduleRef);
  }

  @Get('__nest-react/load/:key')
  refresh(@Param('key') key: string) {
    return refreshLoad(key, this.moduleRef);
  }

  @Post('greeting')
  updateGreeting(@Body('message') message: string) {
    return runWithFrontendContext(this.moduleRef, undefined, () =>
      updateGreeting(message),
    );
  }
}
