import { join } from 'node:path';
import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import express, { NextFunction, Request, Response } from 'express';

export type NestReactOptions = {
  /** Absolute path to client assets directory. Default: `<cwd>/public/nest-can-react` */
  assetsDir?: string;
  /** URL prefix for assets. Default: `/assets/nest-can-react` */
  publicPath?: string;
};

const DEFAULT_PUBLIC_PATH = '/assets/nest-can-react';

@Module({})
export class NestReactModule implements NestModule {
  private static assetsDir = join(process.cwd(), 'public/nest-can-react');
  private static publicPath = DEFAULT_PUBLIC_PATH;

  static forRoot(options: NestReactOptions = {}): DynamicModule {
    NestReactModule.assetsDir =
      options.assetsDir ?? join(process.cwd(), 'public/nest-can-react');
    NestReactModule.publicPath = normalizePublicPath(
      options.publicPath ?? DEFAULT_PUBLIC_PATH,
    );

    return {
      module: NestReactModule,
    };
  }

  configure(consumer: MiddlewareConsumer) {
    const serve = express.static(NestReactModule.assetsDir, {
      setHeaders(res) {
        if (process.env.NODE_ENV !== 'production') {
          res.setHeader('Cache-Control', 'no-store');
        }
      },
    });

    const prefix = NestReactModule.publicPath;

    consumer
      .apply((req: Request, res: Response, next: NextFunction) => {
        const originalUrl = req.originalUrl.split('?')[0];

        if (!originalUrl.startsWith(prefix)) {
          return next();
        }

        const previousUrl = req.url;
        req.url = originalUrl.slice(prefix.length) || '/';

        serve(req, res, (error) => {
          req.url = previousUrl;
          next(error);
        });
      })
      .forRoutes({
        path: '*path',
        method: RequestMethod.GET,
      });
  }
}

function normalizePublicPath(publicPath: string) {
  return `/${publicPath}`.replace(/\/+/g, '/').replace(/\/$/, '');
}
