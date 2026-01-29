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
exports.loadTranslations = loadTranslations;
exports.getDynamite = getDynamite;
exports.getDynamiteSync = getDynamiteSync;
exports.getAvailableLocales = getAvailableLocales;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function loadTranslations(locale, config) {
    const filePath = node_path_1.default.join(config.localesDir, `${locale}.json`);
    if (!node_fs_1.default.existsSync(filePath)) {
        console.warn(`[Dynamite] Translation file not found: ${filePath}`);
        return {};
    }
    try {
        const content = node_fs_1.default.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error(`[Dynamite] Failed to parse translation file: ${filePath}`, error);
        return {};
    }
}
function getDynamite(locale, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const translations = loadTranslations(locale, config);
        const t = (key) => { var _a; return (_a = translations[key]) !== null && _a !== void 0 ? _a : key; };
        return {
            t,
            locale,
            translations,
        };
    });
}
function getDynamiteSync(locale, config) {
    const translations = loadTranslations(locale, config);
    const t = (key) => { var _a; return (_a = translations[key]) !== null && _a !== void 0 ? _a : key; };
    return {
        t,
        locale,
        translations,
    };
}
function getAvailableLocales(config) {
    if (!node_fs_1.default.existsSync(config.localesDir)) {
        return [];
    }
    return node_fs_1.default
        .readdirSync(config.localesDir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => node_path_1.default.basename(file, '.json'));
}
//# sourceMappingURL=server.js.map