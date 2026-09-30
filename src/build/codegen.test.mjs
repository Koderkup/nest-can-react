import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert';
import { generateFlightEntries } from './codegen.mjs';
import { discoverPages } from './discover-pages.mjs';

async function scaffold(relPaths) {
  const rootDir = await mkdtemp(join(tmpdir(), 'nest-cr-refs-'));

  const config = {
    rootDir,
    outDir: join(rootDir, 'public/nest-can-react'),
    serverOutDir: join(rootDir, '.nest-can-react/server'),
    publicPath: '/assets/nest-can-react',
    pages: {
      include: ['src/**/*.page.tsx'],
      exclude: ['src/**/*.test.tsx'],
    },
    styles: [],
    generatedDir: join(rootDir, '.nest-can-react/generated'),
    layoutEntry: join(rootDir, 'src/layout.tsx'),
    runtimeEntry: join(rootDir, 'src/app.runtime.tsx'),
    hmrPort: 9101,
    clientDevPort: 9102,
  };

  const pages = await discoverPages(config);
  return { rootDir, config, pages, relPaths };
}

function exportsFrom(source) {
  const found = new Map();
  const re = /export const (\w+) = createPageRef\("([^"]+)"\);/g;
  let match;

  while ((match = re.exec(source)) !== null) {
    found.set(match[2], match[1]);
  }

  return found;
}

test('unique basenames keep short export names', async () => {
  const { rootDir, config, pages } = await scaffold();

  try {
    for (const [id, rel] of [
      ['admin', 'src/admin.page.tsx'],
      ['notes/note', 'src/notes/note.page.tsx'],
      ['cookies/clear-cookie', 'src/cookies/clear-cookie.page.tsx'],
    ]) {
      pages.push({ id, relativeFile: rel, file: join(rootDir, rel) });
    }

    await generateFlightEntries({ config, pages });

    const { readFileSync } = await import('node:fs');
    const exports = exportsFrom(
      readFileSync(join(rootDir, 'src', 'react-pages.ts'), 'utf8'),
    );

    assert.strictEqual(exports.get('admin'), 'AdminPage');
    assert.strictEqual(exports.get('notes/note'), 'NotePage');
    assert.strictEqual(exports.get('cookies/clear-cookie'), 'ClearCookiePage');
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('colliding basenames fall back to qualified export names', async () => {
  const { rootDir, config, pages } = await scaffold();

  try {
    for (const [id, rel] of [
      ['admin', 'src/admin.page.tsx'],
      ['users/admin', 'src/users/admin.page.tsx'],
      ['settings/admin', 'src/settings/admin.page.tsx'],
    ]) {
      pages.push({ id, relativeFile: rel, file: join(rootDir, rel) });
    }

    await generateFlightEntries({ config, pages });

    const { readFileSync } = await import('node:fs');
    const exports = exportsFrom(
      readFileSync(join(rootDir, 'src', 'react-pages.ts'), 'utf8'),
    );

    assert.strictEqual(exports.get('admin'), 'AdminPage');
    assert.strictEqual(exports.get('users/admin'), 'UsersAdminPage');
    assert.strictEqual(exports.get('settings/admin'), 'SettingsAdminPage');
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('nested page does not steal the plain export name from the root page', async () => {
  const { rootDir, config, pages } = await scaffold();

  try {
    for (const [id, rel] of [
      ['aaa/admin', 'src/aaa/admin.page.tsx'],
      ['admin', 'src/admin.page.tsx'],
    ]) {
      pages.push({ id, relativeFile: rel, file: join(rootDir, rel) });
    }

    await generateFlightEntries({ config, pages });

    const { readFileSync } = await import('node:fs');
    const exports = exportsFrom(
      readFileSync(join(rootDir, 'src', 'react-pages.ts'), 'utf8'),
    );

    assert.strictEqual(exports.get('admin'), 'AdminPage');
    assert.strictEqual(exports.get('aaa/admin'), 'AaaAdminPage');
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

function pagesMapFrom(source) {
  const found = new Map();
  const re = /"([^"]+)":\s*(Page\d+)/g;
  let match;

  while ((match = re.exec(source)) !== null) {
    found.set(match[1], match[2]);
  }

  return found;
}

async function readPagesMap(rootDir) {
  const { readFileSync } = await import('node:fs');
  return pagesMapFrom(
    readFileSync(
      join(rootDir, '.nest-can-react', 'generated', 'pages.ts'),
      'utf8',
    ),
  );
}

test('pages map emits backward-compatible basename aliases for unique basenames', async () => {
  const { rootDir, config, pages } = await scaffold();

  try {
    for (const [id, rel] of [
      ['admin', 'src/admin.page.tsx'],
      ['notes/note', 'src/notes/note.page.tsx'],
      ['cookies/clear-cookie', 'src/cookies/clear-cookie.page.tsx'],
    ]) {
      pages.push({ id, relativeFile: rel, file: join(rootDir, rel) });
    }

    await generateFlightEntries({ config, pages });
    const map = await readPagesMap(rootDir);

    assert.ok(map.has('admin'));
    assert.ok(map.has('notes/note'));
    assert.ok(map.has('cookies/clear-cookie'));

    assert.strictEqual(map.get('note'), map.get('notes/note'));
    assert.strictEqual(map.get('clear-cookie'), map.get('cookies/clear-cookie'));

    assert.strictEqual(map.get('admin'), 'Page0');
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('pages map omits alias entries when basenames collide', async () => {
  const { rootDir, config, pages } = await scaffold();

  try {
    for (const [id, rel] of [
      ['admin', 'src/admin.page.tsx'],
      ['users/admin', 'src/users/admin.page.tsx'],
      ['settings/admin', 'src/settings/admin.page.tsx'],
    ]) {
      pages.push({ id, relativeFile: rel, file: join(rootDir, rel) });
    }

    await generateFlightEntries({ config, pages });
    const map = await readPagesMap(rootDir);

    assert.ok(map.has('admin'));
    assert.ok(map.has('users/admin'));
    assert.ok(map.has('settings/admin'));

    assert.strictEqual(map.get('admin'), 'Page0');
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
