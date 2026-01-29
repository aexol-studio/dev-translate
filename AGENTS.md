# AGENTS.md - dev-translate

> AI-powered i18n JSON translation tool with CLI and framework plugins

## Project Overview

**Name:** @aexol/dev-translate (monorepo)  
**Purpose:** Automatically translate i18n JSON files using AI via GraphQL API  
**Tech Stack:** TypeScript 5.5+, ES Modules, pnpm workspaces  
**API Endpoint:** `https://backend.devtranslate.app/graphql`

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI / Plugins                           │
│  ┌─────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │   cli   │  │ vite-plugin-dev- │  │ nextjs-dev-translate-  │ │
│  │         │  │    translate     │  │       plugin           │ │
│  └────┬────┘  └────────┬─────────┘  └───────────┬────────────┘ │
│       │                │                        │               │
│       │                └────────────┬───────────┘               │
│       │                             │                           │
│       ▼                             ▼                           │
│  ┌─────────┐                   ┌─────────┐                      │
│  │ config  │                   │  watch  │                      │
│  └────┬────┘                   └────┬────┘                      │
│       │                             │                           │
│       └──────────────┬──────────────┘                           │
│                      │                                          │
│                      ▼                                          │
│                 ┌─────────┐                                     │
│                 │  core   │ ◄── GraphQL API (Zeus client)       │
│                 └─────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Package Structure

### `packages/core` - @aexol/dev-translate-core

**Main translation logic and GraphQL API client**

Key exports:

- `translateLocaleFolder()` - Translate all JSON files in locale directory
- `predictLocaleFolder()` - Predict token consumption before translation
- `clearAccountCache()` - Clear translation cache for account
- `getOutputLanguages()` - Get list of output language folders
- `Languages` - Enum of supported languages
- `LogLevels` - Logging verbosity levels
- `BackendProps` - Backend configuration options type
- `LangPair` - Language/folder name pair type

Dependencies: `cross-fetch`, `p-queue`

### `packages/config` - @aexol/dev-translate-config

**Configuration file handling (.dev-translate.json)**

Key exports:

- `config(cwd)` - ConfigMaker instance for project configuration
- `ProjectOptions` - Full configuration type
- `LangPair` - Re-exported from core

Dependencies: `config-maker`, `@aexol/dev-translate-core`

### `packages/cli` - @aexol/dev-translate

**Commander-based CLI tool**

Commands:

- `translate` - Translate locale files (supports `-w` for watch mode)
- `predict` - Predict token consumption
- `clear` - Clear account cache

Dependencies: `commander`, `chalk`, `chokidar`, `@aexol/dev-translate-core`, `@aexol/dev-translate-config`, `@aexol/dev-translate-watch`

### `packages/watch` - @aexol/dev-translate-watch

**Chokidar-based file watcher for automatic translation**

Key exports:

- `watch(options)` - Start watching locale directory for changes
- `DevTranslateOptions` - Watch configuration type
- `Languages` - Re-exported from core

Dependencies: `chokidar`, `@aexol/dev-translate-core`

### `packages/vite-plugin-dev-translate` - @aexol/vite-plugin-dev-translate

**Vite plugin wrapper**

Key exports:

- `default` (devTranslatePlugin) - Vite plugin factory
- `Languages` - Re-exported from watch

Peer dependencies: `vite >=5`

### `packages/nextjs-dev-translate-plugin` - @aexol/nextjs-dev-translate-plugin

**Next.js plugin wrapper**

Key exports:

- `withDevTranslate(nextConfig, options)` - Next.js config wrapper
- `Languages` - Re-exported from watch

Peer dependencies: `next >=13`

### `packages/testground`

**Testing environment for development**

### `packages/dynamite` - @aexol/dynamite

**React i18n library with build-time string extraction and SSR/RSC support**

Key exports:

- `useDynamite()` - React hook for client-side translations
- `DynamiteProvider` - Context provider for translations
- `getDynamite()` - Async server utility for RSC
- `getDynamiteSync()` - Sync server utility
- `loadTranslations()` - Load translations from JSON files
- `extractStrings()` - Extract t() calls from source directories
- `extractStringsFromSource()` - Extract t() calls from source code

CLI Commands:

- `dynamite init` - Create .dynamite.json config file
- `dynamite extract` - Extract translation strings from source files
- `dynamite translate` - Translate extracted strings via API

Dependencies: `@aexol/dev-translate-core`, `commander`, `glob`, `typescript`

