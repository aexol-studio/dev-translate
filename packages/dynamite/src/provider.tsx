'use client';

import React from 'react';
import { DynamiteContext } from './context.js';
import type { TranslationMap } from './types.js';

export type DynamiteProviderProps = {
  children: React.ReactNode;
  translations: TranslationMap;
  locale: string;
};

/**
 * Provider component for Dynamite translations
 *
 * @example
 * ```tsx
 * // In your layout or app component
 * import { DynamiteProvider } from '@aexol/dynamite';
 * import translations from '../locales/en.json';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <DynamiteProvider translations={translations} locale="en">
 *       {children}
 *     </DynamiteProvider>
 *   );
 * }
 * ```
 */
export function DynamiteProvider({ children, translations, locale }: DynamiteProviderProps) {
  const value = React.useMemo(() => ({ translations, locale }), [translations, locale]);

  return <DynamiteContext.Provider value={value}>{children}</DynamiteContext.Provider>;
}
