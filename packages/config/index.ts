import { ConfigMaker } from 'config-maker';
import { readdirSync } from 'fs';
import * as path from 'path';
enum Languages {
  ENUS = 'ENUS',
  ENGB = 'ENGB',
  CS = 'CS',
  RU = 'RU',
  ET = 'ET',
  ES = 'ES',
  ZH = 'ZH',
  SK = 'SK',
  SL = 'SL',
  IT = 'IT',
  JA = 'JA',
  ID = 'ID',
  SV = 'SV',
  KO = 'KO',
  TR = 'TR',
  PTBR = 'PTBR',
  PTPT = 'PTPT',
  EL = 'EL',
  DA = 'DA',
  FR = 'FR',
  BG = 'BG',
  LT = 'LT',
  DE = 'DE',
  LV = 'LV',
  NB = 'NB',
  NL = 'NL',
  PL = 'PL',
  FI = 'FI',
  UK = 'UK',
  RO = 'RO',
  HU = 'HU',
}
export type LangPair = {
  lang: Languages;
  folderName: string;
};

export type ProjectOptions = {
  inputLanguageFolderName: string;
  inputLanguage: string;
  apiKey: string;
  localeDir: string;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const config = (cwd: string) =>
  new ConfigMaker<ProjectOptions>('dev-translate', {
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
