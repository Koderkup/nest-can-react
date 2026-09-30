import test from 'node:test';
import assert from 'node:assert';
import { globToRegExp } from './discover-pages.mjs';

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

test('globToRegExp: **/literal matches zero or more leading dirs', () => {
  const re = globToRegExp('src/**/foo');
  assert.strictEqual(re.test('src/foo'), true);
  assert.strictEqual(re.test('src/a/foo'), true);
  assert.strictEqual(re.test('src/a/b/foo'), true);
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
