import { copyFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const ASSET_FILE = /\.(png|jpe?g|gif|svg|webp|woff2?|ttf|eot)$/i;

export async function syncServerAssetsToClientOut(serverOutDir, outDir) {
  let entries;

  try {
    entries = await readdir(serverOutDir, { withFileTypes: true });
  } catch {
    return;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && ASSET_FILE.test(entry.name))
      .map((entry) =>
        copyFile(join(serverOutDir, entry.name), join(outDir, entry.name)),
      ),
  );
}
