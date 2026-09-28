import { Module } from '@nestjs/common';
import { CookiesController } from './cookies.controller';

@Module({
  controllers: [CookiesController],
})
export class CookiesModule {}
