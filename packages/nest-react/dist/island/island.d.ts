import React, { ComponentType } from 'react';
import { IslandRenderMode } from '../data/context';
type IslandName = string | ComponentType<any>;
type IslandProps<C extends IslandName> = {
    mode?: IslandRenderMode;
    name: C;
    props?: C extends ComponentType<infer P> ? P : Record<string, unknown>;
    children?: React.ReactNode;
};
export declare function Island<C extends IslandName>({ mode, name, props, children, }: IslandProps<C>): React.JSX.Element;
export {};
