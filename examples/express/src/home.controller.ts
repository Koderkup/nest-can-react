import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class HomeController {
  @Get()
  @Redirect('/notes')
  home() {}
}
