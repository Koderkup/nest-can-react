import { createRequire } from 'node:module';
import { join } from 'node:path';
import { Server } from 'node:http';
import { pathToFileURL } from 'node:url';
import {
  DynamicModule,
  Inject,
  Injectable,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, type ModuleRef } from '@nestjs/core';
import express, { NextFunction, Request, Response } from 'express';
import { attachDevHmrProxiesFromEnv } from './dev-hmr-proxy';
import { bindNestContainer } from './inject';
import {
  NestRenderInterceptor,
  ResponseHandledFilter,
} from './render-interceptor';

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

    attachToListeningHttpServers();

    const moduleRef = moduleRefToken();

    @Injectable()
    class NestContainerBinder implements OnApplicationBootstrap {
      constructor(@Inject(moduleRef) private readonly ref: ModuleRef) {}

      onApplicationBootstrap() {
        bindNestContainer(this.ref);
      }
    }

    return {
      module: NestReactModule,
      providers: [
        NestContainerBinder,
        {
          provide: APP_INTERCEPTOR,
          useClass: NestRenderInterceptor,
        },
        {
          provide: APP_FILTER,
          useClass: ResponseHandledFilter,
        },
      ],
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
        attachDevHmrProxiesFromRequest(req);

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

function moduleRefToken() {
  const requireFromApp = createRequire(
    pathToFileURL(join(process.cwd(), 'package.json')).href,
  );

  return requireFromApp('@nestjs/core').ModuleRef as new (
    ...args: never[]
  ) => ModuleRef;
}

function attachToListeningHttpServers() {
  if (process.env.NEST_CAN_REACT_DEV !== '1') {
    return;
  }

  const tryAttach = () => {
    const handles =
      (
        process as typeof process & {
          _getActiveHandles?: () => unknown[];
        }
      )._getActiveHandles?.() ?? [];

    let attached = false;

    for (const handle of handles) {
      if (handle instanceof Server && handle.listening) {
        attachDevHmrProxiesFromEnv(handle);
        attached = true;
      }
    }

    return attached;
  };

  if (tryAttach()) {
    return;
  }

  const timer = setInterval(() => {
    if (tryAttach()) {
      clearInterval(timer);
    }
  }, 25);

  timer.unref?.();
  setTimeout(() => clearInterval(timer), 15_000).unref?.();
}

function attachDevHmrProxiesFromRequest(req: Request) {
  const server = (req.socket as typeof req.socket & { server?: Server })
    .server;

  if (!server) {
    return;
  }

  attachDevHmrProxiesFromEnv(server);
}

function normalizePublicPath(publicPath: string) {
  return `/${publicPath}`.replace(/\/+/g, '/').replace(/\/$/, '');
}
