import type { Request, Response } from 'express';
import { ExtractJwt } from 'passport-jwt';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';

const cookieMaxAgeMs = 60 * 60 * 1000;

export function extractAccessToken(req: Request): string | null {
  const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

  if (fromHeader) {
    return fromHeader;
  }

  const cookie = req.cookies?.[ACCESS_TOKEN_COOKIE];

  return typeof cookie === 'string' && cookie.length > 0 ? cookie : null;
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    maxAge: cookieMaxAgeMs,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function wantsHtmlAuthRedirect(req: Request) {
  const accept = req.headers.accept ?? '';

  if (accept.includes('text/html')) {
    return true;
  }

  if (req.headers['x-nr-navigation'] === '1') {
    return true;
  }

  return req.method === 'GET' && !accept.includes('application/json');
}
