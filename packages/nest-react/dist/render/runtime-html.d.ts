import { Transform } from 'node:stream';
import { RuntimeParts } from './runtime-parts';
export declare function injectRuntime(markup: string, manifest: Record<string, unknown>): string;
export declare function injectRuntimeAssets(markup: string, parts: RuntimeParts): string;
export declare function createRuntimeInjectionTransform(runtimeFactory: () => RuntimeParts): Transform;
