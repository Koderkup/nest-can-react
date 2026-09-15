const STYLE_ATTR = 'data-nr-style';

export function collectStylesheetHrefs(doc: Document = document) {
  return [...doc.querySelectorAll(`link[${STYLE_ATTR}]`)]
    .map((link) => (link as HTMLLinkElement).getAttribute('href') ?? '')
    .filter(Boolean);
}

export function ensureStylesheets(hrefs: string[]) {
  if (!canUseDOM()) {
    return;
  }

  const existing = new Set(collectStylesheetHrefs(document));

  for (const href of hrefs) {
    if (!href || hasStylesheet(existing, href)) {
      continue;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(STYLE_ATTR, '1');
    document.head.appendChild(link);
    existing.add(href);
  }
}

export function replaceStylesheets(hrefs: string[]) {
  if (!canUseDOM()) {
    return;
  }

  const stamp = String(Date.now());
  const unique = [...new Set(hrefs.filter(Boolean))];

  for (const href of unique) {
    const nextHref = withCacheBust(href, stamp);
    const current = findStylesheet(href);

    if (!current) {
      ensureStylesheets([nextHref]);
      continue;
    }

    if (
      pathnamesMatch(current.href, nextHref) &&
      current.href.includes('?t=')
    ) {
      current.href = nextHref;
      continue;
    }

    const nextLink = document.createElement('link');
    nextLink.rel = 'stylesheet';
    nextLink.href = nextHref;
    nextLink.setAttribute(STYLE_ATTR, '1');
    nextLink.onload = () => {
      current.remove();
    };
    current.after(nextLink);
  }
}

function hasStylesheet(existing: Set<string>, href: string) {
  if (existing.has(href)) {
    return true;
  }

  return [...existing].some((current) => pathnamesMatch(current, href));
}

function findStylesheet(href: string) {
  return [...document.querySelectorAll(`link[${STYLE_ATTR}]`)].find((node) =>
    pathnamesMatch((node as HTMLLinkElement).href, href),
  ) as HTMLLinkElement | undefined;
}

function withCacheBust(href: string, stamp: string) {
  try {
    const next = new URL(href, window.location.origin);
    next.searchParams.set('t', stamp);
    return `${next.pathname}${next.search}`;
  } catch {
    return `${href.split('?')[0]}?t=${stamp}`;
  }
}

function pathnamesMatch(left: string, right: string) {
  try {
    return styleKey(left) === styleKey(right);
  } catch {
    return left.split('?')[0] === right.split('?')[0];
  }
}

function styleKey(href: string) {
  return new URL(href, window.location.origin).pathname.replace(
    /-[A-Z0-9]{6,10}(?=\.[a-z0-9]+$)/i,
    '',
  );
}

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
