import { readdir } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { toPosixPath } from './load-config.mjs';

export function getIslandName(file) {
  const fileName = basename(file);
  return fileName.replace(/\.island\.[^.]+$/, '');
}

export async function discoverIslands(rootDir, config) {
  const files = await walk(rootDir);
  const include = config.include.map(globToRegex);
  const exclude = config.exclude.map(globToRegex);
  const islands = files
    .map((file) => ({
      file,
      relativeFile: toPosixPath(relative(rootDir, file)),
    }))
    .filter(({ relativeFile }) =>
      include.some((regex) => regex.test(relativeFile)),
    )
    .filter(
      ({ relativeFile }) => !exclude.some((regex) => regex.test(relativeFile)),
    )
    .map(({ file }) => ({
      file,
      name: getIslandName(file),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  assertUniqueIslandNames(islands);

  return islands;
}

async function walk(rootDir) {
  const ignoredDirectories = new Set([
    '.git',
    '.nest-react',
    'dist',
    'node_modules',
    'public',
  ]);
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await walk(path)));
      }

      continue;
    }

    if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function assertUniqueIslandNames(islands) {
  const seen = new Map();

  for (const island of islands) {
    const previous = seen.get(island.name);

    if (previous) {
      throw new Error(
        `Duplicate island name "${island.name}" found in ${previous} and ${island.file}.`,
      );
    }

    seen.set(island.name, island.file);
  }
}

function globToRegex(pattern) {
  const escaped = toPosixPath(pattern)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__NEST_REACT_GLOBSTAR__')
    .replace(/\*/g, '[^/]*');

  return new RegExp(`^${escaped.replace(/__NEST_REACT_GLOBSTAR__/g, '.*')}$`);
}
