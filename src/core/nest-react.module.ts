import './register-assets';
import { join } from 'node:path';
import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import express, { NextFunction, Request, Response } from 'express';
import { configureNestReact, NestReactOptions } from './client-assets';
import { initializeFrontendDI } from './context';
import { NestReactController } from './nest-react.controller';
import '../../.nest-react/generated/server-boot.js';

const publicDir = join(process.cwd(), 'public');
const servePublic = express.static(publicDir);

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

@Module({
  controllers: [NestReactController],
})
export class NestReactModule implements NestModule, OnModuleInit {
  constructor(private readonly moduleRef: ModuleRef) {}

  static forRoot(options: NestReactOptions = {}): DynamicModule {
    configureNestReact(options);

    return {
      module: NestReactModule,
      controllers: [NestReactController],
    };
  }

  onModuleInit() {
    initializeFrontendDI(this.moduleRef);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(serveNestReactAssets).forRoutes({
      path: '*path',
      method: RequestMethod.GET,
    });
  }
}
