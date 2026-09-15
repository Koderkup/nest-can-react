import {
  getClientAssetManifest,
  getIslandAssetHints,
  getStylesheetHrefs,
  getGlobalStylesheetHrefs,
} from '../assets/client-assets';
import type { FrontendRenderState } from '../data/context';

export type RuntimeParts = {
  stylesheets: string;
  islandStylesheets: string;
  documentAssets: string;
  moduleScript: string;
};

export function createRuntimeParts(
  manifest: Record<string, unknown>,
): RuntimeParts {
  const clientAssets = getClientAssetManifest();
  const islandNames = getManifestIslandNames(manifest);
  const preloadAssets = [
    clientAssets.runtime,
    ...getIslandAssetHints(islandNames),
  ];

  return {
    stylesheets: createStylesheetTags(getStylesheetHrefs(islandNames)),
    islandStylesheets: createStylesheetTags(
      getStylesheetHrefs(islandNames).filter(
        (href) => !getGlobalStylesheetHrefs().includes(href),
      ),
    ),
    documentAssets: [
      ...preloadAssets.map(
        (asset) =>
          `<link rel="modulepreload" href="${escapeHtmlAttribute(asset)}">`,
      ),
      `<script id="nr-manifest" type="application/json">${serializeJson(manifest)}</script>`,
    ].join(''),
    moduleScript: `<script type="module" src="${escapeHtmlAttribute(clientAssets.runtime)}"></script>`,
  };
}

export function createStylesheetTags(hrefs: string[]) {
  return hrefs
    .map(
      (href) =>
        `<link rel="stylesheet" data-nr-style="1" href="${escapeHtmlAttribute(href)}">`,
    )
    .join('');
}

export function createManifest(
  mode: 'static' | 'hydrated' | 'streaming',
  renderState: FrontendRenderState,
) {
  return {
    mode,
    transportPath: '/_nr',
    loads: Object.fromEntries(renderState.loadResults),
    islands: renderState.islands,
  };
}

function serializeJson(value: unknown) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => {
    const escaped: Record<string, string> = {
      '<': '\\u003c',
      '>': '\\u003e',
      '&': '\\u0026',
      '\u2028': '\\u2028',
      '\u2029': '\\u2029',
    };

    return escaped[char];
  });
}

function getManifestIslandNames(manifest: Record<string, unknown>) {
  const islands = manifest.islands;

  if (!Array.isArray(islands)) {
    return [];
  }

  return [
    ...new Set(
      islands
        .map((island) =>
          typeof island === 'object' && island !== null && 'name' in island
            ? island.name
            : undefined,
        )
        .filter((name): name is string => typeof name === 'string'),
    ),
  ];
}

function escapeHtmlAttribute(value: string) {
  return value.replace(/[&"]/g, (char) => {
    const escaped: Record<string, string> = {
      '&': '&amp;',
      '"': '&quot;',
    };

    return escaped[char];
  });
}
