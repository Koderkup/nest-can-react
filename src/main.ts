import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ModuleRef } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';

import { initializeFrontendDI } from './core/inject';
import './demo/islands';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const moduleRef = app.get(ModuleRef);

  initializeFrontendDI(moduleRef);
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/assets/',
  });

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);

  console.log(`http://localhost:${port}`);
}

bootstrap();
