import { getFrontendModuleRef, initializeFrontendDI } from './context';

export { initializeFrontendDI };

export function inject<T>(token: any): T {
  return getFrontendModuleRef().get<T>(token, { strict: false });
}
