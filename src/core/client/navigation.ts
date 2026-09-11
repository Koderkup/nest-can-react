export function installNavigation(onPageChanged: () => void) {
    document.addEventListener('click', async (event) => {
      const link = getAnchor(event.target);
  
      if (!link || shouldUseBrowserNavigation(link, event)) {
        return;
      }
  
      event.preventDefault();
  
      const response = await fetch(link.href, {
        headers: {
          accept: 'text/html',
          'x-nr-navigation': '1',
        },
      });
  
      if (!response.ok) {
        window.location.href = link.href;
        return;
      }
  
      const html = await response.text();
      const nextDocument = new DOMParser().parseFromString(html, 'text/html');
  
      document.title = nextDocument.title;
      document.body.innerHTML = nextDocument.body.innerHTML;
  
      window.history.pushState(null, '', link.href);
  
      onPageChanged();
    });
  
    window.addEventListener('popstate', () => {
      window.location.reload();
    });
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
    return (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === '_blank' ||
      link.hasAttribute('download') ||
      new URL(link.href).origin !== window.location.origin
    );
  }