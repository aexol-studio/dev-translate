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
      localeDir: 'src/locales'
    })
  ]
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
      localeDir: 'src/locales'
    })
  ]
});
```

This will enable the plugin to automatically watch and translate the JSON files from the `src/locales/en` folder to `fr` and `es` folders

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