import { DynamicModule, Module } from '@nestjs/common';
import { configureNestReact, NestReactOptions } from './client-assets';
import { NestReactController } from './nest-react.controller';

@Module({
  controllers: [NestReactController],
})
export class NestReactModule {
  static forRoot(options: NestReactOptions = {}): DynamicModule {
    configureNestReact(options);

    return {
      module: NestReactModule,
      controllers: [NestReactController],
    };
  }
}
