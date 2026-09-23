import { AsyncLocalStorage } from 'node:async_hooks';
import { Scope, type InjectionToken } from '@nestjs/common';
import { REQUEST, type ModuleRef } from '@nestjs/core';

type NestRenderContext = {
  request?: unknown;
};

type Store = {
  request?: unknown;
  moduleRef: ModuleRef;
};

type ProviderWrapper = {
  metatype?: { name?: string };
  instance?: unknown;
  scope?: number;
};

type NestModuleRecord = {
  providers: Map<unknown, ProviderWrapper>;
};

type NestContainerLike = {
  getModules(): Map<unknown, NestModuleRecord>;
};

const storage = new AsyncLocalStorage<Store>();

let boundModuleRef: ModuleRef | undefined;

export function bindNestContainer(moduleRef: ModuleRef) {
  boundModuleRef = moduleRef;
}

export function runWithNestContext<T>(
  context: NestRenderContext,
  callback: () => T,
): T {
  if (!boundModuleRef) {
    throw new Error(
      'Nest DI is not ready. Import NestReactModule.forRoot() and wait until the app has bootstrapped.',
    );
  }

  return storage.run(
    {
      request: context.request,
      moduleRef: boundModuleRef,
    },
    callback,
  );
}

/**
 * Resolve a Nest provider while a page is rendering.
 * Uses the same container as the controller. `inject(REQUEST)` is the
 * in-flight Express request (params and query).
 */
export function inject<T>(token: InjectionToken<T>): T {
  const store = storage.getStore();

  if (!store) {
    throw new Error(
      'inject() must run during render() while a Server Component is rendering.',
    );
  }

  if (token === REQUEST) {
    if (store.request == null) {
      throw new Error(
        'inject(REQUEST) requires render() to run inside an HTTP request.',
      );
    }

    return store.request as T;
  }

  try {
    return store.moduleRef.get(token, { strict: false });
  } catch (error) {
    if (typeof token === 'function' && token.name) {
      const matched = resolveProviderByName<T>(store.moduleRef, token.name);

      if (matched) {
        return matched;
      }
    }

    throw error;
  }
}

/**
 * RSC bundles compile a second copy of each provider class, so the function
 * passed to inject() is not the class Nest registered. Fall back to the
 * unique provider with that class name in the live container.
 */
function resolveProviderByName<T>(
  moduleRef: ModuleRef,
  name: string,
): T | undefined {
  const container = (moduleRef as ModuleRef & { container?: NestContainerLike })
    .container;

  if (!container?.getModules) {
    return undefined;
  }

  const matches = new Set<T>();
  let sawRequestScope = false;

  for (const nestModule of container.getModules().values()) {
    for (const wrapper of nestModule.providers.values()) {
      if (wrapper.metatype?.name !== name) {
        continue;
      }

      if (
        wrapper.scope === Scope.REQUEST ||
        wrapper.scope === Scope.TRANSIENT
      ) {
        sawRequestScope = true;
        continue;
      }

      if (wrapper.instance != null) {
        matches.add(wrapper.instance as T);
      }
    }
  }

  if (matches.size === 1) {
    return [...matches][0];
  }

  if (matches.size > 1) {
    throw new Error(
      `inject(${name}) matched ${matches.size} providers. Use one class name per provider.`,
    );
  }

  if (sawRequestScope) {
    throw new Error(
      `inject(${name}) cannot construct a request-scoped provider. Call inject(REQUEST) and pass those values into a singleton service.`,
    );
  }

  return undefined;
}
