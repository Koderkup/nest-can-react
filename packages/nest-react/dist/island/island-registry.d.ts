import { ComponentType, ReactNode } from 'react';
type IslandRegistry = Record<string, ComponentType<any>>;
type ClientRuntimeComponent = ComponentType<{
    children: ReactNode;
}>;
export declare function registerIslandComponents(registry: IslandRegistry): void;
export declare function getIslandComponent(name: string): ComponentType<any>;
export declare function resolveIslandName(name: string | ComponentType<any>): string;
export declare function registerClientRuntime(Runtime: ClientRuntimeComponent): void;
export declare function getClientRuntime(): ClientRuntimeComponent | undefined;
export {};
