import { existsSync, watch } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { globToRegExp, staticPatternPrefix } from './discover-pages.mjs';

/** Config files `loadConfig` reads, in the order it checks them. */
const CONFIG_FILENAMES = ['nest.react.json', 'nest-can-react.config.mjs'];

/**
 * Directories a page watcher must never descend into. `.nest-can-react` holds
 * the generated entries, so watching it would make codegen retrigger itself.
 */
const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.nest-can-react',
]);

/**
 * Derive the directories the dev page watcher must observe from the project's
 * own `pages.include` patterns instead of assuming `src`.
 *
 * Only the static prefix of a pattern matters: `src` plus a recursive glob
 * needs `src` watched, and a literal pattern like `app/views/home.page.tsx`
 * needs `app/views`. A prefix that does not exist yet collapses to its nearest
 * existing ancestor, so creating the directory later is still observed.
 */
export function resolvePageWatchRoots(config) {
  const roots = new Set();

  for (const pattern of config.pages.include) {
    const prefix = staticPatternPrefix(pattern).replace(/\/+$/, '');
    const absolute = prefix
      ? resolve(config.rootDir, prefix)
      : config.rootDir;

    roots.add(nearestExistingDir(absolute));
  }

  return [...roots]
    .filter((root) => !isIgnored(root, config.rootDir))
    .sort();
}

/**
 * Config files worth watching in `rootDir`. Only files that exist are
 * returned; a `config` override replaces the default list so a custom config
 * path is watched instead of the defaults.
 */
export function resolveConfigWatchPaths(rootDir, overrides = {}) {
  const names = overrides.config ? [overrides.config] : CONFIG_FILENAMES;

  return names
    .map((name) => resolve(rootDir, name))
    .filter((path) => existsSync(path));
}

/**
 * Whether a watcher event should trigger codegen.
 *
 * Watchers report paths relative to the directory they observe, so the project
 * prefix an include pattern carries (the `app/` in a recursive glob under
 * `app`) is not present in the event. The watchers are already scoped to the
 * directories those patterns resolve to, so only the file-name part has to be
 * matched.
 */
export function isWatchablePageFile(filename, config) {
  if (!filename) {
    return false;
  }

  const normalized = filename.replace(/\\/g, '/');
  const segments = normalized.split('/');

  if (segments.some((segment) => IGNORED_DIRS.has(segment))) {
    return false;
  }

  const base = segments[segments.length - 1];
  const included = config.pages.include.some((pattern) =>
    matchesBasename(pattern, base),
  );

  if (!included) {
    return false;
  }

  return !config.pages.exclude.some((pattern) =>
    matchesBasename(pattern, base),
  );
}

/** Match a file name against the file-name part of a glob pattern. */
function matchesBasename(pattern, base) {
  const normalized = pattern.replace(/\\/g, '/');
  const namePattern = normalized.slice(normalized.lastIndexOf('/') + 1);
  return globToRegExp(namePattern).test(base);
}

/**
 * Watch the directories a project's `pages.include` patterns live in, plus the
 * config file. Returns a handle so the page roots can be re-pointed after the
 * config is reloaded, without leaking the old watchers.
 */
export function createDevWatchers({ config, onPagesChanged, onConfigChanged }) {
  const pageWatchers = [];
  const configWatchers = [];
  let pendingChange;
  let current = config;

  function scheduleOnce(callback) {
    clearTimeout(pendingChange);
    pendingChange = setTimeout(() => {
      void callback();
    }, 150);
  }

  function start(target, onEvent, recursive) {
    try {
      const watcher = watch(target, { recursive }, onEvent);

      watcher.on?.('error', (error) => {
        console.warn(`nest-can-react: watcher error (${error.message})`);
      });

      return watcher;
    } catch (error) {
      console.warn(
        `nest-can-react: could not watch ${target} (${error.message ?? error})`,
      );
      return undefined;
    }
  }

  function watchPages() {
    const roots = resolvePageWatchRoots(current);

    if (roots.length === 0) {
      console.warn(
        'nest-can-react: no existing directory matches pages.include — page changes will not be detected',
      );
      return;
    }

    for (const root of roots) {
      const watcher = start(
        root,
        (_event, filename) => {
          if (isWatchablePageFile(filename, current)) {
            scheduleOnce(onPagesChanged);
          }
        },
        true,
      );

      if (watcher) {
        pageWatchers.push(watcher);
      }
    }
  }

  function watchConfig() {
    for (const path of resolveConfigWatchPaths(current.rootDir)) {
      const watcher = start(
        path,
        () => {
          scheduleOnce(onConfigChanged);
        },
        false,
      );

      if (watcher) {
        configWatchers.push(watcher);
      }
    }
  }

  function closeAll(watchers) {
    for (const watcher of watchers) {
      watcher.close();
    }

    watchers.length = 0;
  }

  watchPages();
  watchConfig();

  return {
    /** Re-point the page roots after the config was reloaded. */
    reconfigure(next) {
      current = next;
      closeAll(pageWatchers);
      watchPages();
    },
    dispose() {
      clearTimeout(pendingChange);
      closeAll(pageWatchers);
      closeAll(configWatchers);
    },
  };
}

/**
 * Walk up until an existing directory is found. A page root that has not been
 * created yet still has to be watched once it appears, so the closest existing
 * ancestor stands in.
 */
function nearestExistingDir(path) {
  let current = path;

  while (!existsSync(current)) {
    const parent = dirname(current);

    if (parent === current) {
      return current;
    }

    current = parent;
  }

  return current;
}

function isIgnored(path, rootDir) {
  const relative = path.slice(rootDir.length).replace(/^[\\/]+/, '');
  return relative
    .split(/[\\/]/)
    .some((segment) => IGNORED_DIRS.has(segment));
}