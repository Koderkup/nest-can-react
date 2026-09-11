export type CommitRef = {
  __nr_commit: string;
};

type IslandManifestEntry = {
  id: string;
  name: string;
  mode: 'mount' | 'hydrate';
  props: Record<string, unknown>;
};

type PageManifest = {
  transportPath: string;
  loads: Record<string, unknown>;
  islands: IslandManifestEntry[];
};

type LoadResult = {
  key: string;
  data: unknown;
};

let manifest = createEmptyManifest();
let loads = manifest.loads;
let version = 0;
let initialized = false;
const pendingLoads = new Set<string>();
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
  loads = manifest.loads;
  initialized = true;
  pendingLoads.clear();
  notify();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersion() {
  return version;
}

export function getLoad<T>(key: string) {
  ensureRuntime();
  return loads[key] as T | undefined;
}

export function isLoadPending(key: string) {
  if (!canUseDOM()) {
    return false;
  }

  return pendingLoads.has(key);
}

export async function refresh(keys: string[]) {
  ensureBrowserRuntime();
  const uniqueKeys = [...new Set(keys)].filter(Boolean);

  if (uniqueKeys.length === 0) {
    return;
  }

  uniqueKeys.forEach((key) => pendingLoads.add(key));
  notify();

  try {
    const response = await fetch(`${manifest.transportPath}/loads`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ keys: uniqueKeys }),
    });

    if (!response.ok) {
      throw new Error('Load refresh failed.');
    }

    const result = (await response.json()) as { loads: LoadResult[] };
    const nextLoads = { ...loads };

    result.loads.forEach((load) => {
      nextLoads[load.key] = load.data;
    });

    loads = nextLoads;
    window.dispatchEvent(
      new CustomEvent('nr:loads-refreshed', {
        detail: { keys: uniqueKeys },
      }),
    );
  } finally {
    uniqueKeys.forEach((key) => pendingLoads.delete(key));
    notify();
  }
}

export async function commit(ref: CommitRef, payload: unknown) {
  ensureBrowserRuntime();

  const response = await fetch(`${manifest.transportPath}/commit`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      id: ref.__nr_commit,
      args: [payload],
    }),
  });

  if (!response.ok) {
    throw new Error('Commit failed.');
  }

  const result = (await response.json()) as {
    data?: unknown;
    revalidate?: string[];
  };

  if (Array.isArray(result.revalidate)) {
    await refresh(result.revalidate);
  }

  return result;
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
  loads = manifest.loads;
  initialized = true;
}

function ensureBrowserRuntime() {
  ensureRuntime();

  if (!canUseDOM()) {
    throw new Error(
      'Nest React client runtime is only available in a browser.',
    );
  }
}

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function createEmptyManifest(): PageManifest {
  return {
    transportPath: '/_nr',
    loads: {},
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

  return JSON.parse(script.textContent) as PageManifest;
}
