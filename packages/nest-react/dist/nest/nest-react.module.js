"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NestReactModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestReactModule = void 0;
require("../assets/register-assets");
const node_path_1 = require("node:path");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const express_1 = __importDefault(require("express"));
const client_assets_1 = require("../assets/client-assets");
const dev_hook_error_filter_1 = require("./dev-hook-error.filter");
const load_generated_boot_1 = require("./load-generated-boot");
(0, load_generated_boot_1.loadGeneratedServerBoot)();
const publicDir = (0, node_path_1.join)(process.cwd(), 'public');
const servePublic = express_1.default.static(publicDir, {
    setHeaders(res) {
        if (process.env.NODE_ENV !== 'production') {
            res.setHeader('Cache-Control', 'no-store');
        }
    },
});
function serveNestReactAssets(req, res, next) {
    const originalUrl = req.originalUrl.split('?')[0];
    if (!originalUrl.startsWith('/assets/')) {
        return next();
    }
    const previousUrl = req.url;
    req.url = originalUrl.slice('/assets'.length) || '/';
    servePublic(req, res, (error) => {
        req.url = previousUrl;
        next(error);
    });
}
let NestReactModule = NestReactModule_1 = class NestReactModule {
    static forRoot(options = {}) {
        (0, client_assets_1.configureNestReact)(options);
        return {
            module: NestReactModule_1,
            providers: [
                {
                    provide: core_1.APP_FILTER,
                    useClass: dev_hook_error_filter_1.ClientHookOnServerFilter,
                },
            ],
        };
    }
    configure(consumer) {
        consumer.apply(serveNestReactAssets).forRoutes({
            path: '*path',
            method: common_1.RequestMethod.GET,
        });
    }
};
exports.NestReactModule = NestReactModule;
exports.NestReactModule = NestReactModule = NestReactModule_1 = __decorate([
    (0, common_1.Module)({})
], NestReactModule);
//# sourceMappingURL=nest-react.module.js.map