Peer dependencies: `react >=18`

## Key Types

### ProjectOptions (config)

```typescript
type ProjectOptions = BackendProps & {
  inputLanguageFolderName: string; // Folder name for source language (e.g., "en")
  inputLanguage: string; // Source language code (e.g., "ENGB")
  apiKey: string; // API key for translation service
  localeDir: string; // Directory containing locale folders
};
```

### BackendProps (core)

```typescript
type BackendProps = {
  context?: string; // Context for better translations
  excludePhrases?: string[]; // Phrases to exclude from translation
  excludeRegex?: string; // Regex pattern to exclude
  includeRegex?: string; // Regex pattern to include
  formality?: Formality; // Translation formality level
  excludeDotNotationKeys?: string[]; // Dot notation keys to exclude
  projectId?: string; // Project identifier
  omitCache?: boolean; // Skip cache for fresh translations
};
```

### DevTranslateOptions (watch)

```typescript
type DevTranslateOptions = BackendProps & {
  apiKey: string;
  folderName: string;
  lang: Languages;
  localeDir: string;
};
```

### LangPair (core)

```typescript
type LangPair = {
  lang: Languages; // Language enum value
  folderName: string; // Folder name in locale directory
};
```

### Languages (enum)

Supported languages: `BG`, `CS`, `DA`, `DE`, `EL`, `ENGB`, `ENUS`, `ES`, `ET`, `FI`, `FR`, `HU`, `ID`, `IT`, `JA`, `KO`, `LT`, `LV`, `NB`, `NL`, `PL`, `PTBR`, `PTPT`, `RO`, `RU`, `SK`, `SL`, `SV`, `TR`, `UK`, `ZH`

### DynamiteConfig (dynamite)

```typescript
type DynamiteConfig = {
  localesDir: string; // Where translation JSON files are stored
  defaultLocale: string; // Default locale code
  sourceLocale: string; // Source language code
  inputLanguage: Languages; // Source language for API
  targetLocales: string[]; // Target locale codes
  apiKey?: string; // API key (or use env var)
  srcDirs: string[]; // Source directories to scan
  include?: string[]; // Glob patterns to include
  exclude?: string[]; // Glob patterns to exclude
};
```

## Configuration Files

### `.dev-translate.json`

Project configuration file (created by CLI on first run):

```json
{
  "apiKey": "your-api-key",
  "localeDir": "./locales",
  "inputLanguageFolderName": "en",
  "inputLanguage": "ENGB",
  "context": "Optional context for translations",
  "excludePhrases": ["brand_name"],
  "excludeRegex": "^_",
  "formality": "default"
}
```

Environment variable override: `DEV_TRANSLATE_API_KEY`

### `.dynamite.json`

Dynamite configuration file (created by `dynamite init`):

```json
{
  "localesDir": "./locales",
  "defaultLocale": "en",
  "sourceLocale": "en",
  "inputLanguage": "ENGB",
  "targetLocales": ["de", "fr", "es"],
  "srcDirs": ["./src"],
  "include": ["**/*.tsx", "**/*.ts"],
  "exclude": ["node_modules/**"]
}
```

### `.dev-translate.timestamp.json`

Auto-generated timestamp file tracking last translation:

```json
{
  "timestamp": 1704067200000
}
```

## Translation Workflow

1. **Configuration**: CLI reads `.dev-translate.json` or prompts for values
2. **Discovery**: Core scans `localeDir` for source language folder and output folders
3. **Filtering**: Only files modified after last timestamp are processed
4. **Translation**: Files sent to GraphQL API with language pairs
5. **Output**: Translated JSON written to respective language folders
6. **Timestamp**: `.dev-translate.timestamp.json` updated

## Dynamite Workflow

Dynamite provides a different approach focused on React applications with build-time string extraction:

1. **Initialize**: Run `dynamite init` to create `.dynamite.json` config
2. **Write Code**: Use `t("string")` calls in your React components
3. **Extract**: Run `dynamite extract` to scan source files and generate source locale JSON
4. **Translate**: Run `dynamite translate` to translate to target locales via API
5. **Use**: Import hooks/utilities in your components

### Usage Examples

**Client Component:**

```tsx
'use client';
import { useDynamite } from '@aexol/dynamite';

const Page = () => {
  const { t } = useDynamite();
  return (
    <div>
      {t('Hello world')} {t('This is dynamite')}
    </div>
  );
};
```

