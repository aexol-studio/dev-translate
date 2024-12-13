#!/usr/bin/env node
import { Command } from 'commander';
import { LangPair, translateLocaleFolder } from '@aexol/dev-translate-core';
// import { watch } from 'chokidar';
import chalk from 'chalk';
import { config as cfg } from '@aexol/dev-translate-config';

const program = new Command();

program.name('dev-translate').description('CLI for dev-translate - translate whole documents ').version('0.0.1');

program
  .command('translate')
  .description('translate i18 json files')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (options) => {
    const config = cfg(process.cwd());
    const apiKey = await config.getValueOrThrow('apiKey', { saveOnInput: true });
    const localeDir = await config.getValueOrThrow('localeDir', { saveOnInput: true });
    const folderName = await config.getValueOrThrow('inputLanguageFolderName', { saveOnInput: true });
    const lang = (await config.getValueOrThrow('inputLanguage', { saveOnInput: true })) as LangPair['lang'];
    const result = await translateLocaleFolder({
      srcLang: {
        folderName,
        lang,
      },
      apiKey,
      cwd: process.cwd(),
      localeDir,
    });
    console.log(
      chalk.green(
        `Successfully translated. Consumed ${result.reduce((a, b) => a + (b.consumedTokens as number), 0)} tokens.`,
      ),
    );
  });

program.parse();
