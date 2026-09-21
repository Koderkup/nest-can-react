"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientHookOnServerFilter = void 0;
const common_1 = require("@nestjs/common");
const dev_hook_error_1 = require("../errors/dev-hook-error");
let ClientHookOnServerFilter = class ClientHookOnServerFilter {
    catch(exception, host) {
        const response = host.switchToHttp().getResponse();
        if (response.headersSent) {
            return;
        }
        (0, dev_hook_error_1.sendClientHookErrorResponse)(response, exception);
    }
};
exports.ClientHookOnServerFilter = ClientHookOnServerFilter;
exports.ClientHookOnServerFilter = ClientHookOnServerFilter = __decorate([
    (0, common_1.Catch)(dev_hook_error_1.ClientHookOnServerError)
], ClientHookOnServerFilter);
//# sourceMappingURL=dev-hook-error.filter.js.map