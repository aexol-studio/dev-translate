#!/usr/bin/env node
import { Command } from 'commander';
import {
  clearAccountCache,
  LangPair,
  LogLevels,
  predictLocaleFolder,
  translateLocaleFolder,
} from '@aexol/dev-translate-core';
// import { watch } from 'chokidar';
import chalk from 'chalk';
import { config as cfg } from '@aexol/dev-translate-config';
import { watch } from '@aexol/dev-translate-watch';

const program = new Command();

program.name('dev-translate').description('CLI for dev-translate - translate whole documents ').version('0.0.1');

const getConf = async () => {
  const config = cfg(process.cwd());
  const apiKey = await config.getValueOrThrow('apiKey', { saveOnInput: true });
  const localeDir = await config.getValueOrThrow('localeDir', { saveOnInput: true });
  const folderName = await config.getValueOrThrow('inputLanguageFolderName', { saveOnInput: true });
  const lang = (await config.getValueOrThrow('inputLanguage', { saveOnInput: true })) as LangPair['lang'];
  const context = await config.getValue('context', { saveOnInput: true });
  const { excludePhrases, excludeRegex, formality, includeRegex, excludeDotNotationKeys } = await config.get();
  return {
    apiKey,
    localeDir,
    folderName,
    lang,
    context,
    formality,
    excludePhrases,
    excludeRegex,
    includeRegex,
    excludeDotNotationKeys,
  };
};

program
  .command('predict')
  .description('predict token consumption i18 json files')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (options) => {
    const { apiKey, folderName, lang, localeDir, ...backendProps } = await getConf();
    await predictLocaleFolder({
      ...backendProps,
      srcLang: {
        folderName,
        lang,
      },
      apiKey,
      cwd: process.cwd(),
      localeDir,
    });
    console.log(chalk.green(`Successfully predicted.`));
  });

program
  .command('translate')
  .description('translate i18 json files')
  .option('-w --watch', 'watch mode', false)
  .action(async (options) => {
    const { apiKey, folderName, lang, localeDir, ...backendProps } = await getConf();
    if (options.watch) {
      return watch({
        ...backendProps,
        apiKey,
        folderName,
        lang,
        localeDir,
      });
    }
    const result = await translateLocaleFolder({
      ...backendProps,
      srcLang: {
        folderName,
        lang,
      },
      apiKey,
      cwd: process.cwd(),
      localeDir,
      logLevel: LogLevels.debug,
    });
    console.log(
      chalk.green(
        `Successfully translated. Consumed ${result.reduce((a, b) => a + (b.consumedTokens as number), 0)} tokens.`,
      ),
    );
  });

program
  .command('clear')
  .description('clear your account cache')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (options) => {
    const config = cfg(process.cwd());
    const apiKey = await config.getValueOrThrow('apiKey', { saveOnInput: true });
    await clearAccountCache({
      apiKey,
    });
    console.log(chalk.green(`Successfully cleared.`));
  });

program.parse();
