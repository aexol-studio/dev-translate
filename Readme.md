# Dev Translate

Translate your JSON i18 folders with:
- CLI command
- best file translator in the world
- AI context


Features:

- generate folder i18 structure
- configure input language and desired output languages

## Installation

```sh
$ npm i @aexol/dev-translate
```

## How it works

```sh
$ dev-translate translate
```

Interactive command will ask you for the paths and will create a `.dev-translate.json` config file for further use.

```
{
    "apiKey": "4404413a.b16aaa6",
    "localeDir": "locales",
    "inputLanguageFolderName": "en",
    "inputLanguage": "ENUS"
}
```

Config will also include all the dev-translate available languages. 

Then dev-translate CLI will translate all the json files from input Language and create files with same names in language folder.

For example if you have a folder `./locales/` with `en` , `pl`. `de`, `fr`, `in` and you choose `en` as an input language. Dev translate will automatically translate from `en` to all other langauges keeping the json file structure.

## Cache

Dev-translate backend includes cache inside it so we don't need to implement local cache here

## Beta

CLI is the part of beta stage of new dev-translate and it is not yet on https://devtranslate.app. Contact support at support@devtranslate.app for early access.

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