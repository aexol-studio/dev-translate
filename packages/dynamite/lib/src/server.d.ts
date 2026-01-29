import type { DynamiteConfig, TranslationMap } from './types.js';
export type ServerConfig = Pick<DynamiteConfig, 'localesDir' | 'defaultLocale'>;
export declare function loadTranslations(locale: string, config: ServerConfig): TranslationMap;
export declare function getDynamite(locale: string, config: ServerConfig): Promise<{
    t: (key: string) => string;
    locale: string;
    translations: TranslationMap;
}>;
export declare function getDynamiteSync(locale: string, config: ServerConfig): {
    t: (key: string) => string;
    locale: string;
    translations: TranslationMap;
};
export declare function getAvailableLocales(config: ServerConfig): string[];
export type { DynamiteConfig, TranslationMap };
