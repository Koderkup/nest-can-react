"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installNavigation = installNavigation;
exports.navigateTo = navigateTo;
exports.refresh = refresh;
const mount_1 = require("./mount");
const styles_1 = require("./styles");
function getNavigationStore() {
    const globalState = globalThis;
    if (!globalState.__NR_NAVIGATION_STORE__) {
        globalState.__NR_NAVIGATION_STORE__ = {
            currentUrl: '',
            inFlightRefresh: undefined,
            installed: false,
            options: undefined,
            pageCache: new Map(),
        };
    }
    return globalState.__NR_NAVIGATION_STORE__;
}
function installNavigation(options) {
    const navigationStore = getNavigationStore();
    navigationStore.options = options;
    navigationStore.currentUrl = window.location.href;
    if (navigationStore.installed) {
        return;
    }
    navigationStore.installed = true;
    navigationStore.pageCache.set(navigationStore.currentUrl, takeSnapshot());
    window.history.replaceState({ nr: true }, '', navigationStore.currentUrl);
    document.addEventListener('click', async (event) => {
        const link = getAnchor(event.target);
        if (!link || shouldUseBrowserNavigation(link, event)) {
            return;
        }
        event.preventDefault();
        try {
            await navigate(link.href, options, 'push', false);
        }
        catch {
            window.location.href = link.href;
        }
    });
    window.addEventListener('popstate', () => {
        void restoreHistoryEntry(window.location.href, options);
    });
}
function navigateTo(href) {
    const navigationStore = getNavigationStore();
    if (!navigationStore.options) {
        window.location.assign(href);
        return Promise.resolve();
    }
    return navigate(href, navigationStore.options, 'push', false);
}
function refresh() {
    const navigationStore = getNavigationStore();
    if (!navigationStore.options) {
        return Promise.reject(new Error('Navigation is not installed.'));
    }
    if (navigationStore.inFlightRefresh) {
        return navigationStore.inFlightRefresh;
    }
    const options = navigationStore.options;
    navigationStore.inFlightRefresh = revalidateCurrent(options).finally(() => {
        navigationStore.inFlightRefresh = undefined;
    });
    return navigationStore.inFlightRefresh;
}
async function revalidateCurrent(options) {
    const navigationStore = getNavigationStore();
    const href = window.location.href;
    navigationStore.pageCache.delete(href);
    const { snapshot, finalUrl } = await fetchSnapshot(href);
    navigationStore.pageCache.set(finalUrl, snapshot);
    applySnapshot(snapshot, options, 'revalidate');
    navigationStore.currentUrl = finalUrl;
}
async function navigate(href, options, historyMode, useCache) {
    const navigationStore = getNavigationStore();
    navigationStore.pageCache.set(navigationStore.currentUrl, takeSnapshot());
    let snapshot;
    let finalUrl = href;
    if (useCache && navigationStore.pageCache.has(href)) {
        snapshot = navigationStore.pageCache.get(href);
    }
    else {
        const fetched = await fetchSnapshot(href);
        snapshot = fetched.snapshot;
        finalUrl = fetched.finalUrl;
    }
    navigationStore.pageCache.set(finalUrl, snapshot);
    applySnapshot(snapshot, options, 'replace');
    if (historyMode === 'push') {
        window.history.pushState({ nr: true }, '', finalUrl);
    }
    if (historyMode === 'replace') {
        window.history.replaceState({ nr: true }, '', finalUrl);
    }
    navigationStore.currentUrl = finalUrl;
    window.scrollTo(snapshot.scrollX, snapshot.scrollY);
}
async function restoreHistoryEntry(href, options) {
    try {
        await navigate(href, options, 'none', true);
    }
    catch {
        window.location.reload();
    }
}
async function fetchSnapshot(href) {
    const response = await fetch(href, {
        credentials: 'include',
        redirect: 'follow',
        headers: {
            accept: 'text/html',
            'x-nr-navigation': '1',
        },
    });
    if (!response.ok) {
        throw new Error('Navigation request failed.');
    }
    const html = await response.text();
    const nextDocument = new DOMParser().parseFromString(html, 'text/html');
    const nextSlot = nextDocument.getElementById('nr-document');
    const nextManifest = nextDocument.getElementById('nr-manifest');
    if (!nextSlot || !nextManifest?.textContent) {
        throw new Error('Navigation response is missing #nr-document or #nr-manifest.');
    }
    return {
        finalUrl: response.url,
        snapshot: {
            title: nextDocument.title,
            document: nextSlot.innerHTML,
            manifest: nextManifest.textContent,
            stylesheets: (0, styles_1.collectStylesheetHrefs)(nextDocument),
            scrollX: 0,
            scrollY: 0,
        },
    };
}
function applySnapshot(snapshot, options, mode) {
    const slot = getDocumentSlot();
    if (!slot) {
        window.location.reload();
        return;
    }
    document.title = snapshot.title;
    if (mode === 'revalidate') {
        restoreIslandHosts(slot, snapshot.document);
    }
    else {
        (0, mount_1.unmountHydrateIslands)();
        slot.innerHTML = snapshot.document;
    }
    writeManifest(snapshot.manifest);
    (0, styles_1.ensureStylesheets)(snapshot.stylesheets);
    options.onPageChanged();
}
function restoreIslandHosts(slot, nextHtml) {
    const saved = new Map();
    slot.querySelectorAll('[id^="nr-i"]').forEach((element) => {
        saved.set(element.id, element);
    });
    saved.forEach((element) => {
        element.remove();
    });
    slot.innerHTML = nextHtml;
    saved.forEach((node, id) => {
        const placeholder = document.getElementById(id);
        if (placeholder && placeholder !== node) {
            placeholder.replaceWith(node);
        }
    });
}
function takeSnapshot() {
    const slot = getDocumentSlot();
    return {
        title: document.title,
        document: slot?.innerHTML ?? '',
        manifest: document.getElementById('nr-manifest')?.textContent ?? '',
        stylesheets: (0, styles_1.collectStylesheetHrefs)(document),
        scrollX: window.scrollX,
        scrollY: window.scrollY,
    };
}
function writeManifest(text) {
    let script = document.getElementById('nr-manifest');
    if (!script) {
        script = document.createElement('script');
        script.id = 'nr-manifest';
        document.body.appendChild(script);
    }
    script.textContent = text;
}
function getDocumentSlot() {
    return document.getElementById('nr-document');
}
function getAnchor(target) {
    if (!(target instanceof Element)) {
        return null;
    }
    return target.closest('a');
}
function shouldUseBrowserNavigation(link, event) {
    const nextUrl = new URL(link.href);
    const currentUrl = new URL(window.location.href);
    const isHashOnlyNavigation = nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash.length > 0;
    return (event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        (link.target.length > 0 && link.target !== '_self') ||
        link.hasAttribute('download') ||
        nextUrl.origin !== currentUrl.origin ||
        isHashOnlyNavigation);
}
//# sourceMappingURL=navigation.js.map