"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectRuntime = injectRuntime;
exports.injectRuntimeAssets = injectRuntimeAssets;
exports.createRuntimeInjectionTransform = createRuntimeInjectionTransform;
const node_stream_1 = require("node:stream");
const client_assets_1 = require("../assets/client-assets");
const runtime_parts_1 = require("./runtime-parts");
function injectRuntime(markup, manifest) {
    return injectRuntimeHtml(markup, (0, runtime_parts_1.createRuntimeParts)(manifest));
}
function injectRuntimeHtml(markup, parts) {
    return injectRuntimeAssets(ensureDocumentSlots(markup), parts);
}
function injectRuntimeAssets(markup, parts) {
    const withStyles = injectStylesheets(markup, parts.stylesheets);
    const documentAssets = withStyles.injected
        ? parts.documentAssets
        : `${parts.stylesheets}${parts.documentAssets}`;
    const html = withStyles.markup;
    const bodyClose = html.lastIndexOf('</body>');
    if (bodyClose === -1) {
        return `${html}${documentAssets}</div>${parts.moduleScript}`;
    }
    const beforeBodyClose = html.slice(0, bodyClose);
    const afterBodyClose = html.slice(bodyClose);
    const documentClose = beforeBodyClose.lastIndexOf('</div>');
    if (documentClose === -1) {
        return `${beforeBodyClose}${documentAssets}</div>${parts.moduleScript}${afterBodyClose}`;
    }
    return `${beforeBodyClose.slice(0, documentClose)}${documentAssets}${beforeBodyClose.slice(documentClose)}${parts.moduleScript}${afterBodyClose}`;
}
function injectStylesheets(markup, stylesheets) {
    if (!stylesheets || !/<\/head>/i.test(markup)) {
        return { markup, injected: false };
    }
    return {
        markup: markup.replace(/<\/head>/i, `${stylesheets}</head>`),
        injected: true,
    };
}
function ensureDocumentSlots(markup) {
    if (markup.includes('id="nr-document"')) {
        return markup;
    }
    return markup.replace(/<body([^>]*)>([\s\S]*)<\/body>/i, '<body$1><div id="nr-runtime"></div><div id="nr-document">$2</div></body>');
}
function createRuntimeInjectionTransform(runtimeFactory) {
    let pending = '';
    let tail = '';
    let insertedSlots = false;
    let insertedGlobalStyles = false;
    const tailSize = 2048;
    return new node_stream_1.Transform({
        transform(chunk, _encoding, callback) {
            pending += chunk.toString();
            if (!insertedGlobalStyles && /<\/head>/i.test(pending)) {
                const globalStyles = (0, runtime_parts_1.createStylesheetTags)((0, client_assets_1.getGlobalStylesheetHrefs)());
                if (globalStyles) {
                    pending = pending.replace(/<\/head>/i, `${globalStyles}</head>`);
                }
                insertedGlobalStyles = true;
            }
            if (!insertedSlots &&
                !pending.includes('id="nr-document"') &&
                /<body[^>]*>/i.test(pending)) {
                pending = pending.replace(/<body([^>]*)>/i, '<body$1><div id="nr-runtime"></div><div id="nr-document">');
                insertedSlots = true;
            }
            if (!/<body[^>]*>/i.test(pending) && tail.length === 0) {
                callback();
                return;
            }
            tail += pending;
            pending = '';
            if (tail.length > tailSize) {
                this.push(tail.slice(0, -tailSize));
                tail = tail.slice(-tailSize);
            }
            callback();
        },
        flush(callback) {
            let markup = pending + tail;
            if (insertedSlots) {
                markup = markup.replace(/<\/body>/i, '</div></body>');
            }
            const parts = runtimeFactory();
            if (insertedGlobalStyles) {
                parts.stylesheets = parts.islandStylesheets;
            }
            this.push(injectRuntimeAssets(markup, parts));
            callback();
        },
    });
}
//# sourceMappingURL=runtime-html.js.map