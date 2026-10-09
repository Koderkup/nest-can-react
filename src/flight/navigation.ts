export type NavigationKind = 'push' | 'replace' | 'pop';

export type LinkClickInfo = {
  href: string;
  currentHref: string;
  target?: string;
  download?: boolean;
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  defaultPrevented?: boolean;
};

export type NavigateTarget =
  | { kind: 'external'; href: string }
  | { kind: 'same-document'; href: string }
  | { kind: 'page'; href: string };

function toUrl(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

export function pageKey(href: string): string {
  const url = toUrl(href);
  return url ? `${url.origin}${url.pathname}${url.search}` : href;
}

export function shouldRefetchOnNavigation(
  renderedHref: string,
  nextHref: string,
): boolean {
  return pageKey(renderedHref) !== pageKey(nextHref);
}

export function shouldInterceptLinkClick(info: LinkClickInfo): boolean {
  if (info.defaultPrevented) {
    return false;
  }

  if ((info.button ?? 0) !== 0) {
    return false;
  }

  if (info.metaKey || info.ctrlKey || info.altKey || info.shiftKey) {
    return false;
  }

  if (info.target && info.target !== '_self') {
    return false;
  }

  if (info.download) {
    return false;
  }

  const link = toUrl(info.href);
  const current = toUrl(info.currentHref);

  if (!link || !current) {
    return false;
  }

  if (link.origin !== current.origin) {
    return false;
  }

  if (pageKey(link.href) === pageKey(current.href)) {
    return false;
  }

  return true;
}

export function shouldRetryRscStatus(status: number | undefined): boolean {
  if (status === undefined) {
    return true;
  }

  return status < 400 || status >= 500;
}

export function redirectHistoryTarget(
  currentHref: string,
  responseUrl: string | undefined,
  redirected: boolean,
): string | null {
  if (!redirected || !responseUrl) {
    return null;
  }

  const current = toUrl(currentHref);
  const next = toUrl(responseUrl);

  if (!current || !next || next.origin !== current.origin) {
    return null;
  }

  if (next.href === current.href) {
    return null;
  }

  return next.href;
}

export function resolveNavigateTarget(
  href: string,
  currentHref: string,
): NavigateTarget {
  const current = toUrl(currentHref);
  const link = (() => {
    try {
      return new URL(href, currentHref);
    } catch {
      return null;
    }
  })();

  if (!link || !current) {
    return { kind: 'external', href };
  }

  if (link.origin !== current.origin) {
    return { kind: 'external', href: link.href };
  }

  if (pageKey(link.href) === pageKey(current.href)) {
    return { kind: 'same-document', href: link.href };
  }

  return { kind: 'page', href: link.href };
}

export function hashElementId(href: string): string | null {
  const url = toUrl(href);

  if (!url || !url.hash || url.hash === '#') {
    return null;
  }

  try {
    return decodeURIComponent(url.hash.slice(1));
  } catch {
    return url.hash.slice(1);
  }
}
