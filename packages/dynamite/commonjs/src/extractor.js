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
exports.extractStringsFromSource = extractStringsFromSource;
exports.extractStringsFromFile = extractStringsFromFile;
exports.extractStrings = extractStrings;
exports.extractStringsFromDirs = extractStringsFromDirs;
const typescript_1 = require("typescript");
const glob_1 = require("glob");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function extractStringsFromSource(sourceCode, fileName = 'source.tsx') {
    const strings = new Set();
    const sourceFile = typescript_1.default.createSourceFile(fileName, sourceCode, typescript_1.default.ScriptTarget.Latest, true, fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? typescript_1.default.ScriptKind.TSX : typescript_1.default.ScriptKind.TS);
    function visit(node) {
        if (typescript_1.default.isCallExpression(node)) {
            const expression = node.expression;
            let isTCall = false;
            if (typescript_1.default.isIdentifier(expression) && expression.text === 't') {
                isTCall = true;
            }
            else if (typescript_1.default.isPropertyAccessExpression(expression) &&
                typescript_1.default.isIdentifier(expression.name) &&
                expression.name.text === 't') {
                isTCall = true;
            }
            if (isTCall && node.arguments.length > 0) {
                const firstArg = node.arguments[0];
                if (typescript_1.default.isStringLiteral(firstArg)) {
                    strings.add(firstArg.text);
                }
                else if (typescript_1.default.isNoSubstitutionTemplateLiteral(firstArg)) {
                    strings.add(firstArg.text);
                }
            }
        }
        typescript_1.default.forEachChild(node, visit);
    }
    visit(sourceFile);
    return Array.from(strings);
}
function extractStringsFromFile(filePath) {
    const sourceCode = (0, node_fs_1.readFileSync)(filePath, 'utf-8');
    return extractStringsFromSource(sourceCode, node_path_1.default.basename(filePath));
}
function extractStrings(srcDir_1) {
    return __awaiter(this, arguments, void 0, function* (srcDir, options = {}) {
        const { extensions = ['ts', 'tsx', 'js', 'jsx'], ignore = ['**/node_modules/**', '**/dist/**', '**/lib/**', '**/build/**'], } = options;
        const pattern = `${srcDir}/**/*.{${extensions.join(',')}}`;
        const files = yield (0, glob_1.glob)(pattern, { ignore });
        const allStrings = new Set();
        for (const file of files) {
            const strings = extractStringsFromFile(file);
            strings.forEach((s) => allStrings.add(s));
        }
        return Array.from(allStrings).sort();
    });
}
function extractStringsFromDirs(srcDirs_1) {
    return __awaiter(this, arguments, void 0, function* (srcDirs, options = {}) {
        const allStrings = new Set();
        for (const dir of srcDirs) {
            const strings = yield extractStrings(dir, options);
            strings.forEach((s) => allStrings.add(s));
        }
        return Array.from(allStrings).sort();
    });
}
//# sourceMappingURL=extractor.js.map