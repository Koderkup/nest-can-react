import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { renderPage } from 'nest-can-react';
import { WelcomeService } from './welcome.service';

@Controller('welcome')
export class WelcomeController {
  constructor(private readonly welcome: WelcomeService) {}

  @Get()
  async index(@Req() request: Request, @Res() response: Response) {
    await renderPage('welcome', this.welcome.getPage(), {
      request,
      response,
    });
  }
}
