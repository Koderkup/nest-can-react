import { ModuleRef } from '@nestjs/core';

let moduleRef: ModuleRef;

export function initializeFrontendDI(ref: ModuleRef) {
  moduleRef = ref;
}

export function inject<T>(token: any): T {
  if (!moduleRef) {
    throw new Error('Frontend DI has not been initialized.');
  }

  return moduleRef.get<T>(token, { strict: false });
}