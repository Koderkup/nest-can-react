declare module 'react-server-dom-rspack/client.browser' {
  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: unknown,
  ): Promise<T>;

  export function createFromReadableStream<T>(
    stream: ReadableStream<Uint8Array>,
    options?: unknown,
  ): Promise<T>;
}

declare module 'react-server-dom-rspack/client' {
  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: unknown,
  ): Promise<T>;

  export function createFromReadableStream<T>(
    stream: ReadableStream<Uint8Array>,
    options?: unknown,
  ): Promise<T>;
}

declare module 'react-server-dom-rspack/server.node' {
  export type TemporaryReferenceSet = object;

  export type ServerEntry<T = unknown> = T & {
    entryCssFiles?: string[];
    entryJsFiles?: string[];
  };

  export function createTemporaryReferenceSet(): TemporaryReferenceSet;

  export function renderToReadableStream(
    model: unknown,
    options?: {
      temporaryReferences?: TemporaryReferenceSet;
      [key: string]: unknown;
    },
  ): ReadableStream<Uint8Array>;

  export function decodeReply<T extends unknown[] = unknown[]>(
    body: BodyInit | FormData,
    options?: { temporaryReferences?: TemporaryReferenceSet },
  ): Promise<T>;

  export function decodeAction(
    body: FormData,
    options?: { temporaryReferences?: TemporaryReferenceSet },
  ): Promise<(...args: unknown[]) => Promise<unknown>>;

  export function decodeFormState(
    action: unknown,
    body: FormData,
    options?: { temporaryReferences?: TemporaryReferenceSet },
  ): Promise<unknown>;

  export function loadServerAction(
    id: string,
  ): (...args: unknown[]) => Promise<unknown>;
}
