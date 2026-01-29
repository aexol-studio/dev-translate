import ts from 'typescript';
import { glob } from 'glob';
import { readFileSync } from 'node:fs';
import path from 'node:path';
export function extractStringsFromSource(sourceCode, fileName = 'source.tsx') {
    const strings = new Set();
    const sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, true, fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node) {
        if (ts.isCallExpression(node)) {
            const expression = node.expression;
            let isTCall = false;
            if (ts.isIdentifier(expression) && expression.text === 't') {
                isTCall = true;
            }
            else if (ts.isPropertyAccessExpression(expression) &&
                ts.isIdentifier(expression.name) &&
                expression.name.text === 't') {
                isTCall = true;
            }
            if (isTCall && node.arguments.length > 0) {
                const firstArg = node.arguments[0];
                if (ts.isStringLiteral(firstArg)) {
                    strings.add(firstArg.text);
                }
                else if (ts.isNoSubstitutionTemplateLiteral(firstArg)) {
                    strings.add(firstArg.text);
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return Array.from(strings);
}
export function extractStringsFromFile(filePath) {
    const sourceCode = readFileSync(filePath, 'utf-8');
    return extractStringsFromSource(sourceCode, path.basename(filePath));
}
export async function extractStrings(srcDir, options = {}) {
    const { extensions = ['ts', 'tsx', 'js', 'jsx'], ignore = ['**/node_modules/**', '**/dist/**', '**/lib/**', '**/build/**'], } = options;
    const pattern = `${srcDir}/**/*.{${extensions.join(',')}}`;
    const files = await glob(pattern, { ignore });
    const allStrings = new Set();
    for (const file of files) {
        const strings = extractStringsFromFile(file);
        strings.forEach((s) => allStrings.add(s));
    }
    return Array.from(allStrings).sort();
}
export async function extractStringsFromDirs(srcDirs, options = {}) {
    const allStrings = new Set();
    for (const dir of srcDirs) {
        const strings = await extractStrings(dir, options);
        strings.forEach((s) => allStrings.add(s));
    }
    return Array.from(allStrings).sort();
}
//# sourceMappingURL=extractor.js.map