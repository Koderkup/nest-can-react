import { ComponentType, ReactNode } from 'react';
export type IslandComponentLoader = () => Promise<ComponentType<any>>;
export type IslandClientRegistry = Record<string, IslandComponentLoader>;
type ClientRuntimeComponent = ComponentType<{
    children: ReactNode;
}>;
export declare function installClientRuntime(registry: IslandClientRegistry, Runtime: ClientRuntimeComponent): Promise<void>;
export declare function unmountHydrateIslands(): void;
export declare function replaceIslandComponent(name: string, component: ComponentType<any>): void;
export {};
