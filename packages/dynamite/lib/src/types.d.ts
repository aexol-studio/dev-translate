export type DynamiteConfig = {
    localesDir: string;
    defaultLocale: string;
    sourceLocale: string;
    targetLocales: string[];
    apiKey?: string;
    srcDirs?: string[];
    extensions?: string[];
};
export type TranslationMap = Record<string, string>;
export type DynamiteContextValue = {
    translations: TranslationMap;
    locale: string;
};
export type ExtractedStrings = string[];
