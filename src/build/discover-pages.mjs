import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { readdir } from 'node:fs/promises';
import { toPosixPath } from './load-config.mjs';

export async function discoverPages(config) {
  const files = [];

  for (const pattern of config.pages.include) {
    const matches = await expandGlob(config.rootDir, pattern);
    files.push(...matches);
  }

  const exclude = config.pages.exclude.map((pattern) =>
    globToRegExp(pattern),
  );

  const pages = [];

  for (const file of [...new Set(files)].sort()) {
    const rel = toPosixPath(relative(config.rootDir, file));

    if (exclude.some((re) => re.test(rel))) {
      continue;
    }

    if (!existsSync(file)) {
      continue;
    }

    pages.push({
      file,
      relativeFile: rel,
    });
  }

  assignPageIds(pages, config.pages.include);

  return pages;
}

/**
 * Page ids are derived from the path relative to the include pattern's static
 * prefix, so two files that share a basename never collide:
 *
 *   src/admin.page.tsx        -> admin
 *   src/users/admin.page.tsx  -> users/admin
 *
 * The id becomes the key of the generated `pages` map and the `PageRef`
 * argument, so it has to be unique per file. Path-based derivation removes the
 * need for a collision error: nested pages keep their folder structure.
 */
function assignPageIds(pages, includePatterns) {
  const roots = includePatterns.map(staticPatternPrefix);

  for (const page of pages) {
    page.id = pageIdFromFile(page.relativeFile, roots);
  }
}

function pageIdFromFile(relativeFile, roots) {
  const withoutSuffix = relativeFile.replace(/\.page\.tsx?$/, '');

  for (const root of roots) {
    if (root && withoutSuffix.startsWith(root)) {
      const trimmed = withoutSuffix.slice(root.length).replace(/^\/+/, '');
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return withoutSuffix;
}

/**
 * Static path prefix of an include pattern, i.e. everything before the first
 * wildcard. A recursive pattern like `src` + double-star + `*.page.tsx` yields
 * `src/`. A literal pattern like `src/admin.page.tsx` has no wildcard, so its
 * prefix is the parent directory `src/`.
 */
export function staticPatternPrefix(pattern) {
  const normalized = pattern.replace(/\\/g, '/');
  const star = normalized.indexOf('*');

  if (star !== -1) {
    const before = normalized.slice(0, star);
    const slash = before.lastIndexOf('/');
    return slash === -1 ? '' : before.slice(0, slash + 1);
  }

  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash === -1 ? '' : normalized.slice(0, lastSlash + 1);
}

async function expandGlob(rootDir, pattern) {
  const normalized = pattern.replace(/\\/g, '/');
  const star = normalized.indexOf('*');

  if (star === -1) {
    return [resolve(rootDir, normalized)];
  }

  const before = normalized.slice(0, star);
  const dirPart = before.includes('/')
    ? before.slice(0, before.lastIndexOf('/'))
    : '';
  const baseDir = resolve(rootDir, dirPart || '.');
  const matcher = globToRegExp(normalized);
  const results = [];

  await walk(baseDir, async (file) => {
    const rel = toPosixPath(relative(rootDir, file));
    if (matcher.test(rel)) {
      results.push(file);
    }
  });

  return results;
}

async function walk(dir, onFile) {
  if (!existsSync(dir)) {
    return;
  }

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = resolve(dir, entry.name);

    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      await walk(full, onFile);
    } else if (entry.isFile()) {
      await onFile(full);
    }
  }
}

export function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '::DOUBLE_SLASH::')
    .replace(/\*\*/g, '::DOUBLE_STAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLE_SLASH::/g, '(?:.*/)?')
    .replace(/::DOUBLE_STAR::/g, '.*');

  return new RegExp(`^${escaped}$`);
}
