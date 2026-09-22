import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import rspack from '@rspack/core';
import { generateFlightEntries } from './codegen.mjs';
import { discoverPages } from './discover-pages.mjs';
import { loadConfig } from './load-config.mjs';
import { writeClientManifest } from './client-manifest.mjs';
import { createRspackConfigs } from './rspack-config.mjs';

export async function buildNestReact({ rootDir = process.cwd(), mode = 'production' } = {}) {
  const config = await loadConfig(rootDir, {});
  const pages = await discoverPages(config);

  if (pages.length === 0) {
    console.warn(
      'nest-can-react: no pages matched. Add src/**/*.page.tsx with "use server-entry".',
    );
  }

  const entries = await generateFlightEntries({ config, pages });
  const configs = createRspackConfigs({
    config,
    entries,
    mode,
  });

  await mkdir(config.outDir, { recursive: true });
  await mkdir(config.serverOutDir, { recursive: true });

  const compiler = rspack(configs);

  await new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      compiler.close(async (closeError) => {
        if (error || closeError) {
          reject(error ?? closeError);
          return;
        }

        if (stats?.hasErrors()) {
          console.error(stats.toString({ colors: true }));
          reject(new Error('nest-can-react build failed.'));
          return;
        }

        if (stats) {
          console.log(stats.toString({ colors: true, preset: 'minimal' }));
          await writeClientManifest(stats, config);
        }

        resolve();
      });
    });
  });

  await writeFile(
    join(config.serverOutDir, 'pages.json'),
    JSON.stringify(
      {
        pages: pages.map((page) => page.name),
        publicPath: config.publicPath,
      },
      null,
      2,
    ),
  );

  console.log(`nest-can-react: built ${pages.length} page(s).`);
  return { config, pages };
}

// CLI entry when imported by bin
if (import.meta.url === `file://${process.argv[1]}`) {
  await buildNestReact();
}
