import { ComponentType, ReactElement } from 'react';
import { Response } from 'express';
export type RenderMode = 'static' | 'hydrated' | 'streaming';
export type RenderPageOptions = {
    mode?: 'static';
} | {
    mode: 'hydrated';
} | {
    mode: 'streaming';
    response: Response;
    statusCode?: number;
};
export declare function renderPage(page: ReactElement, options?: Extract<RenderPageOptions, {
    mode?: 'static';
}> | {
    mode: 'hydrated';
}): Promise<string>;
export declare function renderPage(page: ReactElement, options: Extract<RenderPageOptions, {
    mode: 'streaming';
}>): Promise<void>;
export declare function renderPage<P extends object>(Page: ComponentType<P>, props: P, options?: Extract<RenderPageOptions, {
    mode?: 'static';
}> | {
    mode: 'hydrated';
}): Promise<string>;
export declare function renderPage<P extends object>(Page: ComponentType<P>, props: P, options: Extract<RenderPageOptions, {
    mode: 'streaming';
}>): Promise<void>;
