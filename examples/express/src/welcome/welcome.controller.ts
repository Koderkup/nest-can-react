import { Controller, Get } from '@nestjs/common';
import { render } from 'nest-can-react';
import { WelcomePage } from '../react-pages';

@Controller('welcome')
export class WelcomeController {
  @Get()
  index() {
    return render(WelcomePage);
  }
}
