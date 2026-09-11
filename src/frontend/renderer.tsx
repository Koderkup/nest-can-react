import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ModuleRef } from '@nestjs/core';
import { runWithFrontendContext } from './context';

type ServerPage = () => React.ReactNode | Promise<React.ReactNode>;

export async function renderPage(Page: ServerPage, moduleRef: ModuleRef) {
  const loadResults = new Map<string, unknown>();

  const markup = await runWithFrontendContext(
    moduleRef,
    loadResults,
    async () => {
      const page = await Page();
      return '<!DOCTYPE html>' + renderToStaticMarkup(page);
    },
  );

  return injectRuntime(markup, Object.fromEntries(loadResults));
}

function injectRuntime(markup: string, loads: Record<string, unknown>) {
  const runtime = [
    `<script id="__nest_react_loads" type="application/json">${serializeJson(loads)}</script>`,
    `<script>${clientRuntime}</script>`,
  ].join('');

  if (markup.includes('</body>')) {
    return markup.replace('</body>', `${runtime}</body>`);
  }

  return markup + runtime;
}

function serializeJson(value: unknown) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => {
    const escaped: Record<string, string> = {
      '<': '\\u003c',
      '>': '\\u003e',
      '&': '\\u0026',
      '\u2028': '\\u2028',
      '\u2029': '\\u2029',
    };

    return escaped[char];
  });
}

const clientRuntime = String.raw`
(() => {
  const state = {
    loads: {},
    pending: new Set(),
  };

  const script = document.getElementById('__nest_react_loads');

  if (script?.textContent) {
    state.loads = JSON.parse(script.textContent);
  }

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function setTextForLoad(key, data) {
    document.querySelectorAll('[data-nest-react-load-text]').forEach((node) => {
      if (node.getAttribute('data-nest-react-load-text') === key) {
        node.textContent = String(data);
      }
    });
  }

  async function refresh(keys) {
    const uniqueKeys = [...new Set(keys)].filter(Boolean);

    await Promise.all(uniqueKeys.map(async (key) => {
      state.pending.add(key);
      emit('nest-react:load-pending', { key, pending: true });

      try {
        const response = await fetch('/__nest-react/load/' + encodeURIComponent(key), {
          headers: { accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to refresh load "' + key + '".');
        }

        const result = await response.json();
        state.loads[key] = result.data;
        setTextForLoad(key, result.data);
        emit('nest-react:load', { key, data: result.data });
      } finally {
        state.pending.delete(key);
        emit('nest-react:load-pending', { key, pending: false });
      }
    }));
  }

  async function commit(url, body, init) {
    const response = await fetch(url, {
      method: init?.method ?? 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(init?.headers ?? {}),
      },
      body: JSON.stringify(body ?? {}),
    });

    if (!response.ok) {
      throw new Error('Commit request failed.');
    }

    const result = await response.json();

    if (Array.isArray(result.revalidate) && result.revalidate.length > 0) {
      await refresh(result.revalidate);
    }

    return result;
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target;

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const url = form.dataset.nestReactCommit;

    if (!url) {
      return;
    }

    event.preventDefault();

    const submitter = event.submitter;
    const formData = new FormData(form, submitter instanceof HTMLElement ? submitter : undefined);
    const body = Object.fromEntries(formData.entries());

    await commit(url, body, { method: form.method || 'POST' });
  });

  window.NestReact = {
    get loads() {
      return state.loads;
    },
    commit,
    refresh,
  };
})();
`;
