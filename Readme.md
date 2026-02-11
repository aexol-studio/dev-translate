# Dev Translate

Translate your JSON i18 folders with:

- CLI command
- best file translator in the world
- AI context

Features:

- generate folder i18 structure
- configure input language and desired output languages
- provide input language and input language folder then devtranslate detects other locale folders and translates files in watch mode. You only need to manage files in one language of your choice
- supports 30+ languages
- **NEW: Dynamite** - React i18n library with build-time string extraction and SSR/RSC support

This plugin is particularly useful for developers working with projects that have multiple language support and require seamless translation updates during development.

## Installation

```sh
$ npm i @aexol/dev-translate
```

## How it works

![Dev translate](./devtranslateapp.gif)

```sh
$ dev-translate translate
```

Interactive command will ask you for the paths and will create a `.dev-translate.json` config file for further use.

```
{
    "apiKey": "YOUR_API_KEY",
    "localeDir": "locales",
    "inputLanguageFolderName": "en",
    "inputLanguage": "ENUS",
    "context": "User Interface of a web app used to SEO"
}
```

Config will also include all the dev-translate available languages.

Then dev-translate CLI will translate all the json files from input Language and create files with same names in language folder.

For example if you have a folder `./locales/` with `en` , `pl`. `de`, `fr`, `in` and you choose `en` as an input language. Dev translate will automatically translate from `en` to all other langauges keeping the json file structure.

## Predict translation cost

As translations consume tokens from API you can easily predict translation cost of your locale folder by running:

```sh
dev-translate predict
```

## Cache

Dev-translate backend includes cache inside it so we don't need to implement local cache here

### Clear Account cache

If you want to clear your cache not to reuse cached translations anymore:

```sh
dev-translate clear
```

## Plugins

### Options

Those options are parameters of options param of each plugin.

#### `apiKey`

- **Type:** `string`
- **Description:** The API key required for accessing the translation service. Obtain this key from your translation provider.

#### `folderName`

- **Type:** `string`
- **Description:** The name of the folder within your `localeDir` that contains the i18n JSON files of your **input language**. The plugin will monitor this folder for changes.

#### `lang`

- **Type:** `Languages`
- **Description:** Language code of the **input language**

#### `localeDir`

- **Type:** `string`
- **Description:** The directory path relative to the project root where the locale files are stored.
-

#### `context`

- **Type:** `string`
- **Description:** AI Context for better translations. Tell the translator engine what those translations are about

### NextJSa

`@aexol/nextjs-dev-translate-plugin ` is a Vite plugin designed to automatically translate i18n JSON files while Vite is in watch mode.

#### Installation

To install the plugin, use either npm or yarn:

```bash
npm install @aexol/nextjs-dev-translate-plugin --save-dev
```

#### Importing the Plugin

In your Next.js configuration file (`next.config.js` or `next.config.mjs`), import and configure the plugin with the necessary options.

```typescript
const { withDevTranslate } = await import('@aexol/nextjs-dev-translate-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  //...your config
};

/** @type {import('@aexol/nextjs-dev-translate-plugin').withDevTranslate} */
export default withDevTranslate(nextConfig, {
  apiKey: 'your-api-key',
  folderName: 'pl',
  lang: 'PL',
  localeDir: './src/app/i18n/locales',
});
```

#### Example

If your project has the following structure:

```
my-project/
│
├── src/
│   └── locales/
│       ├── pl
│       │   ├── home.json
│       │   └── auth.json
│       ├── en
│       │   ├── home.json
│       │   └── auth.json
│       └── de
│           ├── home.json
│           └── auth.json
│
└── nextjs.config.mjs
```

You would configure the plugin as follows:

```typescript
const { withDevTranslate } = await import('@aexol/nextjs-dev-translate-plugin');
/** @type {import('next').NextConfig} */
const nextConfig = {
  //...your config
};

/** @type {import('@aexol/nextjs-dev-translate-plugin').withDevTranslate} */
export default withDevTranslate(nextConfig, {
  apiKey: 'your-api-key',
  folderName: 'pl',
  lang: 'PL',
  localeDir: './src/app/i18n/locales',
});
```

This will enable the plugin to automatically watch and translate the JSON files from the `src/locales/pl` folder to `en` and `de` folders

### Vite

`@aexol/vite-plugin-dev-translate` is a Vite plugin designed to automatically translate i18n JSON files while Vite is in watch mode.

#### Installation

To install the plugin, you can use npm or yarn:

```bash
npm install @aexol/vite-plugin-dev-translate --save-dev
```

#### Importing the Plugin

In your `vite.config.js` or `vite.config.ts` file, import the plugin and configure it with the required options.

```typescript
import { defineConfig } from 'vite';
import devTranslatePlugin from '@aexol/vite-plugin-dev-translate';

export default defineConfig({
  plugins: [
    devTranslatePlugin({
      apiKey: 'your-api-key-here',
      folderName: 'locales',
      lang: 'en-US',
      localeDir: 'src/locales',
    }),
  ],
});
```

