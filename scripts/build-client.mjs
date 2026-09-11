import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outfile = join(rootDir, 'public/nest-react/client.js');

await mkdir(dirname(outfile), { recursive: true });

await esbuild.build({
  entryPoints: [join(rootDir, 'src/frontend/client/entry.tsx')],
  outfile,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  jsx: 'automatic',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV ?? 'development',
    ),
  },
});

console.log(`Built ${outfile}`);
