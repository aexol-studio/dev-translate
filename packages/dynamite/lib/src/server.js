import fs from 'node:fs';
import path from 'node:path';
export function loadTranslations(locale, config) {
    const filePath = path.join(config.localesDir, `${locale}.json`);
    if (!fs.existsSync(filePath)) {
        console.warn(`[Dynamite] Translation file not found: ${filePath}`);
        return {};
    }
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error(`[Dynamite] Failed to parse translation file: ${filePath}`, error);
        return {};
    }
}
export async function getDynamite(locale, config) {
    const translations = loadTranslations(locale, config);
    const t = (key) => translations[key] ?? key;
    return {
        t,
        locale,
        translations,
    };
}
export function getDynamiteSync(locale, config) {
    const translations = loadTranslations(locale, config);
    const t = (key) => translations[key] ?? key;
    return {
        t,
        locale,
        translations,
    };
}
export function getAvailableLocales(config) {
    if (!fs.existsSync(config.localesDir)) {
        return [];
    }
    return fs
        .readdirSync(config.localesDir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => path.basename(file, '.json'));
}
//# sourceMappingURL=server.js.map