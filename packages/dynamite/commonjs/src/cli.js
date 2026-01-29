#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Languages = void 0;
const commander_1 = require("commander");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const extractor_js_1 = require("./extractor.js");
const dev_translate_core_1 = require("@aexol/dev-translate-core");
Object.defineProperty(exports, "Languages", { enumerable: true, get: function () { return dev_translate_core_1.Languages; } });
const CONFIG_FILE = '.dynamite.json';
function loadConfig(configPath) {
    const fullPath = node_path_1.default.resolve(configPath);
    if (!node_fs_1.default.existsSync(fullPath)) {
        return null;
    }
    try {
        return JSON.parse(node_fs_1.default.readFileSync(fullPath, 'utf-8'));
    }
    catch (_a) {
        console.error(`Failed to parse config file: ${fullPath}`);
        return null;
    }
}
function ensureDir(dirPath) {
    if (!node_fs_1.default.existsSync(dirPath)) {
        node_fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
}
commander_1.program
    .name('dynamite')
    .description('React i18n CLI - Extract and translate strings from your codebase')
    .version('0.3.6');
commander_1.program
    .command('extract')
    .description('Extract translation strings from source files')
    .option('-s, --src <paths...>', 'Source directories to scan', ['./src'])
    .option('-o, --output <path>', 'Output JSON file for extracted strings', './locales/source.json')
    .option('-e, --extensions <exts...>', 'File extensions to scan', ['ts', 'tsx', 'js', 'jsx'])
    .option('-c, --config <path>', 'Config file path', CONFIG_FILE)
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const config = loadConfig(options.config);
    const srcDirs = (_a = config === null || config === void 0 ? void 0 : config.srcDirs) !== null && _a !== void 0 ? _a : options.src;
    const extensions = (_b = config === null || config === void 0 ? void 0 : config.extensions) !== null && _b !== void 0 ? _b : options.extensions;
    const outputPath = node_path_1.default.resolve(options.output);
    console.log(`Scanning directories: ${srcDirs.join(', ')}`);
    console.log(`Looking for extensions: ${extensions.join(', ')}`);
    const strings = yield (0, extractor_js_1.extractStringsFromDirs)(srcDirs, { extensions });
    if (strings.length === 0) {
        console.log('No translation strings found.');
        return;
    }
    const output = {};
    for (const str of strings) {
        output[str] = str;
    }
    ensureDir(node_path_1.default.dirname(outputPath));
    if (node_fs_1.default.existsSync(outputPath)) {
        try {
            const existing = JSON.parse(node_fs_1.default.readFileSync(outputPath, 'utf-8'));
            for (const key of Object.keys(existing)) {
                if (key in output) {
                    output[key] = existing[key];
                }
            }
        }
        catch (_c) {
        }
    }
    node_fs_1.default.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Extracted ${strings.length} strings to ${outputPath}`);
}));
commander_1.program
    .command('translate')
    .description('Translate extracted strings to target languages using dev-translate API')
    .option('-c, --config <path>', 'Config file path', CONFIG_FILE)
    .option('-k, --api-key <key>', 'API key (or set DEV_TRANSLATE_API_KEY env var)')
    .option('-l, --locales-dir <path>', 'Locales directory', './locales')
    .option('-s, --source <locale>', 'Source locale', 'en')
    .option('-t, --targets <locales...>', 'Target locales to translate to')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const config = loadConfig(options.config);
    const apiKey = (_b = (_a = options.apiKey) !== null && _a !== void 0 ? _a : config === null || config === void 0 ? void 0 : config.apiKey) !== null && _b !== void 0 ? _b : process.env.DEV_TRANSLATE_API_KEY;
    if (!apiKey) {
        console.error('API key is required. Provide via --api-key, config file, or DEV_TRANSLATE_API_KEY env var.');
        process.exit(1);
    }
    const localesDir = node_path_1.default.resolve((_c = config === null || config === void 0 ? void 0 : config.localesDir) !== null && _c !== void 0 ? _c : options.localesDir);
    const sourceLocale = (_d = config === null || config === void 0 ? void 0 : config.sourceLocale) !== null && _d !== void 0 ? _d : options.source;
    const targetLocales = (_e = config === null || config === void 0 ? void 0 : config.targetLocales) !== null && _e !== void 0 ? _e : options.targets;
    if (!targetLocales || targetLocales.length === 0) {
        console.error('Target locales are required. Provide via --targets or config file.');
        process.exit(1);
    }
    const sourceFile = node_path_1.default.join(localesDir, `${sourceLocale}.json`);
    if (!node_fs_1.default.existsSync(sourceFile)) {
        console.error(`Source locale file not found: ${sourceFile}`);
        console.error('Run "dynamite extract" first to generate the source file.');
        process.exit(1);
    }
    for (const locale of targetLocales) {
        ensureDir(node_path_1.default.join(localesDir, locale));
    }
    const langMap = {
        bg: dev_translate_core_1.Languages.BG,
        cs: dev_translate_core_1.Languages.CS,
        da: dev_translate_core_1.Languages.DA,
        de: dev_translate_core_1.Languages.DE,
        el: dev_translate_core_1.Languages.EL,
        en: dev_translate_core_1.Languages.ENGB,
        'en-gb': dev_translate_core_1.Languages.ENGB,
        'en-us': dev_translate_core_1.Languages.ENUS,
        es: dev_translate_core_1.Languages.ES,
        et: dev_translate_core_1.Languages.ET,
        fi: dev_translate_core_1.Languages.FI,
        fr: dev_translate_core_1.Languages.FR,
        hu: dev_translate_core_1.Languages.HU,
        id: dev_translate_core_1.Languages.ID,
        it: dev_translate_core_1.Languages.IT,
        ja: dev_translate_core_1.Languages.JA,
        ko: dev_translate_core_1.Languages.KO,
        lt: dev_translate_core_1.Languages.LT,
        lv: dev_translate_core_1.Languages.LV,
        nb: dev_translate_core_1.Languages.NB,
        nl: dev_translate_core_1.Languages.NL,
        pl: dev_translate_core_1.Languages.PL,
        pt: dev_translate_core_1.Languages.PTPT,
        'pt-br': dev_translate_core_1.Languages.PTBR,
        'pt-pt': dev_translate_core_1.Languages.PTPT,
        ro: dev_translate_core_1.Languages.RO,
        ru: dev_translate_core_1.Languages.RU,
        sk: dev_translate_core_1.Languages.SK,
        sl: dev_translate_core_1.Languages.SL,
        sv: dev_translate_core_1.Languages.SV,
        tr: dev_translate_core_1.Languages.TR,
        uk: dev_translate_core_1.Languages.UK,
        zh: dev_translate_core_1.Languages.ZH,
    };
    const sourceLang = langMap[sourceLocale.toLowerCase()];
    if (!sourceLang) {
        console.error(`Unknown source locale: ${sourceLocale}`);
        process.exit(1);
    }
    console.log(`Translating from ${sourceLocale} to: ${targetLocales.join(', ')}`);
    const sourceFolderPath = node_path_1.default.join(localesDir, sourceLocale);
    ensureDir(sourceFolderPath);
    const sourceContent = node_fs_1.default.readFileSync(sourceFile, 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(sourceFolderPath, 'translations.json'), sourceContent);
    for (const locale of targetLocales) {
        const targetLang = langMap[locale.toLowerCase()];
        if (!targetLang) {
            console.warn(`Unknown target locale: ${locale}, skipping`);
            continue;
        }
        ensureDir(node_path_1.default.join(localesDir, locale));
    }
    try {
        yield (0, dev_translate_core_1.translateLocaleFolder)({
            apiKey,
            cwd: process.cwd(),
            localeDir: localesDir,
            srcLang: {
                lang: sourceLang,
                folderName: sourceLocale,
            },
            context: undefined,
            excludePhrases: undefined,
            excludeRegex: undefined,
            formality: undefined,
            excludeDotNotationKeys: undefined,
            projectId: undefined,
            omitCache: undefined,
            includeRegex: undefined,
        });
        for (const locale of targetLocales) {
            const translatedFile = node_path_1.default.join(localesDir, locale, 'translations.json');
            if (node_fs_1.default.existsSync(translatedFile)) {
                const content = node_fs_1.default.readFileSync(translatedFile, 'utf-8');
                node_fs_1.default.writeFileSync(node_path_1.default.join(localesDir, `${locale}.json`), content);
                node_fs_1.default.unlinkSync(translatedFile);
                try {
                    node_fs_1.default.rmdirSync(node_path_1.default.join(localesDir, locale));
                }
                catch (_f) {
                }
            }
        }
        const sourceTransFile = node_path_1.default.join(sourceFolderPath, 'translations.json');
        if (node_fs_1.default.existsSync(sourceTransFile)) {
            node_fs_1.default.unlinkSync(sourceTransFile);
            try {
                node_fs_1.default.rmdirSync(sourceFolderPath);
            }
            catch (_g) {
            }
        }
        console.log('Translation complete!');
    }
    catch (error) {
        console.error('Translation failed:', error);
        process.exit(1);
    }
}));
commander_1.program
    .command('init')
    .description('Initialize a new Dynamite configuration file')
    .option('-o, --output <path>', 'Output config file path', CONFIG_FILE)
    .action((options) => {
    const outputPath = node_path_1.default.resolve(options.output);
    if (node_fs_1.default.existsSync(outputPath)) {
        console.error(`Config file already exists: ${outputPath}`);
        process.exit(1);
    }
    const defaultConfig = {
        localesDir: './locales',
        defaultLocale: 'en',
        sourceLocale: 'en',
        targetLocales: ['pl', 'de', 'fr'],
        srcDirs: ['./src'],
        extensions: ['ts', 'tsx', 'js', 'jsx'],
    };
    node_fs_1.default.writeFileSync(outputPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`Created config file: ${outputPath}`);
    console.log('\nNext steps:');
    console.log('1. Add your API key to the config or set DEV_TRANSLATE_API_KEY env var');
    console.log('2. Run "dynamite extract" to extract strings from your code');
    console.log('3. Run "dynamite translate" to translate to target languages');
});
commander_1.program.parse();
//# sourceMappingURL=cli.js.map