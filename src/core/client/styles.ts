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

function hasStylesheet(existing: Set<string>, href: string) {
  if (existing.has(href)) {
    return true;
  }

  return [...existing].some((current) => urlsMatch(current, href));
}

function urlsMatch(left: string, right: string) {
  try {
    return (
      new URL(left, window.location.origin).href ===
      new URL(right, window.location.origin).href
    );
  } catch {
    return left === right;
  }
}

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
