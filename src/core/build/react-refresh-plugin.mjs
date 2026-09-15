import { readFile } from 'node:fs/promises';
import { relative, sep } from 'node:path';

const componentFunctionExport =
  /export\s+(?:default\s+)?function\s+([A-Z][A-Za-z0-9]*)/g;
const componentConstExport =
  /export\s+(?:const|let|var)\s+([A-Z][A-Za-z0-9]*)\s*=/g;

export function createReactRefreshPlugin({ rootDir }) {
  return {
    name: 'nest-react-refresh',
    setup(build) {
      build.onLoad({ filter: /[\\/]src[\\/].*\.[jt]sx$/ }, async (args) => {
        if (shouldSkipRefreshFile(args.path)) {
          return;
        }

        const source = await readFile(args.path, 'utf8');
        const names = detectComponentExports(source);

        if (names.length === 0) {
          return;
        }

        const fileId = toPosixPath(relative(rootDir, args.path));
        const registers = names
          .map(
            (name) =>
              `  typeof ${name} === "function" && window.$RefreshRuntime$.register(${name}, ${JSON.stringify(`${fileId}:${name}`)});`,
          )
          .join('\n');

        return {
          contents: `${source}
if (window.$RefreshRuntime$) {
${registers}
}
`,
          loader: args.path.endsWith('.ts') ? 'ts' : 'tsx',
        };
      });
    },
  };
}

function shouldSkipRefreshFile(file) {
  const path = toPosixPath(file);

  return (
    path.includes('/node_modules/') ||
    path.includes('/.nest-react/') ||
    path.endsWith('/client/hmr.ts') ||
    path.endsWith('/client/refresh-runtime.ts') ||
    /\.page\.[jt]sx$/.test(path)
  );
}

function detectComponentExports(source) {
  return [
    ...new Set([
      ...matchAllNames(source, componentFunctionExport),
      ...matchAllNames(source, componentConstExport),
    ]),
  ];
}

function matchAllNames(source, pattern) {
  const names = [];
  pattern.lastIndex = 0;

  for (const match of source.matchAll(pattern)) {
    names.push(match[1]);
  }

  return names;
}

function toPosixPath(path) {
  return path.split(sep).join('/');
}
