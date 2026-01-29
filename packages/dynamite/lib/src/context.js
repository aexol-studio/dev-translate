'use client';
import { createContext, useContext } from 'react';
const DynamiteContext = createContext(null);
export function useDynamite() {
    const ctx = useContext(DynamiteContext);
    if (!ctx) {
        throw new Error('useDynamite must be used within a DynamiteProvider. ' +
            'Wrap your component tree with <DynamiteProvider translations={...} locale={...}>');
    }
    const t = (key) => ctx.translations[key] ?? key;
    return {
        t,
        locale: ctx.locale,
        translations: ctx.translations,
    };
}
export { DynamiteContext };
//# sourceMappingURL=context.js.map