#### Example

If your project has the following structure:

```
my-project/
│
├── src/
│   └── locales/
│       ├── en
│       │   ├── home.json
│       │   └── auth.json
│       ├── fr
│       │   ├── home.json
│       │   └── auth.json
│       └── es
│           ├── home.json
│           └── auth.json
│
└── vite.config.ts
```

You would configure the plugin as follows:

```typescript
import { defineConfig } from 'vite';
import devTranslatePlugin from '@aexol/vite-plugin-dev-translate';

export default defineConfig({
  plugins: [
    devTranslatePlugin({
      apiKey: 'your-api-key-here',
      folderName: 'en',
      lang: 'ENUS',
      localeDir: 'src/locales',
    }),
  ],
});
```

This will enable the plugin to automatically watch and translate the JSON files from the `src/locales/en` folder to `fr` and `es` folders

## Dynamite - React i18n Library

`@aexol/dynamite` is a React i18n library with build-time string extraction and SSR/RSC support. Unlike traditional i18n solutions, Dynamite extracts translation strings directly from your source code at build time.

### Installation

```bash
npm install @aexol/dynamite
```

### Quick Start

#### 1. Initialize Configuration

```bash
npx dynamite init
```

This creates a `.dynamite.json` config file:

```json
{
  "localesDir": "./locales",
  "defaultLocale": "en",
  "sourceLocale": "en",
  "inputLanguage": "ENUS",
  "targetLocales": ["pl", "de", "fr"],
  "srcDirs": ["./src"],
  "include": ["**/*.tsx", "**/*.ts"],
  "exclude": ["node_modules/**"]
}
```

#### 2. Write Code with `t()` Calls

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

#### 3. Extract Strings

```bash
npx dynamite extract
```

This scans your source files and generates `locales/en.json`:

```json
{
  "Hello world": "Hello world",
  "This is dynamite": "This is dynamite"
}
```

#### 4. Translate to Target Languages

```bash
npx dynamite translate
```

This uses the dev-translate API to generate translations for all target locales:

- `locales/pl.json`
- `locales/de.json`
- `locales/fr.json`

### Usage Patterns

#### Client Components

```tsx
'use client';
import { useDynamite } from '@aexol/dynamite';

export function MyComponent() {
  const { t, locale } = useDynamite();
  return <h1>{t('Welcome to our app')}</h1>;
}
```

#### Server Components (RSC)

```tsx
import { getDynamite } from '@aexol/dynamite/server';

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getDynamite(params.locale, {
    localesDir: './locales',
    defaultLocale: 'en',
  });

  return <h1>{t('Welcome to our app')}</h1>;
}
```

#### Layout with Provider (SSR)

```tsx
import { DynamiteProvider } from '@aexol/dynamite';
import { loadTranslations } from '@aexol/dynamite/server';

export default function RootLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const translations = loadTranslations(params.locale, {
    localesDir: './locales',
    defaultLocale: 'en',
  });

  return (
    <html lang={params.locale}>
      <body>
        <DynamiteProvider locale={params.locale} translations={translations}>
          {children}
        </DynamiteProvider>
      </body>
    </html>
  );
}
```

### CLI Commands

| Command              | Description                                     |
| -------------------- | ----------------------------------------------- |
| `dynamite init`      | Create `.dynamite.json` configuration file      |
| `dynamite extract`   | Extract `t()` strings from source files         |
| `dynamite translate` | Translate extracted strings to target languages |

### How It Works

1. **Build-time extraction**: The CLI uses TypeScript's compiler API to parse your source files and extract all `t("...")` function calls
2. **API translation**: Extracted strings are sent to the dev-translate API for high-quality AI translations
3. **SSR delivery**: Translations are loaded server-side and injected via React context
4. **RSC support**: Async `getDynamite()` helper for React Server Components

## Releasing

All packages share the same version. Use the bump script to update all packages at once:

```bash
npm run bump
```

This opens an interactive CLI to select patch/minor/major or enter a custom version. After bumping:

```bash
git add -A && git commit -m "chore: bump all packages to <version>"
git tag <version>
git push && git push origin <version>
```

Pushing the tag triggers the GitHub Actions release workflow, which publishes all packages to npm.

## License

This project is licensed under the MIT License.

## Test ground and development

Run

```
$ npm run build
$ cd packages/testground
$ npm run start
```

## Roadmap

- [ ] support XML files in CLI
- [x] support JSON files in CLI
- [x] support predictions
- [x] support cache clear
- [x] support NextJS
- [x] support Vite
- [x] support Astro provided via Vite
- [x] support SvelteKit provided via Vite
- [x] support Nuxt provided via Vite
- [ ] support Angular
- [x] support Remix provided via Vite
- [x] Dynamite - React i18n with build-time extraction
