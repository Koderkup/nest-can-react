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
  /** HTTP adapter to use. Default: `'express'` */
  adapter?: 'express' | 'fastify';
};

const DEFAULT_PUBLIC_PATH = '/assets/nest-can-react';

@Module({})
export class NestReactModule implements NestModule {
  private static assetsDir = join(process.cwd(), 'public/nest-can-react');
  private static publicPath = DEFAULT_PUBLIC_PATH;
  private static adapter: 'express' | 'fastify' = 'express';

  static get currentAdapter(): 'express' | 'fastify' {
    return NestReactModule.adapter;
  }

  static forRoot(options: NestReactOptions = {}): DynamicModule {
    NestReactModule.assetsDir =
      options.assetsDir ?? join(process.cwd(), 'public/nest-can-react');
    NestReactModule.publicPath = normalizePublicPath(
      options.publicPath ?? DEFAULT_PUBLIC_PATH,
    );
    NestReactModule.adapter = options.adapter ?? 'express';

    attachToListeningHttpServers();

    const moduleRef = moduleRefToken();

    @Injectable()
    class NestContainerBinder implements OnApplicationBootstrap {
      constructor(@Inject(moduleRef) private readonly ref: ModuleRef) {}

      onApplicationBootstrap() {
        bindNestContainer(this.ref);
      }
    }

    @Injectable()
    class FastifySetup implements OnApplicationBootstrap {
      constructor(
        @Inject(moduleRef) private readonly ref: ModuleRef,
      ) {}

      async onApplicationBootstrap() {
        if (NestReactModule.adapter !== 'fastify') {
          return;
        }
        await this.setupFastify();
      }

      private async setupFastify() {
        // @ts-ignore - dynamic require for optional dependency
        const fastifyStatic = require('@fastify/static').default;

        // HttpAdapterHost is not accessible from user module scope via ModuleRef.get()
        // Instead, search the NestJS container's internal providers storage
        const refAny = this.ref as any;
        let httpAdapter: any;

        const container = refAny.container || refAny._container;
        if (container) {
          const internalProviders = (container as any).internalProvidersStorage;
          if (internalProviders?.hasOwnProperty('_httpAdapter')) {
            const raw = internalProviders._httpAdapter;
            if (raw?.instance && typeof raw.instance.register === 'function') {
              httpAdapter = raw.instance;
            }
          }
          if (!httpAdapter && internalProviders?.hasOwnProperty('_httpAdapterHost')) {
            const wrapper = internalProviders._httpAdapterHost;
            if (wrapper?.instance?.httpAdapter) {
              httpAdapter = wrapper.instance.httpAdapter;
            }
          }
        }

        if (!httpAdapter) {
          console.warn('nest-can-react: HttpAdapter not available, skipping Fastify static setup');
          return;
        }

        const fastify = httpAdapter;
        const prefix = NestReactModule.publicPath;

        await fastify.register(fastifyStatic, {
          root: NestReactModule.assetsDir,
          prefix,
          decorateReply: true,
          setHeaders: (reply: any) => {
            if (process.env.NODE_ENV !== 'production') {
              reply.header('Cache-Control', 'no-store');
            }
          },
        });

        fastify.addHook('onRequest', async (req: any, reply: any) => {
          const server = req.raw?.socket?.server;
          if (server) {
            attachDevHmrProxiesFromEnv(server);
          }

          if (req.url.startsWith(NestReactModule.publicPath)) {
            const filePath = req.url.slice(NestReactModule.publicPath.length) || '/';
            await reply.sendFile(filePath);
          }
        });
      }
    }

    const providers: any[] = [
      NestContainerBinder,
      {
        provide: APP_INTERCEPTOR,
        useClass: NestRenderInterceptor,
      },
      {
        provide: APP_FILTER,
        useClass: ResponseHandledFilter,
      },
    ];

    if (NestReactModule.adapter === 'fastify') {
      providers.push(FastifySetup);
    }

    return {
      module: NestReactModule,
      providers,
    };
  }

  configure(consumer: MiddlewareConsumer) {
    if (NestReactModule.adapter === 'fastify') {
      return;
    }

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