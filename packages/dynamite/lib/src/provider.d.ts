import React from 'react';
import type { TranslationMap } from './types.js';
export type DynamiteProviderProps = {
    children: React.ReactNode;
    translations: TranslationMap;
    locale: string;
};
export declare function DynamiteProvider({ children, translations, locale }: DynamiteProviderProps): import("react/jsx-runtime").JSX.Element;
