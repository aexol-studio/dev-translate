import ts from 'typescript';
import { glob } from 'glob';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { ExtractedStrings } from './types.js';

/**
 * Extract all t() call string arguments from a TypeScript/TSX source file
 */
export function extractStringsFromSource(sourceCode: string, fileName: string = 'source.tsx'): ExtractedStrings {
  const strings: Set<string> = new Set();

  const sourceFile = ts.createSourceFile(
    fileName,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  function visit(node: ts.Node): void {
    // Check if this is a call expression
    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      // Check if the function being called is 't'
      // Handles: t("string"), obj.t("string"), useDynamite().t("string")
      let isTCall = false;

      if (ts.isIdentifier(expression) && expression.text === 't') {
        isTCall = true;
      } else if (
        ts.isPropertyAccessExpression(expression) &&
        ts.isIdentifier(expression.name) &&
        expression.name.text === 't'
      ) {
        isTCall = true;
      }

      if (isTCall && node.arguments.length > 0) {
        const firstArg = node.arguments[0];

        // Extract string literal
        if (ts.isStringLiteral(firstArg)) {
          strings.add(firstArg.text);
        }
        // Handle template literal without expressions (simple template)
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

/**
 * Extract all t() call strings from a file
 */
export function extractStringsFromFile(filePath: string): ExtractedStrings {
  const sourceCode = readFileSync(filePath, 'utf-8');
  return extractStringsFromSource(sourceCode, path.basename(filePath));
}

/**
 * Extract all t() call strings from a directory
 */
export async function extractStrings(
  srcDir: string,
  options: {
    extensions?: string[];
    ignore?: string[];
  } = {},
): Promise<ExtractedStrings> {
  const {
    extensions = ['ts', 'tsx', 'js', 'jsx'],
    ignore = ['**/node_modules/**', '**/dist/**', '**/lib/**', '**/build/**'],
  } = options;

  const pattern = `${srcDir}/**/*.{${extensions.join(',')}}`;
  const files = await glob(pattern, { ignore });

  const allStrings: Set<string> = new Set();

  for (const file of files) {
    const strings = extractStringsFromFile(file);
    strings.forEach((s) => allStrings.add(s));
  }

  return Array.from(allStrings).sort();
}

/**
 * Extract strings from multiple directories
 */
export async function extractStringsFromDirs(
  srcDirs: string[],
  options: {
    extensions?: string[];
    ignore?: string[];
  } = {},
): Promise<ExtractedStrings> {
  const allStrings: Set<string> = new Set();

  for (const dir of srcDirs) {
    const strings = await extractStrings(dir, options);
    strings.forEach((s) => allStrings.add(s));
  }

  return Array.from(allStrings).sort();
}
