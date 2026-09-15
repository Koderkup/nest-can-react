/// <reference lib="dom" />
import { ComponentType } from 'react';
import { replaceIslandComponent } from './mount';
import { performReactRefresh } from './refresh-runtime';
import { getManifest } from './runtime';
import { replaceStylesheets } from './styles';

type HmrMessage =
  | {
      type: 'client-update';
      css?: string[];
      islandCss?: Record<string, string[]>;
      modules?: string[];
    }
  | { type: 'server-reload' }
  | { type: 'full-reload' }
  | { type: 'error'; message: string; stack?: string }
  | { type: 'clear-error' };

let installed = false;
let overlay: HTMLDivElement | undefined;

export function installHmr() {
  if (installed || typeof EventSource === 'undefined') {
    return;
  }

  installed = true;
  const source = new EventSource('/_nr/hmr');

  source.onmessage = (event) => {
    try {
      void handleMessage(JSON.parse(event.data) as HmrMessage);
    } catch (error) {
      console.error('[nest-react] Failed to apply HMR payload.', error);
    }
  };
}

async function handleMessage(message: HmrMessage) {
  if (message.type === 'error') {
    showOverlay(message.message, message.stack);
    return;
  }

  if (message.type === 'clear-error') {
    hideOverlay();
    return;
  }

  if (message.type === 'server-reload' || message.type === 'full-reload') {
    hideOverlay();
    window.location.reload();
    return;
  }

  if (message.type !== 'client-update') {
    return;
  }

  hideOverlay();

  try {
    await applyClientUpdate(message);
  } catch (error) {
    console.error('[nest-react] Fast Refresh failed; reloading.', error);
    window.location.reload();
  }
}

async function applyClientUpdate(
  message: Extract<HmrMessage, { type: 'client-update' }>,
) {
  replaceStylesheets([
    ...(message.css ?? []),
    ...Object.values(message.islandCss ?? {}).flat(),
  ]);

  const modules = message.modules ?? [];

  if (modules.length === 0) {
    return;
  }

  const islandNames = new Set(
    getManifest().islands.map((island) => island.name),
  );

  await Promise.all(
    modules.map(async (url) => {
      const nextModule = await import(bust(url));

      for (const [name, value] of Object.entries(nextModule)) {
        if (islandNames.has(name) && typeof value === 'function') {
          replaceIslandComponent(name, value as ComponentType<any>);
        }
      }
    }),
  );

  const update = performReactRefresh();

  if (
    update &&
    update.updatedFamilies.size === 0 &&
    update.staleFamilies.size > 0
  ) {
    window.location.reload();
  }
}

function bust(url: string) {
  const next = new URL(url, window.location.origin);
  next.searchParams.set('t', String(Date.now()));
  return `${next.pathname}${next.search}`;
}

function showOverlay(message: string, stack?: string) {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.setAttribute('data-nr-overlay', '1');
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = renderOverlay(message, stack);
  overlay.style.display = 'block';
}

function hideOverlay() {
  if (!overlay) {
    return;
  }

  overlay.style.display = 'none';
  overlay.innerHTML = '';
}

function renderOverlay(message: string, stack?: string) {
  return `
<style>
  [data-nr-overlay] {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 48px 16px;
    overflow: auto;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.26), transparent 34rem),
      radial-gradient(circle at 75% 15%, rgba(168, 85, 247, 0.22), transparent 28rem),
      rgba(7, 17, 31, 0.92);
    color: #edf4ff;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  [data-nr-overlay] .nr-overlay-panel {
    width: min(720px, 100%);
    padding: 24px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 24px;
    background: rgba(8, 15, 30, 0.68);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(24px);
  }
  [data-nr-overlay] .nr-overlay-eyebrow {
    margin: 0;
    color: #38bdf8;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  [data-nr-overlay] h1 {
    margin: 10px 0 0;
    font-size: 1.6rem;
    letter-spacing: -0.04em;
  }
  [data-nr-overlay] h1 span {
    background: linear-gradient(135deg, #38bdf8, #a855f7);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  [data-nr-overlay] pre {
    overflow: auto;
    margin: 18px 0 0;
    padding: 14px;
    border-radius: 16px;
    background: #020617;
    color: #e2e8f0;
    font-size: 0.78rem;
    line-height: 1.5;
    white-space: pre-wrap;
  }
</style>
<section class="nr-overlay-panel">
  <p class="nr-overlay-eyebrow">Development only</p>
  <h1><span>Build failed</span></h1>
  <pre>${escapeHtml(message)}${stack ? `\n\n${escapeHtml(stack)}` : ''}</pre>
</section>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const escaped: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return escaped[char] ?? char;
  });
}
