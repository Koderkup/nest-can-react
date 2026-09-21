"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPage = renderPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const server_1 = require("react-dom/server");
const context_1 = require("../data/context");
const default_layout_1 = __importDefault(require("./default-layout"));
const dev_hook_error_1 = require("../errors/dev-hook-error");
const layout_registry_1 = require("./layout-registry");
const runtime_html_1 = require("./runtime-html");
const runtime_parts_1 = require("./runtime-parts");
async function renderPage(pageOrType, propsOrOptions, maybeOptions) {
    const options = resolveOptions(pageOrType, propsOrOptions, maybeOptions);
    if (options.mode === 'streaming') {
        return renderStreamingPage(pageOrType, propsOrOptions, options);
    }
    if (options.mode === 'hydrated') {
        return renderBufferedPage(pageOrType, propsOrOptions, 'hydrated', server_1.renderToString);
    }
    return renderBufferedPage(pageOrType, propsOrOptions, 'static', server_1.renderToStaticMarkup);
}
function resolveOptions(pageOrType, propsOrOptions, maybeOptions) {
    if ((0, react_1.isValidElement)(pageOrType)) {
        return propsOrOptions ?? { mode: 'static' };
    }
    return maybeOptions ?? { mode: 'static' };
}
function resolvePageNode(pageOrType, propsOrOptions) {
    if ((0, react_1.isValidElement)(pageOrType)) {
        return invokePageType(pageOrType.type, pageOrType.props);
    }
    return invokePageType(pageOrType, propsOrOptions ?? {});
}
function invokePageType(type, props) {
    if (typeof type !== 'function') {
        throw new Error('renderPage expected a function component or <Page {...props} />.');
    }
    return type(props);
}
async function renderBufferedPage(pageOrType, propsOrOptions, mode, render) {
    const renderState = (0, context_1.createRenderState)();
    try {
        const markup = await (0, context_1.runWithFrontendContext)(renderState, () => {
            const page = resolvePageNode(pageOrType, propsOrOptions);
            const Layout = (0, layout_registry_1.getLayout)() ?? default_layout_1.default;
            return '<!DOCTYPE html>' + render((0, jsx_runtime_1.jsx)(Layout, { children: page }));
        });
        return (0, runtime_html_1.injectRuntime)(markup, (0, runtime_parts_1.createManifest)(mode, renderState));
    }
    catch (error) {
        (0, dev_hook_error_1.rethrowIfClientHookError)(error);
    }
}
async function renderStreamingPage(pageOrType, propsOrOptions, options) {
    const renderState = (0, context_1.createRenderState)();
    try {
        await (0, context_1.runWithFrontendContext)(renderState, async () => {
            const page = resolvePageNode(pageOrType, propsOrOptions);
            const Layout = (0, layout_registry_1.getLayout)() ?? default_layout_1.default;
            const documentTree = (0, jsx_runtime_1.jsx)(Layout, { children: page });
            await new Promise((resolve, reject) => {
                let didError = false;
                let stream;
                const transform = (0, runtime_html_1.createRuntimeInjectionTransform)(() => (0, runtime_parts_1.createRuntimeParts)((0, runtime_parts_1.createManifest)('streaming', renderState)));
                transform.on('finish', resolve);
                transform.on('error', reject);
                transform.pipe(options.response);
                stream = (0, server_1.renderToPipeableStream)(documentTree, {
                    onShellReady() {
                        options.response.status(didError ? 500 : (options.statusCode ?? 200));
                        options.response.setHeader('content-type', 'text/html');
                        transform.write('<!DOCTYPE html>');
                        stream.pipe(transform);
                    },
                    onShellError(error) {
                        reject(error);
                    },
                    onError(error) {
                        didError = true;
                        console.error(error);
                    },
                });
            });
        });
    }
    catch (error) {
        if (error instanceof dev_hook_error_1.ClientHookOnServerError ||
            (0, dev_hook_error_1.isClientHookError)(error)) {
            (0, dev_hook_error_1.sendClientHookErrorResponse)(options.response, (0, dev_hook_error_1.toClientHookOnServerError)(error));
            return;
        }
        throw error;
    }
}
//# sourceMappingURL=renderer.js.map