import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { renderPage } from '../core';
import { clearAuthCookie, setAuthCookie } from './auth-token.utils';
import { AuthService } from './auth.service';
import type { ProfileUser } from './auth.types';
import { CreateUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import LoginPage from './login.page';
import ProfilePage from './profile.page';
import RegisterPage from './register.page';

type JwtRequest = Request & {
  user?: ProfileUser;
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('login')
  @Header('content-type', 'text/html')
  loginPage() {
    return renderPage(LoginPage, {}, { mode: 'hydrated' });
  }

  @Get('register')
  @Header('content-type', 'text/html')
  registerPage() {
    return renderPage(RegisterPage, {}, { mode: 'hydrated' });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @Header('content-type', 'text/html')
  profilePage(@Req() req: JwtRequest) {
    return renderPage(
      ProfilePage,
      { user: req.user! },
      { mode: 'hydrated' },
    );
  }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = this.authService.login(loginUserDto);
    setAuthCookie(res, result.token);

    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);

    return { ok: true as const };
  }
}
