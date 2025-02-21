import { ConfigMaker } from 'config-maker';
import { readdirSync } from 'fs';
import * as path from 'path';
import { BackendProps, Languages, LangPair } from '@aexol/dev-translate-core';

export { LangPair };

export type ProjectOptions = BackendProps & {
  // name of folder with files from input language
  inputLanguageFolderName: string;
  // input language language code
  inputLanguage: string;
  // your devtranslate.app api key
  apiKey: string;
  // folder where you store locale folders with language names
  localeDir: string;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const config = (cwd: string) =>
  new ConfigMaker<ProjectOptions>('.dev-translate', {
    decoders: {},
    config: {
      environment: {
        apiKey: 'DEV_TRANSLATE_API_KEY',
      },
      autocomplete: {
        inputLanguageFolderName: async (cfg) => {
          if (cfg.options.localeDir) {
            const opts = readdirSync(path.join(cwd, cfg.options.localeDir));
            return opts;
          }
          return [];
        },
        inputLanguage: async () => {
          return Object.keys(Languages);
        },
      },
    },
  });
