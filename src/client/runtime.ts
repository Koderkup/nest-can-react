type IslandManifestEntry = {
  id: string;
  name: string;
  mode: 'mount' | 'hydrate';
  props: Record<string, unknown>;
};

type PageManifest = {
  islands: IslandManifestEntry[];
};

let manifest = createEmptyManifest();
let version = 0;
let initialized = false;
const listeners = new Set<() => void>();

export function getManifest() {
  ensureRuntime();
  return manifest;
}

export function reloadManifest() {
  if (!canUseDOM()) {
    return;
  }

  manifest = readManifest();
  initialized = true;
  notify();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersion() {
  return version;
}

function notify() {
  version++;
  listeners.forEach((listener) => listener());
}

function ensureRuntime() {
  if (initialized || !canUseDOM()) {
    return;
  }

  manifest = readManifest();
  initialized = true;
}

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function createEmptyManifest(): PageManifest {
  return {
    islands: [],
  };
}

function readManifest(): PageManifest {
  if (!canUseDOM()) {
    return createEmptyManifest();
  }

  const script = document.getElementById('nr-manifest');

  if (!script?.textContent) {
    return createEmptyManifest();
  }

  const parsed = JSON.parse(script.textContent) as Partial<PageManifest>;

  return {
    islands: parsed.islands ?? [],
  };
}
