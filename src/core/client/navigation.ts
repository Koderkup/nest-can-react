type NavigationOptions = {
  onBeforePageChange?: () => void;
  onPageChanged: () => void;
};

let installed = false;

export function installNavigation(options: NavigationOptions) {
  if (installed) {
    return;
  }

  installed = true;

  document.addEventListener('click', async (event) => {
    const link = getAnchor(event.target);

    if (!link || shouldUseBrowserNavigation(link, event)) {
      return;
    }

    event.preventDefault();

    try {
      await navigate(link.href, options);
    } catch {
      window.location.href = link.href;
    }
  });

  window.addEventListener('popstate', () => {
    window.location.reload();
  });
}

async function navigate(href: string, options: NavigationOptions) {
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

  options.onBeforePageChange?.();

  document.title = nextDocument.title;
  document.body.innerHTML = nextDocument.body.innerHTML;
  window.history.pushState(null, '', href);

  options.onPageChanged();
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