**Server Component (RSC):**

```tsx
import { getDynamite } from '@aexol/dynamite/server';

export default async function Page() {
  const { t } = await getDynamite('en', { localesDir: './locales', defaultLocale: 'en' });
  return <div>{t('Hello world')}</div>;
}
```

**Layout with Provider:**

```tsx
import { DynamiteProvider } from '@aexol/dynamite';
import { loadTranslations } from '@aexol/dynamite/server';

export default function RootLayout({ children, params }) {
  const translations = loadTranslations(params.locale, { localesDir: './locales', defaultLocale: 'en' });
  return (
    <DynamiteProvider locale={params.locale} translations={translations}>
      {children}
    </DynamiteProvider>
  );
}
```

### GraphQL Operations

**Mutation - translate**

```graphql
mutation {
  api {
    translate(translate: TranslateInput) {
      results {
        result
        language
        consumedTokens
      }
    }
  }
}
```

**Query - predictTranslationCost**

```graphql
query {
  api {
    predictTranslationCost(translate: TranslateInput) {
      cost
      cached
    }
  }
}
```

**Mutation - clearCache**

```graphql
mutation {
  api {
    clearCache
  }
}
```

## Development

### Setup

```bash
pnpm install
pnpm build
```

### Build All Packages

```bash
pnpm run build
```

### Regenerate Zeus Client

```bash
pnpm run zeus
```

### Package-specific Development

```bash
cd packages/<package>
pnpm run start  # Watch mode with tspc
```

## Coding Conventions

### TypeScript

- **Version**: 5.5+
- **Module System**: ES Modules (`"type": "module"`)
- **Compiler**: `tspc` (ts-patch compiler for path transforms)
- **Path Aliases**: Use `@/` for internal imports in core package

### Code Style

- Use `async/await` for asynchronous operations
- Prefer functional patterns
- Export types alongside implementations
- Use `satisfies` for type narrowing
- Handle errors with try/catch, log to console

### File Structure

- Entry point: `index.ts` at package root
- Generated code: `src/zeus/` (do not edit manually)
- Build output: `lib/` (ES modules), `commonjs/` (CJS for watch/plugins)

### Imports

```typescript
// Internal (core package)
import { Chain, Languages } from '@/src/zeus/index.js';

// Cross-package
import { translateLocaleFolder } from '@aexol/dev-translate-core';
import { config } from '@aexol/dev-translate-config';
import { watch } from '@aexol/dev-translate-watch';
```

### Exports

- Always include `.js` extension in imports
- Re-export types and enums consumers need
- Use named exports (except Vite plugin uses default)

## Testing

### Manual Testing

Use `packages/testground` for integration testing:

```bash
cd packages/testground
# Add locale files and test translation
```

### Test Translation

```bash
# From project root or testground
npx dev-translate translate
npx dev-translate predict
npx dev-translate clear
```

## Common Tasks

### Adding a New Language

1. Add folder to `localeDir` with language code name
2. Language auto-detected from `langMap` in core

### Modifying GraphQL Schema

1. Update schema at backend
2. Run `pnpm run zeus` to regenerate client
3. Update types in core if needed

### Adding CLI Command

1. Edit `packages/cli/index.ts`
2. Add new `program.command()` block
3. Use `getConf()` for configuration access

### Adding Backend Option

1. Add to `BackendProps` type in core
2. Add to `ProjectOptions` in config
3. Pass through in CLI's `getConf()`
4. Include in `translateLocaleFolder()` calls

## Package Dependencies Graph

```
cli
├── config
│   └── core
├── core
└── watch
    └── core

vite-plugin-dev-translate
└── watch
    └── core

nextjs-dev-translate-plugin
└── watch
    └── core

dynamite
└── core
```

## Environment Variables

| Variable                      | Description                      |
| ----------------------------- | -------------------------------- |
| `DEV_TRANSLATE_API_KEY`       | API key (overrides config file)  |
| `OVERRIDE_DEV_TRANSLATE_HOST` | Override API endpoint (dev only) |

## Important Notes

- **Timestamp tracking**: Only modified files are translated (incremental)
- **Queue concurrency**: Translations run sequentially (`concurrency: 1`)
- **Watch mode**: Only active in development (`NODE_ENV !== 'production'` for Next.js)
- **Dual exports**: watch/vite/nextjs packages export both ESM and CJS
- **Zeus client**: Auto-generated, do not edit `packages/core/src/zeus/` manually
