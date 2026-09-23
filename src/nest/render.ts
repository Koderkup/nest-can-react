export const PAGE_REF = Symbol.for('nest-can-react.page');
export const RENDER_TICKET = Symbol.for('nest-can-react.render');

export type PageRef = {
  readonly [PAGE_REF]: string;
};

export type RenderOptions = {
  statusCode?: number;
  url?: string;
};

export type RenderTicket = {
  readonly [RENDER_TICKET]: true;
  readonly pageId: string;
  readonly statusCode?: number;
  readonly url?: string;
};

export function createPageRef(id: string): PageRef {
  if (!id) {
    throw new Error('createPageRef() requires a page id.');
  }

  return Object.freeze({ [PAGE_REF]: id });
}

export function render(page: PageRef, options: RenderOptions = {}): RenderTicket {
  const pageId = page?.[PAGE_REF];

  if (typeof pageId !== 'string' || !pageId) {
    throw new Error(
      'render() expects a page ref from src/react-pages.ts (createPageRef).',
    );
  }

  return {
    [RENDER_TICKET]: true,
    pageId,
    statusCode: options.statusCode,
    url: options.url,
  };
}

export function isRenderTicket(value: unknown): value is RenderTicket {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as RenderTicket)[RENDER_TICKET] === true
  );
}
