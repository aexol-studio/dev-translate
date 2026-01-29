'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { DynamiteContext } from './context.js';
export function DynamiteProvider({ children, translations, locale }) {
    const value = React.useMemo(() => ({ translations, locale }), [translations, locale]);
    return _jsx(DynamiteContext.Provider, { value: value, children: children });
}
//# sourceMappingURL=provider.js.map