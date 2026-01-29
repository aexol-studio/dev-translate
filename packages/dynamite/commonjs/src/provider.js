"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamiteProvider = DynamiteProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const context_js_1 = require("./context.js");
function DynamiteProvider({ children, translations, locale }) {
    const value = react_1.default.useMemo(() => ({ translations, locale }), [translations, locale]);
    return (0, jsx_runtime_1.jsx)(context_js_1.DynamiteContext.Provider, { value: value, children: children });
}
//# sourceMappingURL=provider.js.map