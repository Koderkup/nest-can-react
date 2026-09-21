import '../assets/register-assets';
import { DynamicModule, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { NestReactOptions } from '../assets/client-assets';
export declare class NestReactModule implements NestModule {
    static forRoot(options?: NestReactOptions): DynamicModule;
    configure(consumer: MiddlewareConsumer): void;
}
