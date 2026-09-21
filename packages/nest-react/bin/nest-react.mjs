#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const command = process.argv[2];
const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../src');

if (command === 'dev') {
  await import(pathToFileURL(join(srcRoot, 'build/dev.mjs')).href);
} else if (command === 'build') {
  const { buildNestReactClient } = await import(
    pathToFileURL(join(srcRoot, 'build/build-client.mjs')).href
  );
  await buildNestReactClient({ rootDir: process.cwd() });
} else if (command === 'init') {
  const { initStarter } = await import(
    pathToFileURL(join(srcRoot, 'build/init.mjs')).href
  );
  await initStarter(process.argv.slice(3));
} else {
  console.log(`Usage:
  nest-react init [dir] [--force]
  nest-react dev
  nest-react build [--no-code-splitting]
`);
  process.exit(command ? 1 : 0);
}
