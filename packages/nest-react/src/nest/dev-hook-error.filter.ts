import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ClientHookOnServerError,
  sendClientHookErrorResponse,
} from '../errors/dev-hook-error';

@Catch(ClientHookOnServerError)
export class ClientHookOnServerFilter
  implements ExceptionFilter<ClientHookOnServerError>
{
  catch(exception: ClientHookOnServerError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    sendClientHookErrorResponse(response, exception);
  }
}
