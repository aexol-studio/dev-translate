#!/usr/bin/env node
import { Command } from 'commander';
import { clearAccountCache, LangPair, predictLocaleFolder, translateLocaleFolder } from '@aexol/dev-translate-core';
// import { watch } from 'chokidar';
import chalk from 'chalk';
import { config as cfg } from '@aexol/dev-translate-config';

const program = new Command();

program.name('dev-translate').description('CLI for dev-translate - translate whole documents ').version('0.0.1');

const getConf = async () => {
  const config = cfg(process.cwd());
  const apiKey = await config.getValueOrThrow('apiKey', { saveOnInput: true });
  const localeDir = await config.getValueOrThrow('localeDir', { saveOnInput: true });
  const folderName = await config.getValueOrThrow('inputLanguageFolderName', { saveOnInput: true });
  const lang = (await config.getValueOrThrow('inputLanguage', { saveOnInput: true })) as LangPair['lang'];
  const context = await config.getValue('context', { saveOnInput: true });
  return { apiKey, localeDir, folderName, lang, context };
};

program
  .command('predict')
  .description('predict token consumption i18 json files')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (options) => {
    const { apiKey, folderName, lang, localeDir } = await getConf();
    await predictLocaleFolder({
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (options) => {
    const { apiKey, folderName, lang, localeDir, context } = await getConf();
    const result = await translateLocaleFolder({
      srcLang: {
        folderName,
        lang,
      },
      apiKey,
      cwd: process.cwd(),
      localeDir,
      context,
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
