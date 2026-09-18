import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { renderPage } from '../core';
import AuthPage from './auth.page';
import { AuthService } from './auth.service';
import { PublicUser } from './auth.types';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

type AuthRequest = Request & { user?: PublicUser };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  @Header('content-type', 'text/html')
  index() {
    return renderPage(AuthPage, {}, { mode: 'hydrated' });
  }

  @Post('register')
  register(@Body() body: { email?: string; password?: string }) {
    return this.auth.register(body.email ?? '', body.password ?? '');
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: AuthRequest) {
    return this.auth.login(req.user!);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Headers('authorization') authorization?: string) {
    return this.auth.logout(extractBearerToken(authorization));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthRequest) {
    return { user: req.user };
  }
}

function extractBearerToken(authorization?: string) {
  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }

  return authorization.slice('Bearer '.length).trim();
}
