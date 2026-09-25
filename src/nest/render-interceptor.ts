import {
  CallHandler,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  Injectable,
  IntrinsicException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, mergeMap, of } from 'rxjs';
import { renderPage } from '../render/render-page';
import { runWithNestContext } from './inject';
import { isRenderTicket } from './render';
import { normalizeHttpResponse } from './response-utils';

class ResponseHandled extends IntrinsicException {
  constructor() {
    super('nest-can-react response already sent');
  }
}

@Catch(ResponseHandled)
@Injectable()
export class ResponseHandledFilter implements ExceptionFilter {
  catch() {
    // render() already finished the HTTP response. Skip Nest's default reply.
  }
}

@Injectable()
export class NestRenderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap((value) => {
        if (!isRenderTicket(value)) {
          return of(value);
        }

        const http = context.switchToHttp();
        const request = http.getRequest();
        // Normalize the platform-specific HTTP response to a Node.js
        // ServerResponse-compatible object (unwraps Fastify's reply.raw).
        const response = normalizeHttpResponse(http.getResponse());

        return from(
          runWithNestContext({ request }, async () => {
            await renderPage(value.pageId, {}, {
              request,
              response,
              statusCode: value.statusCode,
              url: value.url,
            });
            throw new ResponseHandled();
          }),
        );
      }),
    );
  }
}
