import type { DynamiteContextValue, TranslationMap } from './types.js';
declare const DynamiteContext: import("react").Context<DynamiteContextValue | null>;
export declare function useDynamite(): {
    t: (key: string) => string;
    locale: string;
    translations: TranslationMap;
};
export { DynamiteContext };
export type { DynamiteContextValue, TranslationMap };
