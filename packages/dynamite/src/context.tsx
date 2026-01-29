'use client';

import { createContext, useContext } from 'react';
import type { DynamiteContextValue, TranslationMap } from './types.js';

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

  const t = (key: string): string => ctx.translations[key] ?? key;

  return {
    t,
    locale: ctx.locale,
    translations: ctx.translations,
  };
}

export { DynamiteContext };
export type { DynamiteContextValue, TranslationMap };
