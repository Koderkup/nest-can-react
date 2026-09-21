"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestLink = NestLink;
const jsx_runtime_1 = require("react/jsx-runtime");
function NestLink({ to, children, ...props }) {
    return ((0, jsx_runtime_1.jsx)("a", { href: to, ...props, children: children }));
}
//# sourceMappingURL=link.js.map