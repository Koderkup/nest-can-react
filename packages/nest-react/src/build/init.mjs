import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const templateDir = join(packageRoot, 'templates/starter');

export async function initStarter(args) {
  const force = args.includes('--force');
  const dirArg = args.find((arg) => arg !== '--force');
  const targetDir = resolve(process.cwd(), dirArg ?? '.');
  const name = dirArg ? dirArg.replace(/\/$/, '').split(/[\\/]/).pop() : 'nest-react-app';

  if (!existsSync(templateDir)) {
    throw new Error(`Starter template was not found at ${templateDir}.`);
  }

  if (existsSync(targetDir)) {
    const contents = await readdir(targetDir);

    if (contents.length > 0 && !force) {
      throw new Error(
        `Directory "${targetDir}" is not empty. Re-run with --force to overwrite.`,
      );
    }
  } else {
    await mkdir(targetDir, { recursive: true });
  }

  await cp(templateDir, targetDir, { recursive: true });
  await writePackageJson(targetDir, name);

  console.log(`Created Nest React app in ${targetDir}`);
  console.log('Next:');
  console.log(`  cd ${dirArg ?? '.'}`);
  console.log('  npm install');
  console.log('  npm run view:dev');
}

async function writePackageJson(targetDir, name) {
  const packageJsonPath = join(packageRoot, 'package.json');
  const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const appPackagePath = join(targetDir, 'package.json');
  const appPackage = JSON.parse(await readFile(appPackagePath, 'utf8'));

  appPackage.name = name;
  appPackage.dependencies = {
    ...appPackage.dependencies,
    'nest-react': `^${pkg.version}`,
  };

  await writeFile(
    appPackagePath,
    `${JSON.stringify(appPackage, null, 2)}\n`,
  );
}
