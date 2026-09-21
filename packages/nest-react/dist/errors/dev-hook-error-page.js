"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDevHookErrorPage = renderDevHookErrorPage;
const dev_hook_error_1 = require("./dev-hook-error");
function renderDevHookErrorPage(error) {
    const hook = error.hookName;
    const source = error.source;
    const stack = (0, dev_hook_error_1.getErrorStack)(error.cause ?? error);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(hook)} was supposed to land on an island | Nest React</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #07111f;
      color: #edf4ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.26), transparent 34rem),
        radial-gradient(circle at 75% 15%, rgba(168, 85, 247, 0.22), transparent 28rem),
        linear-gradient(135deg, #07111f 0%, #0b1020 50%, #10172a 100%);
    }
    main {
      width: min(720px, calc(100% - 32px));
      margin: 0 auto;
      padding: 72px 0 64px;
    }
    .eyebrow {
      color: #38bdf8;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .kicker {
      margin: 18px 0 0;
      color: #c4b5fd;
      font-size: 0.95rem;
      font-weight: 600;
    }
    h1 {
      margin: 10px 0 0;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      letter-spacing: -0.04em;
      line-height: 1.15;
    }
    h1 code {
      background: linear-gradient(135deg, #38bdf8, #a855f7);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font: inherit;
      font-weight: 800;
    }
    .panel {
      margin-top: 28px;
      padding: 24px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 24px;
      background: rgba(8, 15, 30, 0.68);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(24px);
    }
    p { color: #cbd5e1; line-height: 1.65; }
    .split {
      display: grid;
      gap: 12px;
      margin: 20px 0;
    }
    .split div {
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.8);
    }
    .split strong { display: block; margin-bottom: 4px; color: #edf4ff; }
    .split span { color: #94a3b8; font-size: 0.92rem; }
    ol {
      margin: 16px 0 0;
      padding-left: 1.2rem;
      color: #cbd5e1;
      line-height: 1.7;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.92em;
      color: #7dd3fc;
    }
    .source {
      margin-top: 22px;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
    }
    details {
      margin-top: 18px;
      color: #94a3b8;
    }
    summary { cursor: pointer; }
    pre {
      overflow: auto;
      margin: 12px 0 0;
      padding: 14px;
      border-radius: 16px;
      background: #020617;
      color: #e2e8f0;
      font-size: 0.78rem;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Development only</p>
    <p class="kicker">Wrong neighborhood</p>
    <h1><code>${escapeHtml(hook)}</code> was supposed to land on an island.</h1>
    <section class="panel">
      <p>
        This file is a <strong>server page</strong>. Nest runs it during the request.
        There is no browser, no component instance, and no re-render loop.
        <code>${escapeHtml(hook)}</code> asked React for client state anyway, so the
        dispatcher was empty and the render died.
      </p>
      <div class="split">
        <div>
          <strong>Pages</strong>
          <span>Controllers load data and pass props. Pages compose HTML.</span>
        </div>
        <div>
          <strong>Islands</strong>
          <span><code>*.island.tsx</code> owns CSR: <code>${escapeHtml(hook)}</code>, clicks, timers, forms.</span>
        </div>
      </div>
      <p>
        Move <code>${escapeHtml(hook)}</code> into an island, then render it with
        <code>&lt;Island name={YourIsland} /&gt;</code>. Leave this page for the server.
      </p>
      <ol>
        <li>Create or open a <code>*.island.tsx</code> file.</li>
        <li>Move <code>${escapeHtml(hook)}</code> into that island component.</li>
        <li>Render it from this page with <code>&lt;Island name={ThatComponent} /&gt;</code>.</li>
      </ol>
      ${source
        ? `<p class="source">${escapeHtml(source)}</p>`
        : ''}
      ${stack
        ? `<details><summary>Original React stack</summary><pre>${escapeHtml(stack)}</pre></details>`
        : ''}
    </section>
  </main>
</body>
</html>
`;
}
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => {
        const escaped = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return escaped[char];
    });
}
//# sourceMappingURL=dev-hook-error-page.js.map