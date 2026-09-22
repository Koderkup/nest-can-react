#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const command = process.argv[2];
const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../src');

if (command === 'dev') {
  await import(pathToFileURL(join(srcRoot, 'build/dev.mjs')).href);
} else if (command === 'build') {
  const { buildNestReact } = await import(
    pathToFileURL(join(srcRoot, 'build/build.mjs')).href
  );
  await buildNestReact({ rootDir: process.cwd() });
} else if (command === 'init') {
  const { initStarter } = await import(
    pathToFileURL(join(srcRoot, 'build/init.mjs')).href
  );
  await initStarter(process.argv.slice(3));
} else {
  console.log(`Usage:
  nest-can-react init [dir] [--force]
  nest-can-react dev
  nest-can-react build
`);
  process.exit(command ? 1 : 0);
}
