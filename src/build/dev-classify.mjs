import { relative, sep } from 'node:path';

export function classifyChange(file, rootDir) {
  const path = toPosixPath(relative(rootDir, file));

  if (
    path.includes('/node_modules/') ||
    path.includes('/dist/') ||
    path.includes('/public/') ||
    path.includes('/.nest-react/') ||
    path.includes('/.git/') ||
    /\.d\.ts$/.test(path) ||
    /\.map$/.test(path)
  ) {
    return 'ignore';
  }

  if (/\.island\.[jt]sx$/.test(path)) {
    return 'client';
  }

  if (
    /app\.runtime\.[jt]sx$/.test(path) ||
    /\/context\/.*\.[jt]sx$/.test(path) ||
    /\/runtime\/.*\.[jt]sx$/.test(path)
  ) {
    return 'client';
  }

  if (/\.(css|module\.css)$/.test(path)) {
    return 'client';
  }

  if (
    /\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot)$/.test(path) &&
    path.startsWith('src/')
  ) {
    return 'client';
  }

  if (/\.page\.[jt]sx$/.test(path) || /(?:^|\/)layout\.[jt]sx$/.test(path)) {
    return 'server';
  }

  if (
    /\.(controller|module|service|filter|guard|interceptor|pipe)\.[jt]s$/.test(
      path,
    )
  ) {
    return 'server';
  }

  if (path.startsWith('src/') && /\.[jt]sx?$/.test(path)) {
    return 'server';
  }

  return 'ignore';
}

export function toPosixPath(path) {
  return path.split(sep).join('/');
}
