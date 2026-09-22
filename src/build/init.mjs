import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const templateDir = join(packageRoot, 'templates/starter');
const PACKAGE_NAME = 'nest-can-react';

export async function initStarter(args) {
  const force = args.includes('--force');
  const dirArg = args.find((arg) => arg !== '--force');
  const targetDir = resolve(process.cwd(), dirArg ?? '.');

  if (!existsSync(templateDir)) {
    throw new Error(`Starter template was not found at ${templateDir}.`);
  }

  const appPackage = await readAppPackage(targetDir);

  if (!isNestProject(targetDir, appPackage)) {
    throw new Error(
      `${targetDir} is not a NestJS project. Install ${PACKAGE_NAME} in an existing Nest app, then run \`${PACKAGE_NAME} init\`.`,
    );
  }

  const sourceRoot = await readSourceRoot(targetDir);
  const pkg = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));

  await copyTemplateFiles(targetDir, sourceRoot, force);
  await patchAppModule(join(targetDir, sourceRoot, 'app.module.ts'), force);
  await patchPackageJson(join(targetDir, 'package.json'), appPackage, pkg.version);
  await patchNestCli(join(targetDir, 'nest-cli.json'), force);
  await patchTsconfig(join(targetDir, 'tsconfig.json'));
  await patchGitignore(join(targetDir, '.gitignore'));

  console.log(`Added ${PACKAGE_NAME} starter to ${targetDir}`);
  console.log(`  ${sourceRoot}/welcome  →  GET /welcome`);
  console.log('Next:');
  console.log('  npm install');
  console.log('  npm run view:dev');
}

async function readAppPackage(targetDir) {
  const packagePath = join(targetDir, 'package.json');

  if (!existsSync(packagePath)) {
    return null;
  }

  return JSON.parse(await readFile(packagePath, 'utf8'));
}

function isNestProject(targetDir, appPackage) {
  if (!appPackage || appPackage.name === PACKAGE_NAME) {
    return false;
  }

  const deps = {
    ...appPackage.dependencies,
    ...appPackage.devDependencies,
  };

  if (!deps['@nestjs/core']) {
    return false;
  }

  return (
    existsSync(join(targetDir, 'nest-cli.json')) ||
    existsSync(join(targetDir, 'src/app.module.ts'))
  );
}

async function readSourceRoot(targetDir) {
  const nestCliPath = join(targetDir, 'nest-cli.json');

  if (!existsSync(nestCliPath)) {
    return 'src';
  }

  const nestCli = JSON.parse(await readFile(nestCliPath, 'utf8'));
  return nestCli.sourceRoot ?? 'src';
}

async function copyTemplateFiles(targetDir, sourceRoot, force) {
  await writeNestReactConfig(targetDir, sourceRoot, force);

  const appSrc = join(targetDir, sourceRoot);
  await mkdir(appSrc, { recursive: true });
  await copyChildren(join(templateDir, 'src'), appSrc, force);
}

