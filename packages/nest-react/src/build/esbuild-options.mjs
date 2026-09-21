const fileLoaders = {
  '.png': 'file',
  '.jpg': 'file',
  '.jpeg': 'file',
  '.gif': 'file',
  '.webp': 'file',
  '.avif': 'file',
  '.svg': 'file',
  '.ico': 'file',
  '.woff': 'file',
  '.woff2': 'file',
  '.ttf': 'file',
  '.eot': 'file',
  '.module.css': 'local-css',
};

export function createEsbuildOptions({
  codeSplitting,
  entryPoint,
  hmr,
  outdir,
  publicPath,
  stableNames,
}) {
  return {
    entryPoints: [entryPoint],
    outdir,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    jsx: 'automatic',
    jsxDev: Boolean(hmr),
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
    splitting: codeSplitting,
    entryNames: stableNames
      ? codeSplitting
        ? 'runtime'
        : 'client'
      : codeSplitting
        ? 'runtime-[hash]'
        : 'client-[hash]',
    chunkNames: 'chunks/[name]-[hash]',
    assetNames: stableNames ? 'assets/[name]' : 'assets/[name]-[hash]',
    publicPath: `${publicPath}/`,
    loader: fileLoaders,
    metafile: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV ?? 'development',
      ),
    },
  };
}

export function formatEsbuildErrors(errors) {
  return errors
    .map((error) => {
      const location = error.location
        ? `${error.location.file}:${error.location.line}:${error.location.column} `
        : '';
      return `${location}${error.text}`;
    })
    .join('\n');
}
