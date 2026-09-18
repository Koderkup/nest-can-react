import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { renderPage } from '../core';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import LoginPage from './login.page';
import ProfilePage from './profile.page';
import RegisterPage from './register.page';

type JwtRequest = Request & {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
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

  @Get('profile')
  @Header('content-type', 'text/html')
  profilePage() {
    return renderPage(ProfilePage, {}, { mode: 'hydrated' });
  }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: JwtRequest) {
    return { user: req.user };
  }
}
