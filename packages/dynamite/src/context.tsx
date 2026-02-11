'use client';

import { createContext, useContext } from 'react';
import type { DynamiteContextValue, TranslationMap, TranslationParams } from './types.js';
import { interpolate } from './utils.js';

const DynamiteContext = createContext<DynamiteContextValue | null>(null);

/**
 * Hook to access translations in client components
 *
 * @example
 * ```tsx
 * const Page = () => {
 *   const { t } = useDynamite();
 *   return <div>{t("Hello world")}</div>
 * }
 * ```
 */
export function useDynamite() {
  const ctx = useContext(DynamiteContext);

  if (!ctx) {
    throw new Error(
      'useDynamite must be used within a DynamiteProvider. ' +
        'Wrap your component tree with <DynamiteProvider translations={...} locale={...}>',
    );
  }

  const t = (key: string, params?: TranslationParams): string => interpolate(ctx.translations[key] ?? key, params);

  return {
    t,
    locale: ctx.locale,
    translations: ctx.translations,
  };
}

export { DynamiteContext };
export type { DynamiteContextValue, TranslationMap };
