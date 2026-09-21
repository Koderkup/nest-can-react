import { existsSync, readFileSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
import { dirname, extname, isAbsolute, join } from 'node:path';
import { transformSync } from 'esbuild';

const generatedTsLoaders = Symbol.for('nest-react.generated-ts-loaders');
const tsSpecifierResolve = Symbol.for('nest-react.ts-specifier-resolve');

const jsToTsExtensions: Record<string, string[]> = {
  '.js': ['.tsx', '.ts', '.jsx', '.js'],
  '.jsx': ['.tsx', '.jsx'],
  '.mjs': ['.mts', '.ts', '.mjs'],
  '.cjs': ['.cts', '.ts', '.cjs'],
};

type NodeModuleWithExtensions = typeof Module & {
  _resolveFilename(
    request: string,
    parent: NodeJS.Module | undefined,
    isMain: boolean,
    options?: unknown,
  ): string;
  _extensions: Record<
    string,
    (
      module: { _compile(content: string, filename: string): void },
      filename: string,
    ) => void
  >;
};

export function loadGeneratedServerBoot() {
  const generatedDir = join(process.cwd(), '.nest-can-react/generated');
  const bootPath = ['server-boot.js', 'server-boot.ts']
    .map((name) => join(generatedDir, name))
    .find((path) => existsSync(path));

  if (!bootPath) {
    throw new Error(
      `Nest Can React generated boot file was not found in ${generatedDir}. Run \`nest-can-react build\` first.`,
    );
  }

  installGeneratedTypeScriptLoaders(generatedDir);
  installTypeScriptSpecifierResolve();

  const require = createRequire(__filename);
  require(bootPath);
}

function installGeneratedTypeScriptLoaders(generatedDir: string) {
  const globalState = globalThis as typeof globalThis & {
    [generatedTsLoaders]?: boolean;
  };

  if (globalState[generatedTsLoaders]) {
    return;
  }

  const nodeModule = Module as NodeModuleWithExtensions;
  const originalTs = nodeModule._extensions['.ts'];

  nodeModule._extensions['.ts'] = function compileGeneratedTypeScript(
    module,
    filename,
  ) {
    if (filename.startsWith(generatedDir) || !originalTs) {
      compileWithEsbuild(module, filename, 'ts');
      return;
    }

    originalTs(module, filename);
  };

  nodeModule._extensions['.tsx'] = function compileTsx(module, filename) {
    compileWithEsbuild(module, filename, 'tsx');
  };

  nodeModule._extensions['.jsx'] = function compileJsx(module, filename) {
    compileWithEsbuild(module, filename, 'jsx');
  };

  globalState[generatedTsLoaders] = true;
}

function compileWithEsbuild(
  module: { _compile(content: string, filename: string): void },
  filename: string,
  loader: 'ts' | 'tsx' | 'jsx',
) {
  const source = readFileSync(filename, 'utf8');
  const result = transformSync(source, {
    loader,
    format: 'cjs',
    jsx: 'automatic',
    sourcemap: 'inline',
    sourcefile: filename,
  });

  module._compile(result.code, filename);
}

function installTypeScriptSpecifierResolve() {
  const globalState = globalThis as typeof globalThis & {
    [tsSpecifierResolve]?: boolean;
  };

  if (globalState[tsSpecifierResolve]) {
    return;
  }

  const nodeModule = Module as NodeModuleWithExtensions;

  if (typeof nodeModule._resolveFilename !== 'function') {
    return;
  }

  const originalResolve = nodeModule._resolveFilename.bind(nodeModule);

  nodeModule._resolveFilename = function resolveWithTypeScript(
    request: string,
    parent: NodeJS.Module | undefined,
    isMain: boolean,
    options?: unknown,
  ) {
    try {
      return originalResolve(request, parent, isMain, options);
    } catch (error) {
      const rewritten = rewriteTypeScriptSpecifier(request, parent?.filename);

      if (rewritten) {
        return originalResolve(rewritten, parent, isMain, options);
      }

      throw error;
    }
  };

  globalState[tsSpecifierResolve] = true;
}

function rewriteTypeScriptSpecifier(request: string, parentFilename?: string) {
  if (
    typeof request !== 'string' ||
    (!request.startsWith('.') &&
      !request.startsWith('/') &&
      !isAbsolute(request))
  ) {
    return undefined;
  }

  const fromDir = parentFilename ? dirname(parentFilename) : process.cwd();
  const absolute = isAbsolute(request) ? request : join(fromDir, request);
  const ext = extname(absolute).toLowerCase();
  const candidates = jsToTsExtensions[ext];

  if (!candidates) {
    return undefined;
  }

  const withoutExt = absolute.slice(0, -ext.length);

  for (const candidateExt of candidates) {
    const candidate = `${withoutExt}${candidateExt}`;

    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}
