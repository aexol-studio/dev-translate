// ten skrypt to początek nowego CLI do devTranslatea
import { Chain, Languages } from '@/src/zeus/index.js';
import { readdirSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';

const langMap: Record<Languages, string[]> = {
  BG: ['bg'],
  CS: ['cs'],
  DA: ['da'],
  DE: ['de'],
  EL: ['el'],
  ENGB: ['en', 'en-gb'],
  ENUS: ['en', 'en-us'],
  ES: ['es'],
  ET: ['et'],
  FI: ['fi'],
  FR: ['fr'],
  HU: ['hu'],
  ID: ['id'],
  IT: ['it'],
  JA: ['ja'],
  KO: ['ko'],
  LT: ['lt'],
  LV: ['lv'],
  NB: ['nb'],
  NL: ['nl'],
  PL: ['pl'],
  PTBR: ['pt', 'pt-br'],
  PTPT: ['pt', 'pt-pt'],
  RO: ['ro'],
  RU: ['ru'],
  SK: ['sk'],
  SL: ['sl'],
  SV: ['sv'],
  TR: ['tr'],
  UK: ['uk'],
  ZH: ['zh'],
};

const getLanguageFromFolderName = (folderName: string) => {
  const langs = Object.entries(langMap);
  if (folderName === 'pt') {
    return Languages.PTPT;
  }
  if (folderName === 'en') {
    return Languages.ENGB;
  }
  return langs.find((l) => l[1].includes(folderName))?.[0] as Languages | undefined;
};

export const getOutputLanguages = (localePath: string, inputLang: string) => {
  return readdirSync(localePath)
    .filter((f) => f !== inputLang)
    .filter((f) => !!getLanguageFromFolderName(f))
    .map(
      (f) =>
        ({
          folderName: f,
          lang: getLanguageFromFolderName(f)!,
        }) satisfies LangPair,
    );
};

export const translateLocaleFolder = async ({
  srcLang,
  apiKey,
  cwd,
  localeDir,
}: {
  cwd: string;
  localeDir: string;
  apiKey: string;
  srcLang: LangPair;
}) => {
  console.log('Operating in:', cwd);
  const localePath = path.join(cwd, localeDir);
  console.log('Locale path:', localePath);
  const srcLangPath = path.join(localePath, srcLang.folderName);
  const localeSrcFiles = readdirSync(srcLangPath).filter((f) => f.endsWith('.json'));
  console.log('found the following locale files:', localeSrcFiles);
  const translateChain = await Chain('https://backend.devtranslate.app/graphql', {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });
  const outLangs = getOutputLanguages(localePath, srcLang.folderName);
  const results: Array<{
    result: string;
    language: Languages;
    consumedTokens: unknown;
  }> = [];
  await Promise.all(
    outLangs.map(async (outputLang) => {
      const outPath = path.join(localePath, outputLang.folderName);
      mkdirSync(outPath, { recursive: true });
      await Promise.all(
        localeSrcFiles.map(async (srcFilePath) => {
          const srcFileContent = readFileSync(path.join(srcLangPath, srcFilePath), 'utf-8');
          const translatedContent = await translateChain('mutation')({
            api: {
              translate: [
                {
                  translate: {
                    content: srcFileContent,
                    inputLanguage: srcLang.lang,
                    languages: [outputLang.lang],
                  },
                },
                {
                  results: {
                    result: true,
                    language: true,
                    consumedTokens: true,
                  },
                },
              ],
            },
          });
          const result = translatedContent.api?.translate?.results?.at(0);
          console.log('Consumed tokens', result?.consumedTokens);
          if (result) {
            results.push(result);
            writeFileSync(path.join(outPath, srcFilePath), result.result);
          }
        }),
      );
    }),
  );
  return results;
};
export type LangPair = {
  lang: Languages;
  folderName: string;
};
