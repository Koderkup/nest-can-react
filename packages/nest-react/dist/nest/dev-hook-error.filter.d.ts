import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { ClientHookOnServerError } from '../errors/dev-hook-error';
export declare class ClientHookOnServerFilter implements ExceptionFilter<ClientHookOnServerError> {
    catch(exception: ClientHookOnServerError, host: ArgumentsHost): void;
}
