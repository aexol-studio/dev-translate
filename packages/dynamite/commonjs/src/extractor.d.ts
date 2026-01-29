import type { ExtractedStrings } from './types.js';
export declare function extractStringsFromSource(sourceCode: string, fileName?: string): ExtractedStrings;
export declare function extractStringsFromFile(filePath: string): ExtractedStrings;
export declare function extractStrings(srcDir: string, options?: {
    extensions?: string[];
    ignore?: string[];
}): Promise<ExtractedStrings>;
export declare function extractStringsFromDirs(srcDirs: string[], options?: {
    extensions?: string[];
    ignore?: string[];
}): Promise<ExtractedStrings>;
