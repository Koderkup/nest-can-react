import '../assets/register-assets';
import { join } from 'node:path';
import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import express, { NextFunction, Request, Response } from 'express';
import { configureNestReact, NestReactOptions } from '../assets/client-assets';
import { ClientHookOnServerFilter } from './dev-hook-error.filter';
import { loadGeneratedServerBoot } from './load-generated-boot';

loadGeneratedServerBoot();

const publicDir = join(process.cwd(), 'public');
const servePublic = express.static(publicDir, {
  setHeaders(res) {
    if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Cache-Control', 'no-store');
    }
  },
});

function serveNestReactAssets(req: Request, res: Response, next: NextFunction) {
  const originalUrl = req.originalUrl.split('?')[0];

  if (!originalUrl.startsWith('/assets/')) {
    return next();
  }

  const previousUrl = req.url;
  req.url = originalUrl.slice('/assets'.length) || '/';

  servePublic(req, res, (error) => {
    req.url = previousUrl;
    next(error);
  });
}

@Module({})
export class NestReactModule implements NestModule {
  static forRoot(options: NestReactOptions = {}): DynamicModule {
    configureNestReact(options);

    return {
      module: NestReactModule,
      providers: [
        {
          provide: APP_FILTER,
          useClass: ClientHookOnServerFilter,
        },
      ],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(serveNestReactAssets).forRoutes({
      path: '*path',
      method: RequestMethod.GET,
    });
  }
}
