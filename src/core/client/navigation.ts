import { unmountHydrateIslands } from './mount';
import { collectStylesheetHrefs, ensureStylesheets } from './styles';

type NavigationOptions = {
  onPageChanged: () => void;
};

type PageSnapshot = {
  title: string;
  document: string;
  manifest: string;
  stylesheets: string[];
  scrollX: number;
  scrollY: number;
};

let installed = false;
let currentUrl = window.location.href;
const pageCache = new Map<string, PageSnapshot>();

export function installNavigation(options: NavigationOptions) {
  if (installed) {
    return;
  }

  installed = true;
  pageCache.set(currentUrl, takeSnapshot());
  window.history.replaceState({ nr: true }, '', currentUrl);

  document.addEventListener('click', async (event) => {
    const link = getAnchor(event.target);

    if (!link || shouldUseBrowserNavigation(link, event)) {
      return;
    }

    event.preventDefault();

    try {
      await navigate(link.href, options, 'push', false);
    } catch {
      window.location.href = link.href;
    }
  });

  window.addEventListener('popstate', () => {
    void restoreHistoryEntry(window.location.href, options);
  });
}

async function navigate(
  href: string,
  options: NavigationOptions,
  historyMode: 'push' | 'replace' | 'none',
  useCache: boolean,
) {
  pageCache.set(currentUrl, takeSnapshot());
  const snapshot =
    useCache && pageCache.has(href)
      ? pageCache.get(href)!
      : await fetchSnapshot(href);

  pageCache.set(href, snapshot);
  applySnapshot(snapshot, options);

  if (historyMode === 'push') {
    window.history.pushState({ nr: true }, '', href);
  }

  if (historyMode === 'replace') {
    window.history.replaceState({ nr: true }, '', href);
  }

  currentUrl = href;
  window.scrollTo(snapshot.scrollX, snapshot.scrollY);
}

async function restoreHistoryEntry(href: string, options: NavigationOptions) {
  try {
    await navigate(href, options, 'none', true);
  } catch {
    window.location.reload();
  }
}

async function fetchSnapshot(href: string): Promise<PageSnapshot> {
  const response = await fetch(href, {
    headers: {
      accept: 'text/html',
      'x-nr-navigation': '1',
    },
  });

  if (!response.ok) {
    throw new Error('Navigation request failed.');
  }

  const html = await response.text();
  const nextDocument = new DOMParser().parseFromString(html, 'text/html');
  const nextSlot = nextDocument.getElementById('nr-document');
  const nextManifest = nextDocument.getElementById('nr-manifest');

  if (!nextSlot || !nextManifest?.textContent) {
    throw new Error(
      'Navigation response is missing #nr-document or #nr-manifest.',
    );
  }

  return {
    title: nextDocument.title,
    document: nextSlot.innerHTML,
    manifest: nextManifest.textContent,
    stylesheets: collectStylesheetHrefs(nextDocument),
    scrollX: 0,
    scrollY: 0,
  };
}

function applySnapshot(snapshot: PageSnapshot, options: NavigationOptions) {
  const slot = getDocumentSlot();

  if (!slot) {
    window.location.reload();
    return;
  }

  document.title = snapshot.title;
  unmountHydrateIslands();
  slot.innerHTML = snapshot.document;
  writeManifest(snapshot.manifest);
  ensureStylesheets(snapshot.stylesheets);
  options.onPageChanged();
}

function takeSnapshot(): PageSnapshot {
  const slot = getDocumentSlot();

  return {
    title: document.title,
    document: slot?.innerHTML ?? '',
    manifest: document.getElementById('nr-manifest')?.textContent ?? '',
    stylesheets: collectStylesheetHrefs(document),
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };
}

function writeManifest(text: string) {
  let script = document.getElementById('nr-manifest');

  if (!script) {
    script = document.createElement('script');
    script.id = 'nr-manifest';
    // script.type = 'application/json';
    document.body.appendChild(script);
  }

  script.textContent = text;
}

function getDocumentSlot() {
  return document.getElementById('nr-document');
}

function getAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest('a');
}

function shouldUseBrowserNavigation(
  link: HTMLAnchorElement,
  event: MouseEvent,
) {
  const nextUrl = new URL(link.href);
  const currentUrl = new URL(window.location.href);
  const isHashOnlyNavigation =
    nextUrl.pathname === currentUrl.pathname &&
    nextUrl.search === currentUrl.search &&
    nextUrl.hash.length > 0;

  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (link.target.length > 0 && link.target !== '_self') ||
    link.hasAttribute('download') ||
    nextUrl.origin !== window.location.origin ||
    isHashOnlyNavigation
  );
}
