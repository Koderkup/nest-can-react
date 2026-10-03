import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert';
import {
  isWatchablePageFile,
  resolveConfigWatchPaths,
  resolvePageWatchRoots,
} from './dev-watch.mjs';

function makeConfig(rootDir, pages) {
  return {
    rootDir,
    pages,
  };
}

async function tempDir() {
  return mkdtemp(join(tmpdir(), 'nest-cr-watch-'));
}

test('watch roots follow src by default', async () => {
  const rootDir = await tempDir();

  try {
    await mkdir(join(rootDir, 'src'), { recursive: true });

    const roots = resolvePageWatchRoots(
      makeConfig(rootDir, {
        include: ['src/**/*.page.tsx'],
        exclude: [],
      }),
    );

    assert.deepStrictEqual(roots, [resolve(rootDir, 'src')]);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('watch roots follow a custom include directory outside src', async () => {
  const rootDir = await tempDir();

  try {
    await mkdir(join(rootDir, 'app/views'), { recursive: true });
    await mkdir(join(rootDir, 'src'), { recursive: true });

    const roots = resolvePageWatchRoots(
      makeConfig(rootDir, {
        include: ['app/**/*.page.tsx'],
        exclude: [],
      }),
    );

    assert.deepStrictEqual(roots, [resolve(rootDir, 'app')]);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('a literal include pattern watches its parent directory', async () => {
  const rootDir = await tempDir();

  try {
    await mkdir(join(rootDir, 'app/views'), { recursive: true });

    const roots = resolvePageWatchRoots(
      makeConfig(rootDir, {
        include: ['app/views/home.page.tsx'],
        exclude: [],
      }),
    );

    assert.deepStrictEqual(roots, [resolve(rootDir, 'app/views')]);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('multiple include patterns yield one root each, sorted', async () => {
  const rootDir = await tempDir();

  try {
    await mkdir(join(rootDir, 'src'), { recursive: true });
    await mkdir(join(rootDir, 'app'), { recursive: true });

    const roots = resolvePageWatchRoots(
      makeConfig(rootDir, {
        include: ['src/**/*.page.tsx', 'app/**/*.page.tsx'],
        exclude: [],
      }),
    );

    assert.deepStrictEqual(roots, [
      resolve(rootDir, 'app'),
      resolve(rootDir, 'src'),
    ]);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('a not-yet-created root collapses to its nearest existing ancestor', async () => {
  const rootDir = await tempDir();

  try {
    await mkdir(join(rootDir, 'src'), { recursive: true });

    const roots = resolvePageWatchRoots(
      makeConfig(rootDir, {
        include: ['src/admin/tenants/**/*.page.tsx'],
        exclude: [],
      }),
    );

    // src/admin/tenants does not exist yet; src does, so it is watched
    // instead and creating the nested directories is still observed.
    assert.deepStrictEqual(roots, [resolve(rootDir, 'src')]);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('generated output directories are never watched', async () => {
  const rootDir = await tempDir();

  try {
    await mkdir(join(rootDir, '.nest-can-react/generated'), {
      recursive: true,
    });

    const roots = resolvePageWatchRoots(
      makeConfig(rootDir, {
        include: ['.nest-can-react/**/*.page.tsx'],
        exclude: [],
      }),
    );

    assert.deepStrictEqual(roots, []);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('config watch paths include only files that exist', async () => {
  const rootDir = await tempDir();

  try {
    assert.deepStrictEqual(resolveConfigWatchPaths(rootDir), []);

    await writeFile(join(rootDir, 'nest.react.json'), '{}');
    assert.deepStrictEqual(resolveConfigWatchPaths(rootDir), [
      resolve(rootDir, 'nest.react.json'),
    ]);

    await writeFile(join(rootDir, 'nest-can-react.config.mjs'), 'export default {}');
    assert.deepStrictEqual(resolveConfigWatchPaths(rootDir), [
      resolve(rootDir, 'nest.react.json'),
      resolve(rootDir, 'nest-can-react.config.mjs'),
    ]);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('a config override replaces the default watch list', async () => {
  const rootDir = await tempDir();

  try {
    await writeFile(join(rootDir, 'nest.react.json'), '{}');
    await writeFile(join(rootDir, 'custom.config.json'), '{}');

    assert.deepStrictEqual(
      resolveConfigWatchPaths(rootDir, { config: 'custom.config.json' }),
      [resolve(rootDir, 'custom.config.json')],
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('page files matching include patterns are watchable', async () => {
  const rootDir = await tempDir();
  const config = makeConfig(rootDir, {
    include: ['app/**/*.page.tsx'],
    exclude: ['app/**/*.test.tsx'],
  });

  try {
    assert.strictEqual(
      isWatchablePageFile(join('app', 'notes', 'list.page.tsx'), config),
      true,
    );
    assert.strictEqual(isWatchablePageFile(join('notes', 'list.page.tsx'), config), true);
    assert.strictEqual(isWatchablePageFile('list.page.tsx', config), true);
    assert.strictEqual(
      isWatchablePageFile(join('app', 'list.page.ts'), config),
      false,
    );
    assert.strictEqual(
      isWatchablePageFile(join('app', 'layout.tsx'), config),
      false,
    );
    assert.strictEqual(isWatchablePageFile(undefined, config), false);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('excluded page patterns never trigger the watcher', async () => {
  const rootDir = await tempDir();
  const config = makeConfig(rootDir, {
    include: ['src/**/*.page.tsx', 'src/**/*.test.tsx'],
    exclude: ['src/**/*.test.tsx'],
  });

  try {
    assert.strictEqual(isWatchablePageFile('home.page.tsx', config), true);
    assert.strictEqual(isWatchablePageFile('home.test.tsx', config), false);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('a literal include pattern only matches that exact file name', async () => {
  const rootDir = await tempDir();
  const config = makeConfig(rootDir, {
    include: ['app/views/home.page.tsx'],
    exclude: [],
  });

  try {
    assert.strictEqual(isWatchablePageFile('home.page.tsx', config), true);
    assert.strictEqual(isWatchablePageFile('other.page.tsx', config), false);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('generated entry files never trigger the page watcher', async () => {
  const rootDir = await tempDir();
  const config = makeConfig(rootDir, {
    include: ['src/**/*.page.tsx'],
    exclude: [],
  });

  try {
    assert.strictEqual(isWatchablePageFile(join('.nest-can-react', 'x.page.tsx'), config), false);
    assert.strictEqual(
      isWatchablePageFile(join('node_modules', 'pkg', 'a.page.tsx'), config),
      false,
    );
    assert.strictEqual(isWatchablePageFile(join('src', 'react-pages.ts'), config), false);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});