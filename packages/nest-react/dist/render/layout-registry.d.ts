import { ComponentType, ReactNode } from 'react';
type LayoutComponent = ComponentType<{
    children: ReactNode;
}>;
export declare function registerLayout(Layout: LayoutComponent): void;
export declare function getLayout(): LayoutComponent | undefined;
export {};
