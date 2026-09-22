import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller()
export class HomeController {
  @Get()
  home(@Res() response: Response) {
    response.redirect('/notes');
  }
}