async function writeNestReactConfig(targetDir, sourceRoot, force) {
  const configPath = join(targetDir, 'nest.react.json');

  if (existsSync(configPath) && !force) {
    return;
  }

  const config = {
    layout: `${sourceRoot}/layout.tsx`,
    pages: {
      include: [`${sourceRoot}/**/*.page.tsx`],
      exclude: [`${sourceRoot}/**/*.test.tsx`, `${sourceRoot}/**/*.spec.tsx`],
    },
    client: {
      outDir: 'public/nest-can-react',
      publicPath: '/assets/nest-can-react',
      styles: [`${sourceRoot}/assets/layout.css`],
    },
  };

  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

async function copyChildren(fromDir, toDir, force) {
  const entries = await readdir(fromDir, { withFileTypes: true });

  for (const entry of entries) {
    const from = join(fromDir, entry.name);
    const to = join(toDir, entry.name);

    if (entry.isDirectory()) {
      await mkdir(to, { recursive: true });
      await copyChildren(from, to, force);
      continue;
    }

    if (existsSync(to) && !force) {
      continue;
    }

    await cp(from, to);
  }
}

async function patchAppModule(appModulePath, force) {
  if (!existsSync(appModulePath)) {
    await mkdir(dirname(appModulePath), { recursive: true });
    await writeFile(appModulePath, createAppModuleSource());
    return;
  }

  let source = await readFile(appModulePath, 'utf8');

  if (source.includes('WelcomeModule') && source.includes('NestReactModule') && !force) {
    return;
  }

  source = ensureImport(
    source,
    `import { NestReactModule } from '${PACKAGE_NAME}';`,
    PACKAGE_NAME,
  );
  source = ensureImport(
    source,
    "import { WelcomeModule } from './welcome/welcome.module';",
    './welcome/welcome.module',
  );

  if (!/imports\s*:/.test(source)) {
    source = source.replace(
      /@Module\(\s*\{/,
      '@Module({\n  imports: [NestReactModule.forRoot(), WelcomeModule],',
    );
  } else if (!source.includes('NestReactModule.forRoot()')) {
    if (/imports\s*:\s*\[\s*\]/.test(source)) {
      source = source.replace(
        /imports\s*:\s*\[\s*\]/,
        'imports: [NestReactModule.forRoot(), WelcomeModule]',
      );
    } else {
      source = source.replace(
        /imports\s*:\s*\[/,
        'imports: [NestReactModule.forRoot(), WelcomeModule, ',
      );
    }
  }

  await writeFile(appModulePath, source);
}

function createAppModuleSource() {
  return `import { Module } from '@nestjs/common';
import { NestReactModule } from '${PACKAGE_NAME}';
import { WelcomeModule } from './welcome/welcome.module';

@Module({
  imports: [NestReactModule.forRoot(), WelcomeModule],
})
export class AppModule {}
`;
}

function ensureImport(source, statement, marker) {
  if (source.includes(marker)) {
    return source;
  }

  const imports = [...source.matchAll(/^import .*;\n/gm)];

  if (imports.length > 0) {
    const last = imports[imports.length - 1];
    const index = last.index + last[0].length;
    return `${source.slice(0, index)}${statement}\n${source.slice(index)}`;
  }

  return `${statement}\n${source}`;
}

async function patchPackageJson(packagePath, appPackage, version) {
  appPackage.dependencies = {
    ...appPackage.dependencies,
    [PACKAGE_NAME]: `^${version}`,
    react: appPackage.dependencies?.react ?? '^19.1.0',
    'react-dom': appPackage.dependencies?.['react-dom'] ?? '^19.1.0',
    'react-server-dom-rspack':
      appPackage.dependencies?.['react-server-dom-rspack'] ?? '^0.1.0',
  };
  appPackage.devDependencies = {
    ...appPackage.devDependencies,
    '@types/react': appPackage.devDependencies?.['@types/react'] ?? '^19.0.0',
    '@types/react-dom':
      appPackage.devDependencies?.['@types/react-dom'] ?? '^19.0.0',
  };
  appPackage.scripts = {
    ...appPackage.scripts,
    'build:client': `${PACKAGE_NAME} build`,
    'view:dev': `${PACKAGE_NAME} dev`,
  };

  await writeFile(packagePath, `${JSON.stringify(appPackage, null, 2)}\n`);
}

async function patchNestCli(nestCliPath, force) {
  const templatePath = join(templateDir, 'nest-cli.json');

  if (!existsSync(templatePath) || !existsSync(nestCliPath)) {
    return;
  }

  let nestCli;

  try {
    nestCli = JSON.parse(await readFile(nestCliPath, 'utf8'));
  } catch {
    return;
  }

  let templateCli;

  try {
    templateCli = JSON.parse(await readFile(templatePath, 'utf8'));
  } catch {
    return;
  }

  const watchOptions = templateCli.watchOptions;

  if (!watchOptions) {
    return;
  }

  if (nestCli.watchOptions && !force) {
    return;
  }

  nestCli.watchOptions = watchOptions;
  await writeFile(nestCliPath, `${JSON.stringify(nestCli, null, 2)}\n`);
}

async function patchTsconfig(tsconfigPath) {
  if (!existsSync(tsconfigPath)) {
    return;
  }

  try {
    const tsconfig = JSON.parse(await readFile(tsconfigPath, 'utf8'));
    tsconfig.compilerOptions = {
      ...tsconfig.compilerOptions,
      jsx: tsconfig.compilerOptions?.jsx ?? 'react-jsx',
    };
    await writeFile(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);
  } catch {
    // Leave tsconfig with comments or trailing commas unchanged.
  }
}

async function patchGitignore(gitignorePath) {
  const lines = ['/.nest-can-react', '/public/nest-can-react'];
  let current = existsSync(gitignorePath)
    ? await readFile(gitignorePath, 'utf8')
    : '';

  for (const line of lines) {
    if (!current.split(/\r?\n/).includes(line)) {
      current = current.endsWith('\n') || current.length === 0
        ? `${current}${line}\n`
        : `${current}\n${line}\n`;
    }
  }

  await writeFile(gitignorePath, current);
}
