// ten skrypt to początek nowego CLI do devTranslatea
import { Chain, Languages } from '@/src/zeus/index.js';
import { readdirSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';
import PQueue from 'p-queue';

enum LogLevels {
  info = 0,
  debug = 1,
  internal = 2,
}

const innerLogger =
  (selectedLogLevel: LogLevels) =>
  (...params: Parameters<typeof console.log>) =>
  (logLevel: LogLevels) => {
    if (logLevel <= selectedLogLevel) {
      console.log(...params);
    }
  };

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

const getLocalePaths = ({
  srcLang,
  cwd,
  localeDir,
  logLevel = LogLevels.info,
}: {
  cwd: string;
  localeDir: string;
  srcLang: LangPair;
  logLevel?: LogLevels;
}) => {
  const localePath = path.join(cwd, localeDir);
  innerLogger(logLevel)('Locale path:', localePath)(LogLevels.debug);
  const srcLangPath = path.join(localePath, srcLang.folderName);
  const localeSrcFiles = readdirSync(srcLangPath).filter((f) => f.endsWith('.json'));
  const outLangs = getOutputLanguages(localePath, srcLang.folderName);
  innerLogger(logLevel)(
    `found the following output locale folders: ${outLangs.map((ol) => `folder: ${ol.folderName}, languageCode:${ol.lang}`).join('; ')}`,
  )(LogLevels.debug);
  return {
    outLangs,
    localeSrcFiles,
    srcLangPath,
    localePath,
  };
};

export const predictLocaleFolder = async ({
  srcLang,
  apiKey,
  cwd,
  localeDir,
  logLevel = LogLevels.info,
}: {
  cwd: string;
  localeDir: string;
  apiKey: string;
  srcLang: LangPair;
  logLevel?: LogLevels;
}) => {
  const { localeSrcFiles, outLangs, srcLangPath } = getLocalePaths({ cwd, localeDir, srcLang, logLevel });
  const translateChain = await Chain('https://backend.devtranslate.app/graphql', {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });
  const predicted = {
    cost: 0,
    cached: 0,
  };
  await Promise.all(
    localeSrcFiles.map(async (srcFilePath) => {
      const srcFileContent = readFileSync(path.join(srcLangPath, srcFilePath), 'utf-8');
      const result = await translateChain('query')({
        api: {
          predictTranslationCost: [
            {
              translate: {
                content: srcFileContent,
                inputLanguage: srcLang.lang,
                languages: outLangs.map((ol) => ol.lang),
              },
            },
            {
              cached: true,
              cost: true,
            },
          ],
        },
      });
      predicted.cached += (result.api?.predictTranslationCost.cached as number | undefined) || 0;
      predicted.cost += (result.api?.predictTranslationCost.cost as number | undefined) || 0;
    }),
  );
  innerLogger(logLevel)(`This translation run will consume ${predicted.cost} tokens from your account.`)(
    LogLevels.info,
  );
  if (predicted.cached)
    innerLogger(logLevel)(` It will also use ${predicted.cached} tokens from cache.`)(LogLevels.info);
};
export const translateLocaleFolder = async ({
  srcLang,
  apiKey,
  cwd,
  localeDir,
  context,
  logLevel = LogLevels.info,
}: {
  cwd: string;
  localeDir: string;
  apiKey: string;
  srcLang: LangPair;
  context?: string;
  logLevel?: LogLevels;
}) => {
  let activeExecutions = 0;
  const queue = new PQueue({ concurrency: 1 });
  const { localePath, localeSrcFiles, outLangs, srcLangPath } = getLocalePaths({ cwd, localeDir, srcLang, logLevel });
  const translateChain = Chain('https://backend.devtranslate.app/graphql', {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });
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
          innerLogger(logLevel)(`Starting translation of ${srcFilePath} to ${outputLang.lang}`)(LogLevels.internal);
          const translatedContent = await queue.add(() => {
            innerLogger(logLevel)(`Executing ${srcFilePath} ${outputLang.lang}`)(LogLevels.debug);
            activeExecutions++;
            innerLogger(logLevel)(`Active executions: ${activeExecutions}`)(LogLevels.internal);
            return translateChain('mutation')({
              api: {
                translate: [
                  {
                    translate: {
                      content: srcFileContent,
                      inputLanguage: srcLang.lang,
                      languages: [outputLang.lang],
                      context,
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
          });
          activeExecutions = activeExecutions - 1;
          innerLogger(logLevel)(`Translation of ${srcFilePath} to ${outputLang.lang} finished`)(LogLevels.debug);
          const result = translatedContent?.api?.translate?.results?.at(0);
          if (result) {
            results.push(result);
            writeFileSync(path.join(outPath, srcFilePath), JSON.stringify(JSON.parse(result.result), null, 4));
          }
        }),
      );
    }),
  );
  innerLogger(logLevel)(
    `All translations consumed ${results.reduce((a, b) => a + (b.consumedTokens as number), 0)} tokens`,
  )(LogLevels.info);
  return results;
};

export const clearAccountCache = async ({
  apiKey,
  logLevel = LogLevels.info,
}: {
  apiKey: string;
  logLevel?: LogLevels;
}) => {
  const translateChain = await Chain('https://backend.devtranslate.app/graphql', {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });
  await translateChain('mutation')({ api: { clearCache: [{}, true] } });
  innerLogger(logLevel)(`Your cache has been cleared`)(LogLevels.info);
};
export type LangPair = {
  lang: Languages;
  folderName: string;
};

export { Languages, LogLevels };
