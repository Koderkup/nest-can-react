import test from 'node:test';
import assert from 'node:assert';
import {
  hashElementId,
  pageKey,
  redirectHistoryTarget,
  resolveNavigateTarget,
  shouldInterceptLinkClick,
  shouldRefetchOnNavigation,
  shouldRetryRscStatus,
} from './navigation.ts';

test('pageKey ignores the hash but keeps origin, path and query', () => {
  assert.strictEqual(
    pageKey('https://app.test/notes?page=2#top'),
    'https://app.test/notes?page=2',
  );
  assert.strictEqual(
    pageKey('https://app.test/notes'),
    pageKey('https://app.test/notes#other'),
  );
  assert.notStrictEqual(
    pageKey('https://app.test/notes'),
    pageKey('https://app.test/notes?page=2'),
  );
  assert.notStrictEqual(
    pageKey('https://app.test/a'),
    pageKey('https://app.test/b'),
  );
});

test('pageKey survives unparseable input instead of throwing', () => {
  assert.strictEqual(pageKey('not a url'), 'not a url');
});

test('shouldRefetchOnNavigation is false for hash-only changes', () => {
  assert.strictEqual(
    shouldRefetchOnNavigation('https://app.test/notes', 'https://app.test/notes#top'),
    false,
  );
  assert.strictEqual(
    shouldRefetchOnNavigation('https://app.test/notes', 'https://app.test/notes'),
    false,
  );
  assert.strictEqual(
    shouldRefetchOnNavigation('https://app.test/notes#top', 'https://app.test/notes'),
    false,
  );
});

test('shouldRefetchOnNavigation is true when path or query changes', () => {
  assert.strictEqual(
    shouldRefetchOnNavigation('https://app.test/notes', 'https://app.test/welcome'),
    true,
  );
  assert.strictEqual(
    shouldRefetchOnNavigation(
      'https://app.test/notes?page=1',
      'https://app.test/notes?page=2',
    ),
    true,
  );
});

test('shouldInterceptLinkClick takes over plain same-origin page links', () => {
  assert.strictEqual(
    shouldInterceptLinkClick({
      href: 'https://app.test/welcome',
      currentHref: 'https://app.test/notes',
    }),
    true,
  );
});

test('shouldInterceptLinkClick leaves hash-only links to the browser', () => {
  assert.strictEqual(
    shouldInterceptLinkClick({
      href: 'https://app.test/notes#content',
      currentHref: 'https://app.test/notes',
    }),
    false,
  );
  assert.strictEqual(
    shouldInterceptLinkClick({
      href: 'https://app.test/notes#content',
      currentHref: 'https://app.test/notes#other',
    }),
    false,
  );
});

test('shouldInterceptLinkClick refuses external origins', () => {
  assert.strictEqual(
    shouldInterceptLinkClick({
      href: 'https://docs.nestjs.com',
      currentHref: 'https://app.test/notes',
    }),
    false,
  );
});

test('shouldInterceptLinkClick refuses modified clicks and other targets', () => {
  const base = {
    href: 'https://app.test/welcome',
    currentHref: 'https://app.test/notes',
  };

  assert.strictEqual(shouldInterceptLinkClick({ ...base, metaKey: true }), false);
  assert.strictEqual(shouldInterceptLinkClick({ ...base, ctrlKey: true }), false);
  assert.strictEqual(shouldInterceptLinkClick({ ...base, shiftKey: true }), false);
  assert.strictEqual(shouldInterceptLinkClick({ ...base, altKey: true }), false);
  assert.strictEqual(shouldInterceptLinkClick({ ...base, button: 1 }), false);
  assert.strictEqual(shouldInterceptLinkClick({ ...base, target: '_blank' }), false);
  assert.strictEqual(shouldInterceptLinkClick({ ...base, download: true }), false);
  assert.strictEqual(shouldInterceptLinkClick({ ...base, defaultPrevented: true }), false);
});

test('shouldRetryRscStatus treats 4xx as terminal and keeps 5xx retryable', () => {
  assert.strictEqual(shouldRetryRscStatus(404), false);
  assert.strictEqual(shouldRetryRscStatus(401), false);
  assert.strictEqual(shouldRetryRscStatus(403), false);
  assert.strictEqual(shouldRetryRscStatus(418), false);
  assert.strictEqual(shouldRetryRscStatus(500), true);
  assert.strictEqual(shouldRetryRscStatus(503), true);
  assert.strictEqual(shouldRetryRscStatus(undefined), true);
});

test('redirectHistoryTarget returns the final same-origin URL', () => {
  assert.strictEqual(
    redirectHistoryTarget(
      'https://app.test/redir/temp',
      'https://app.test/welcome',
      true,
    ),
    'https://app.test/welcome',
  );
});

test('redirectHistoryTarget is null without a redirect or when unchanged', () => {
  assert.strictEqual(
    redirectHistoryTarget('https://app.test/a', 'https://app.test/b', false),
    null,
  );
  assert.strictEqual(
    redirectHistoryTarget('https://app.test/a', 'https://app.test/a', true),
    null,
  );
  assert.strictEqual(
    redirectHistoryTarget('https://app.test/a', undefined, true),
    null,
  );
});

test('redirectHistoryTarget never returns a cross-origin URL', () => {
  assert.strictEqual(
    redirectHistoryTarget('https://app.test/a', 'https://evil.test/b', true),
    null,
  );
});

test('resolveNavigateTarget classifies external, same-document and page links', () => {
  assert.strictEqual(
    resolveNavigateTarget('https://docs.nestjs.com', 'https://app.test/a').kind,
    'external',
  );
  assert.strictEqual(
    resolveNavigateTarget('/notes#top', 'https://app.test/notes').kind,
    'same-document',
  );
  assert.strictEqual(
    resolveNavigateTarget('/welcome', 'https://app.test/notes').kind,
    'page',
  );
  assert.strictEqual(
    resolveNavigateTarget('/notes?page=2', 'https://app.test/notes?page=1').kind,
    'page',
  );
});

test('resolveNavigateTarget resolves relative hrefs against the current URL', () => {
  const target = resolveNavigateTarget('welcome', 'https://app.test/notes');
  assert.strictEqual(target.kind, 'page');
  assert.strictEqual(target.href, 'https://app.test/welcome');
});

test('hashElementId decodes the fragment id', () => {
  assert.strictEqual(hashElementId('https://app.test/a#content'), 'content');
  assert.strictEqual(
    hashElementId('https://app.test/a#hello%20world'),
    'hello world',
  );
  assert.strictEqual(hashElementId('https://app.test/a'), null);
  assert.strictEqual(hashElementId('https://app.test/a#'), null);
});
