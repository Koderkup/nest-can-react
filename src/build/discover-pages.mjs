import { existsSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
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

    const name = pageNameFromFile(rel);
    pages.push({
      name,
      file,
      relativeFile: rel,
    });
  }

  return pages;
}

function pageNameFromFile(relativeFile) {
  const base = basename(relativeFile).replace(/\.page\.tsx?$/, '');
  return base;
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

function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLE::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLE::/g, '.*');

  return new RegExp(`^${escaped}$`);
}
