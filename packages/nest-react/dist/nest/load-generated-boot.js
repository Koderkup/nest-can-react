"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadGeneratedServerBoot = loadGeneratedServerBoot;
const node_fs_1 = require("node:fs");
const node_module_1 = __importStar(require("node:module"));
const node_path_1 = require("node:path");
const esbuild_1 = require("esbuild");
const generatedTsLoaders = Symbol.for('nest-react.generated-ts-loaders');
const tsSpecifierResolve = Symbol.for('nest-react.ts-specifier-resolve');
const jsToTsExtensions = {
    '.js': ['.tsx', '.ts', '.jsx', '.js'],
    '.jsx': ['.tsx', '.jsx'],
    '.mjs': ['.mts', '.ts', '.mjs'],
    '.cjs': ['.cts', '.ts', '.cjs'],
};
function loadGeneratedServerBoot() {
    const generatedDir = (0, node_path_1.join)(process.cwd(), '.nest-react/generated');
    const bootPath = ['server-boot.js', 'server-boot.ts']
        .map((name) => (0, node_path_1.join)(generatedDir, name))
        .find((path) => (0, node_fs_1.existsSync)(path));
    if (!bootPath) {
        throw new Error(`Nest React generated boot file was not found in ${generatedDir}. Run \`nest-react build\` first.`);
    }
    installGeneratedTypeScriptLoaders(generatedDir);
    installTypeScriptSpecifierResolve();
    const require = (0, node_module_1.createRequire)(__filename);
    require(bootPath);
}
function installGeneratedTypeScriptLoaders(generatedDir) {
    const globalState = globalThis;
    if (globalState[generatedTsLoaders]) {
        return;
    }
    const nodeModule = node_module_1.default;
    const originalTs = nodeModule._extensions['.ts'];
    nodeModule._extensions['.ts'] = function compileGeneratedTypeScript(module, filename) {
        if (filename.startsWith(generatedDir) || !originalTs) {
            compileWithEsbuild(module, filename, 'ts');
            return;
        }
        originalTs(module, filename);
    };
    nodeModule._extensions['.tsx'] = function compileTsx(module, filename) {
        compileWithEsbuild(module, filename, 'tsx');
    };
    nodeModule._extensions['.jsx'] = function compileJsx(module, filename) {
        compileWithEsbuild(module, filename, 'jsx');
    };
    globalState[generatedTsLoaders] = true;
}
function compileWithEsbuild(module, filename, loader) {
    const source = (0, node_fs_1.readFileSync)(filename, 'utf8');
    const result = (0, esbuild_1.transformSync)(source, {
        loader,
        format: 'cjs',
        jsx: 'automatic',
        sourcemap: 'inline',
        sourcefile: filename,
    });
    module._compile(result.code, filename);
}
function installTypeScriptSpecifierResolve() {
    const globalState = globalThis;
    if (globalState[tsSpecifierResolve]) {
        return;
    }
    const nodeModule = node_module_1.default;
    if (typeof nodeModule._resolveFilename !== 'function') {
        return;
    }
    const originalResolve = nodeModule._resolveFilename.bind(nodeModule);
    nodeModule._resolveFilename = function resolveWithTypeScript(request, parent, isMain, options) {
        try {
            return originalResolve(request, parent, isMain, options);
        }
        catch (error) {
            const rewritten = rewriteTypeScriptSpecifier(request, parent?.filename);
            if (rewritten) {
                return originalResolve(rewritten, parent, isMain, options);
            }
            throw error;
        }
    };
    globalState[tsSpecifierResolve] = true;
}
function rewriteTypeScriptSpecifier(request, parentFilename) {
    if (typeof request !== 'string' ||
        (!request.startsWith('.') &&
            !request.startsWith('/') &&
            !(0, node_path_1.isAbsolute)(request))) {
        return undefined;
    }
    const fromDir = parentFilename ? (0, node_path_1.dirname)(parentFilename) : process.cwd();
    const absolute = (0, node_path_1.isAbsolute)(request) ? request : (0, node_path_1.join)(fromDir, request);
    const ext = (0, node_path_1.extname)(absolute).toLowerCase();
    const candidates = jsToTsExtensions[ext];
    if (!candidates) {
        return undefined;
    }
    const withoutExt = absolute.slice(0, -ext.length);
    for (const candidateExt of candidates) {
        const candidate = `${withoutExt}${candidateExt}`;
        if ((0, node_fs_1.existsSync)(candidate)) {
            return candidate;
        }
    }
    return undefined;
}
//# sourceMappingURL=load-generated-boot.js.map