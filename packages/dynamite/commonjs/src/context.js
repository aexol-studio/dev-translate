"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamiteContext = void 0;
exports.useDynamite = useDynamite;
const react_1 = require("react");
const DynamiteContext = (0, react_1.createContext)(null);
exports.DynamiteContext = DynamiteContext;
function useDynamite() {
    const ctx = (0, react_1.useContext)(DynamiteContext);
    if (!ctx) {
        throw new Error('useDynamite must be used within a DynamiteProvider. ' +
            'Wrap your component tree with <DynamiteProvider translations={...} locale={...}>');
    }
    const t = (key) => { var _a; return (_a = ctx.translations[key]) !== null && _a !== void 0 ? _a : key; };
    return {
        t,
        locale: ctx.locale,
        translations: ctx.translations,
    };
}
//# sourceMappingURL=context.js.map