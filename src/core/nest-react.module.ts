import { Module } from '@nestjs/common';
import { NestReactController } from './nest-react.controller';

@Module({
  controllers: [NestReactController],
})
export class NestReactModule {}
