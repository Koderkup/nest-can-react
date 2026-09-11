export type CommitRef = {
  __nr_commit: string;
};

type IslandManifestEntry = {
  id: string;
  name: string;
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

let manifest = readManifest();
let loads = manifest.loads;
let version = 0;
const pendingLoads = new Set<string>();
const listeners = new Set<() => void>();

export function getManifest() {
  return manifest;
}

export function reloadManifest() {
  manifest = readManifest();
  loads = manifest.loads;
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
  return loads[key] as T | undefined;
}

export function isLoadPending(key: string) {
  return pendingLoads.has(key);
}

export async function refresh(keys: string[]) {
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
  } finally {
    uniqueKeys.forEach((key) => pendingLoads.delete(key));
    notify();
  }
}

export async function commit(ref: CommitRef, payload: unknown) {
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

function readManifest(): PageManifest {
  const script = document.getElementById('nr-manifest');

  if (!script?.textContent) {
    return {
      transportPath: '/_nr',
      loads: {},
      islands: [],
    };
  }

  return JSON.parse(script.textContent) as PageManifest;
}
