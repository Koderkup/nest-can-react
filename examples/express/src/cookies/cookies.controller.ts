import { Controller, Get } from '@nestjs/common';
import { render } from 'nest-can-react';
import { CookiesPage, ClearCookiePage } from '../react-pages';

@Controller('cookies')
export class CookiesController {
  @Get()
  set() {
    return render(CookiesPage);
  }

  @Get('clear')
  clear() {
    return render(ClearCookiePage);
  }
}
