import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert';
import { discoverPages, globToRegExp } from './discover-pages.mjs';

function makeConfig(rootDir, overrides = {}) {
  return {
    rootDir,
    outDir: join(rootDir, 'public/nest-can-react'),
    serverOutDir: join(rootDir, '.nest-can-react/server'),
    publicPath: '/assets/nest-can-react',
    pages: {
      include: ['src/**/*.page.tsx'],
      exclude: ['src/**/*.test.tsx', 'src/**/*.spec.tsx'],
    },
    styles: [],
    generatedDir: join(rootDir, '.nest-can-react/generated'),
    layoutEntry: join(rootDir, 'src/layout.tsx'),
    runtimeEntry: join(rootDir, 'src/app.runtime.tsx'),
    hmrPort: 9101,
    clientDevPort: 9102,
    ...overrides,
  };
}

async function writePage(rootDir, relPath, content) {
  const full = join(rootDir, relPath);
  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, content);
}

test('globToRegExp: ** matches zero path segments', () => {
  const re = globToRegExp('src/**/*.page.tsx');
  assert.strictEqual(re.test('src/admin.page.tsx'), true);
  assert.strictEqual(re.test('src/users/admin.page.tsx'), true);
  assert.strictEqual(re.test('src/users/nested/deep.page.tsx'), true);
});

test('globToRegExp: ** matches multiple path segments', () => {
  const re = globToRegExp('src/**');
  assert.strictEqual(re.test('src/a.tsx'), true);
  assert.strictEqual(re.test('src/sub/b.tsx'), true);
  assert.strictEqual(re.test('src/sub/deep/c.tsx'), true);
});

test('globToRegExp: plain * does not cross path separators', () => {
  const re = globToRegExp('*.ts');
  assert.strictEqual(re.test('a.ts'), true);
  assert.strictEqual(re.test('sub/b.ts'), false);
});

test('globToRegExp: special regex chars are escaped', () => {
  const re = globToRegExp('src/(admin).page.tsx');
  assert.strictEqual(re.test('src/(admin).page.tsx'), true);
  assert.strictEqual(re.test('src/admin.page.tsx'), false);
});

test('page id is derived from path relative to include prefix', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'nest-cr-'));
  try {
    await writePage(rootDir, 'src/admin.page.tsx', 'export default function Admin() {}');
    await writePage(rootDir, 'src/users/admin.page.tsx', 'export default function UsersAdmin() {}');

    const pages = await discoverPages(makeConfig(rootDir));
    const ids = pages.map((p) => p.id).sort();
    assert.deepStrictEqual(ids, ['admin', 'users/admin']);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('same basename in different dirs yields distinct ids, no error', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'nest-cr-'));
  try {
    await writePage(rootDir, 'src/admin.page.tsx', 'export default function Admin() {}');
    await writePage(rootDir, 'src/users/admin.page.tsx', 'export default function UsersAdmin() {}');
    await writePage(rootDir, 'src/settings/admin.page.tsx', 'export default function SettingsAdmin() {}');

    const pages = await discoverPages(makeConfig(rootDir));
    const ids = pages.map((p) => p.id).sort();
    assert.deepStrictEqual(ids, ['admin', 'settings/admin', 'users/admin']);
    assert.strictEqual(new Set(ids).size, ids.length);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('nested page keeps full folder structure in id', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'nest-cr-'));
  try {
    await writePage(rootDir, 'src/notes/note.page.tsx', 'export default function Note() {}');
    await writePage(rootDir, 'src/notes/list.page.tsx', 'export default function List() {}');

    const pages = await discoverPages(makeConfig(rootDir));
    const ids = pages.map((p) => p.id).sort();
    assert.deepStrictEqual(ids, ['notes/list', 'notes/note']);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('custom include pattern without wildcard uses full path as id', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'nest-cr-'));
  try {
    await writePage(rootDir, 'app/views/home.page.tsx', 'export default function Home() {}');

    const pages = await discoverPages(
      makeConfig(rootDir, {
        pages: {
          include: ['app/views/home.page.tsx'],
          exclude: [],
        },
      }),
    );
    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].id, 'home');
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('include pattern with directory segment strips it from id', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'nest-cr-'));
  try {
    await writePage(rootDir, 'app/views/home.page.tsx', 'export default function Home() {}');
    await writePage(rootDir, 'app/views/users/user.page.tsx', 'export default function User() {}');

    const pages = await discoverPages(
      makeConfig(rootDir, {
        pages: {
          include: ['app/views/**/*.page.tsx'],
          exclude: [],
        },
      }),
    );
    const ids = pages.map((p) => p.id).sort();
    assert.deepStrictEqual(ids, ['home', 'users/user']);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('discoverPages excludes patterns from config', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'nest-cr-'));
  try {
    await writePage(rootDir, 'src/welcome.page.tsx', 'export default function Welcome() {}');
    await writePage(rootDir, 'src/welcome.test.tsx', 'export default function Test() {}');

    const pages = await discoverPages(
      makeConfig(rootDir, {
        pages: {
          include: ['src/**/*.page.tsx', 'src/**/*.test.tsx'],
          exclude: ['src/**/*.test.tsx'],
        },
      }),
    );
    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].id, 'welcome');
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('discoverPages returns empty array when no pages exist', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'nest-cr-'));
  try {
    await mkdir(join(rootDir, 'src'), { recursive: true });
    const pages = await discoverPages(makeConfig(rootDir));
    assert.deepStrictEqual(pages, []);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});