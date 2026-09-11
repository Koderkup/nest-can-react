import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ModuleRef } from '@nestjs/core';

import { initializeFrontendDI } from './frontend/inject';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const moduleRef = app.get(ModuleRef);

  initializeFrontendDI(moduleRef);

  await app.listen(3000);

  console.log('http://localhost:3000');
}

bootstrap();