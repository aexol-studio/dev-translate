#!/usr/bin/env node
import { program } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { extractStringsFromDirs } from './extractor.js';
import { translateLocaleFolder, Languages } from '@aexol/dev-translate-core';
import type { DynamiteConfig, TranslationMap } from './types.js';

const CONFIG_FILE = '.dynamite.json';

function loadConfig(configPath: string): DynamiteConfig | null {
  const fullPath = path.resolve(configPath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as DynamiteConfig;
  } catch {
    console.error(`Failed to parse config file: ${fullPath}`);
    return null;
  }
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

program
  .name('dynamite')
  .description('React i18n CLI - Extract and translate strings from your codebase')
  .version('0.3.6');

program
  .command('extract')
  .description('Extract translation strings from source files')
  .option('-s, --src <paths...>', 'Source directories to scan', ['./src'])
  .option('-o, --output <path>', 'Output JSON file (default: {localesDir}/{sourceLocale}.json)')
  .option('-e, --extensions <exts...>', 'File extensions to scan', ['ts', 'tsx', 'js', 'jsx'])
  .option('-c, --config <path>', 'Config file path', CONFIG_FILE)
  .action(async (options) => {
    const config = loadConfig(options.config);
    const srcDirs = config?.srcDirs ?? options.src;
    const extensions = config?.extensions ?? options.extensions;
    const localesDir = config?.localesDir ?? './locales';
    const sourceLocale = config?.sourceLocale ?? 'en';
    const outputPath = options.output
      ? path.resolve(options.output)
      : path.resolve(path.join(localesDir, `${sourceLocale}.json`));

    console.log(`Scanning directories: ${srcDirs.join(', ')}`);
    console.log(`Looking for extensions: ${extensions.join(', ')}`);

    const strings = await extractStringsFromDirs(srcDirs, { extensions });

    if (strings.length === 0) {
      console.log('No translation strings found.');
      return;
    }

    // Create output as { "string": "string" } format
    const output: TranslationMap = {};
    for (const str of strings) {
      output[str] = str;
    }

    // Ensure output directory exists
    ensureDir(path.dirname(outputPath));

    // If file exists, merge with existing translations (preserve translated values)
    if (fs.existsSync(outputPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as TranslationMap;
        for (const key of Object.keys(existing)) {
          if (key in output) {
            output[key] = existing[key];
          }
        }
      } catch {
        // Ignore parse errors, will overwrite
      }
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Extracted ${strings.length} strings to ${outputPath}`);
  });

program
  .command('translate')
  .description('Translate extracted strings to target languages using dev-translate API')
  .option('-c, --config <path>', 'Config file path', CONFIG_FILE)
  .option('-k, --api-key <key>', 'API key (or set DEV_TRANSLATE_API_KEY env var)')
  .option('-l, --locales-dir <path>', 'Locales directory', './locales')
  .option('-s, --source <locale>', 'Source locale', 'en')
  .option('-t, --targets <locales...>', 'Target locales to translate to')
  .action(async (options) => {
    const config = loadConfig(options.config);
    const apiKey = options.apiKey ?? config?.apiKey ?? process.env.DEV_TRANSLATE_API_KEY;

    if (!apiKey) {
      console.error('API key is required. Provide via --api-key, config file, or DEV_TRANSLATE_API_KEY env var.');
      process.exit(1);
    }

    const localesDir = path.resolve(config?.localesDir ?? options.localesDir);
    const sourceLocale = config?.sourceLocale ?? options.source;
    const targetLocales = config?.targetLocales ?? options.targets;

    if (!targetLocales || targetLocales.length === 0) {
      console.error('Target locales are required. Provide via --targets or config file.');
      process.exit(1);
    }

    // Check source file exists
    const sourceFile = path.join(localesDir, `${sourceLocale}.json`);
    if (!fs.existsSync(sourceFile)) {
      console.error(`Source locale file not found: ${sourceFile}`);
      console.error('Run "dynamite extract" first to generate the source file.');
      process.exit(1);
    }

    // Create target locale folders
    for (const locale of targetLocales) {
      ensureDir(path.join(localesDir, locale));
    }

    // Map locale names to Languages enum
    const langMap: Record<string, Languages> = {
      bg: Languages.BG,
      cs: Languages.CS,
      da: Languages.DA,
      de: Languages.DE,
      el: Languages.EL,
      en: Languages.ENGB,
      'en-gb': Languages.ENGB,
      'en-us': Languages.ENUS,
      es: Languages.ES,
      et: Languages.ET,
      fi: Languages.FI,
      fr: Languages.FR,
      hu: Languages.HU,
      id: Languages.ID,
      it: Languages.IT,
      ja: Languages.JA,
      ko: Languages.KO,
      lt: Languages.LT,
      lv: Languages.LV,
      nb: Languages.NB,
      nl: Languages.NL,
      pl: Languages.PL,
      pt: Languages.PTPT,
      'pt-br': Languages.PTBR,
      'pt-pt': Languages.PTPT,
      ro: Languages.RO,
      ru: Languages.RU,
      sk: Languages.SK,
      sl: Languages.SL,
      sv: Languages.SV,
      tr: Languages.TR,
      uk: Languages.UK,
      zh: Languages.ZH,
    };

    const sourceLang = langMap[sourceLocale.toLowerCase()];
    if (!sourceLang) {
      console.error(`Unknown source locale: ${sourceLocale}`);
      process.exit(1);
    }

    console.log(`Translating from ${sourceLocale} to: ${targetLocales.join(', ')}`);

    // Copy source file to source locale folder for dev-translate-core compatibility
    const sourceFolderPath = path.join(localesDir, sourceLocale);
    ensureDir(sourceFolderPath);
    const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
    fs.writeFileSync(path.join(sourceFolderPath, 'translations.json'), sourceContent);

    // Create target folders
    for (const locale of targetLocales) {
      const targetLang = langMap[locale.toLowerCase()];
      if (!targetLang) {
        console.warn(`Unknown target locale: ${locale}, skipping`);
        continue;
      }
      ensureDir(path.join(localesDir, locale));
    }

    try {
      await translateLocaleFolder({
        apiKey,
        cwd: process.cwd(),
        localeDir: localesDir,
        srcLang: {
          lang: sourceLang,
          folderName: sourceLocale,
        },
        // Optional BackendProps - pass undefined to use defaults
        context: undefined,
        excludePhrases: undefined,
        excludeRegex: ['\\{\\{.*?\\}\\}'],
        formality: undefined,
        excludeDotNotationKeys: undefined,
        projectId: undefined,
        omitCache: undefined,
        includeRegex: undefined,
      });

      // Move translated files from folders to flat structure
      for (const locale of targetLocales) {
        const translatedFile = path.join(localesDir, locale, 'translations.json');
        if (fs.existsSync(translatedFile)) {
          const content = fs.readFileSync(translatedFile, 'utf-8');
          fs.writeFileSync(path.join(localesDir, `${locale}.json`), content);
          // Clean up folder structure
          fs.unlinkSync(translatedFile);
          try {
            fs.rmdirSync(path.join(localesDir, locale));
          } catch {
            // Folder not empty or other error, ignore
          }
        }
      }

      // Clean up source folder
      const sourceTransFile = path.join(sourceFolderPath, 'translations.json');
      if (fs.existsSync(sourceTransFile)) {
        fs.unlinkSync(sourceTransFile);
        try {
          fs.rmdirSync(sourceFolderPath);
        } catch {
          // Folder not empty or other error, ignore
        }
      }

      console.log('Translation complete!');
    } catch (error) {
      console.error('Translation failed:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new Dynamite configuration file')
  .option('-o, --output <path>', 'Output config file path', CONFIG_FILE)
  .action((options) => {
    const outputPath = path.resolve(options.output);

    if (fs.existsSync(outputPath)) {
      console.error(`Config file already exists: ${outputPath}`);
      process.exit(1);
    }

    const defaultConfig: DynamiteConfig = {
      localesDir: './locales',
      defaultLocale: 'en',
      sourceLocale: 'en',
      targetLocales: ['pl', 'de', 'fr'],
      srcDirs: ['./src'],
      extensions: ['ts', 'tsx', 'js', 'jsx'],
    };

    fs.writeFileSync(outputPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`Created config file: ${outputPath}`);
    console.log('\nNext steps:');
    console.log('1. Add your API key to the config or set DEV_TRANSLATE_API_KEY env var');
    console.log('2. Run "dynamite extract" to extract strings from your code');
    console.log('3. Run "dynamite translate" to translate to target languages');
  });

program.parse();

export { Languages };
