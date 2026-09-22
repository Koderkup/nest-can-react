const OVERLAY_ID = 'ncr-dev-overlay';
const INDICATOR_ID = 'ncr-dev-indicator';
const RELOAD_AT_KEY = 'ncr-hmr-reload-at';
const RELOAD_GUARD_MS = 2000;

function ensureOverlayRoot() {
  let root = document.getElementById(OVERLAY_ID);

  if (root) {
    return root;
  }

  root = document.createElement('div');
  root.id = OVERLAY_ID;
  root.setAttribute('data-ncr-overlay', 'true');
  Object.assign(root.style, {
    display: 'none',
    position: 'fixed',
    zIndex: '2147483646',
    inset: '0',
    background: 'rgba(15, 23, 42, 0.72)',
    color: '#f8fafc',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    padding: '32px 24px',
    overflow: 'auto',
  });
  document.body.append(root);
  return root;
}

export function showDevOverlay(title: string, body: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = ensureOverlayRoot();
  root.style.display = 'block';
  root.replaceChildren();

  const card = document.createElement('div');
  Object.assign(card.style, {
    maxWidth: '720px',
    margin: '0 auto',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '20px 22px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
  });

  const heading = document.createElement('h1');
  heading.textContent = title;
  Object.assign(heading.style, {
    margin: '0 0 12px',
    fontSize: '18px',
    fontWeight: '650',
  });

  const pre = document.createElement('pre');
  pre.textContent = body;
  Object.assign(pre.style, {
    margin: '0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#e2e8f0',
  });

  card.append(heading, pre);
  root.append(card);
}

export function hideDevOverlay() {
  const root = document.getElementById(OVERLAY_ID);

  if (root) {
    root.style.display = 'none';
    root.replaceChildren();
  }
}

export function showBuildingIndicator() {
  if (typeof document === 'undefined') {
    return;
  }

  let indicator = document.getElementById(INDICATOR_ID);

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = INDICATOR_ID;
    Object.assign(indicator.style, {
      position: 'fixed',
      zIndex: '2147483645',
      right: '16px',
      bottom: '16px',
      background: '#0f172a',
      color: '#e2e8f0',
      border: '1px solid #334155',
      borderRadius: '999px',
      padding: '6px 12px',
      fontSize: '12px',
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      pointerEvents: 'none',
    });
    document.body.append(indicator);
  }

  indicator.textContent = 'Compiling…';
  indicator.style.display = 'block';
}

export function hideBuildingIndicator() {
  const indicator = document.getElementById(INDICATOR_ID);

  if (indicator) {
    indicator.style.display = 'none';
  }
}

export function guardedFullReload(reason: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const now = Date.now();
  const last = Number(sessionStorage.getItem(RELOAD_AT_KEY) ?? 0);

  if (now - last < RELOAD_GUARD_MS) {
    console.warn(
      `[nest-can-react] skipped reload loop (${reason})`,
    );
    return;
  }

  sessionStorage.setItem(RELOAD_AT_KEY, String(now));
  console.warn(`[nest-can-react] full reload: ${reason}`);
  window.location.reload();
}
