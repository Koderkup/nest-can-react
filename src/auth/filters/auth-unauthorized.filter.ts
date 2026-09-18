import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { wantsHtmlAuthRedirect } from '../auth-token.utils';

@Catch(UnauthorizedException)
export class AuthUnauthorizedFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();

    if (wantsHtmlAuthRedirect(request)) {
      response.redirect(302, '/auth/login');
      return;
    }

    const body = exception.getResponse();
    response
      .status(401)
      .json(typeof body === 'string' ? { message: body, statusCode: 401 } : body);
  }
}
