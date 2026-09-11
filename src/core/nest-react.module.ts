import { join } from 'node:path';
import {
  DynamicModule,
  Module,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { HttpAdapterHost, ModuleRef } from '@nestjs/core';
import express from 'express';
import { configureNestReact, NestReactOptions } from './client-assets';
import { initializeFrontendDI } from './context';
import { NestReactController } from './nest-react.controller';
import '../../.nest-react/generated/server-boot.js';

@Module({
  controllers: [NestReactController],
})
export class NestReactModule implements OnModuleInit, OnApplicationBootstrap {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

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

  onApplicationBootstrap() {
    const instance = this.httpAdapterHost.httpAdapter.getInstance();
    instance.use('/assets', express.static(join(process.cwd(), 'public')));
  }
}
