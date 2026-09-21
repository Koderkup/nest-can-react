"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectStylesheetHrefs = collectStylesheetHrefs;
exports.ensureStylesheets = ensureStylesheets;
exports.replaceStylesheets = replaceStylesheets;
const STYLE_ATTR = 'data-nr-style';
function collectStylesheetHrefs(doc = document) {
    return [...doc.querySelectorAll(`link[${STYLE_ATTR}]`)]
        .map((link) => link.getAttribute('href') ?? '')
        .filter(Boolean);
}
function ensureStylesheets(hrefs) {
    if (!canUseDOM()) {
        return;
    }
    const existing = new Set(collectStylesheetHrefs(document));
    for (const href of hrefs) {
        if (!href || hasStylesheet(existing, href)) {
            continue;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute(STYLE_ATTR, '1');
        document.head.appendChild(link);
        existing.add(href);
    }
}
function replaceStylesheets(hrefs) {
    if (!canUseDOM()) {
        return;
    }
    const stamp = String(Date.now());
    const unique = [...new Set(hrefs.filter(Boolean))];
    for (const href of unique) {
        const nextHref = withCacheBust(href, stamp);
        const current = findStylesheet(href);
        if (!current) {
            ensureStylesheets([nextHref]);
            continue;
        }
        if (pathnamesMatch(current.href, nextHref) &&
            current.href.includes('?t=')) {
            current.href = nextHref;
            continue;
        }
        const nextLink = document.createElement('link');
        nextLink.rel = 'stylesheet';
        nextLink.href = nextHref;
        nextLink.setAttribute(STYLE_ATTR, '1');
        nextLink.onload = () => {
            current.remove();
        };
        current.after(nextLink);
    }
}
function hasStylesheet(existing, href) {
    if (existing.has(href)) {
        return true;
    }
    return [...existing].some((current) => pathnamesMatch(current, href));
}
function findStylesheet(href) {
    return [...document.querySelectorAll(`link[${STYLE_ATTR}]`)].find((node) => pathnamesMatch(node.href, href));
}
function withCacheBust(href, stamp) {
    try {
        const next = new URL(href, window.location.origin);
        next.searchParams.set('t', stamp);
        return `${next.pathname}${next.search}`;
    }
    catch {
        return `${href.split('?')[0]}?t=${stamp}`;
    }
}
function pathnamesMatch(left, right) {
    try {
        return styleKey(left) === styleKey(right);
    }
    catch {
        return left.split('?')[0] === right.split('?')[0];
    }
}
function styleKey(href) {
    return new URL(href, window.location.origin).pathname.replace(/-[A-Z0-9]{6,10}(?=\.[a-z0-9]+$)/i, '');
}
function canUseDOM() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}
//# sourceMappingURL=styles.js.map