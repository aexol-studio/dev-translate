import fs from 'node:fs';
import path from 'node:path';
import type { DynamiteConfig, TranslationMap } from './types.js';

export type ServerConfig = Pick<DynamiteConfig, 'localesDir' | 'defaultLocale'>;

/**
 * Load translations from a JSON file for a specific locale
 *
 * @param locale - The locale to load (e.g., 'en', 'pl', 'de')
 * @param config - Configuration with localesDir path
 * @returns Translation map or empty object if file doesn't exist
 */
export function loadTranslations(locale: string, config: ServerConfig): TranslationMap {
  const filePath = path.join(config.localesDir, `${locale}.json`);

  if (!fs.existsSync(filePath)) {
    console.warn(`[Dynamite] Translation file not found: ${filePath}`);
    return {};
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as TranslationMap;
  } catch (error) {
    console.error(`[Dynamite] Failed to parse translation file: ${filePath}`, error);
    return {};
  }
}

/**
 * Async helper for React Server Components
 * Returns a t() function and locale info for server-side rendering
 *
 * @example
 * ```tsx
 * // In a React Server Component
 * import { getDynamite } from '@aexol/dynamite/server';
 *
 * const ServerPage = async () => {
 *   const { t } = await getDynamite('en', { localesDir: './locales', defaultLocale: 'en' });
 *   return <div>{t("Hello world")}</div>
 * }
 * ```
 */
export async function getDynamite(
  locale: string,
  config: ServerConfig,
): Promise<{
  t: (key: string) => string;
  locale: string;
  translations: TranslationMap;
}> {
  const translations = loadTranslations(locale, config);

  const t = (key: string): string => translations[key] ?? key;

  return {
    t,
    locale,
    translations,
  };
}

/**
 * Synchronous version of getDynamite for cases where async isn't needed
 */
export function getDynamiteSync(
  locale: string,
  config: ServerConfig,
): {
  t: (key: string) => string;
  locale: string;
  translations: TranslationMap;
} {
  const translations = loadTranslations(locale, config);

  const t = (key: string): string => translations[key] ?? key;

  return {
    t,
    locale,
    translations,
  };
}

/**
 * Get all available locales from the locales directory
 */
export function getAvailableLocales(config: ServerConfig): string[] {
  if (!fs.existsSync(config.localesDir)) {
    return [];
  }

  return fs
    .readdirSync(config.localesDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.basename(file, '.json'));
}

export type { DynamiteConfig, TranslationMap };
