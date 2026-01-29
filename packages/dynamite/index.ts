// Main entry point - client-side exports
export { useDynamite, DynamiteContext } from './src/context.js';
export { DynamiteProvider } from './src/provider.js';
export type { DynamiteProviderProps } from './src/provider.js';
export type { DynamiteConfig, TranslationMap, DynamiteContextValue, ExtractedStrings } from './src/types.js';

// Re-export extractor for programmatic use
export {
  extractStrings,
  extractStringsFromFile,
  extractStringsFromSource,
  extractStringsFromDirs,
} from './src/extractor.js';
