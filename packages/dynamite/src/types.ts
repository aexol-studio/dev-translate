export type DynamiteConfig = {
  /** Directory containing locale JSON files */
  localesDir: string;
  /** Default locale to use when none specified */
  defaultLocale: string;
  /** Source locale for translations (e.g., 'en') */
  sourceLocale: string;
  /** Target locales to translate to */
  targetLocales: string[];
  /** API key for dev-translate service */
  apiKey?: string;
  /** Source directories to scan for t() calls */
  srcDirs?: string[];
  /** File extensions to scan */
  extensions?: string[];
};

export type TranslationMap = Record<string, string>;

export type DynamiteContextValue = {
  translations: TranslationMap;
  locale: string;
};

export type ExtractedStrings = string[];

export type TranslationParams = Record<string, string | number>;
