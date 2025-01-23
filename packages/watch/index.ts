import chokidar from 'chokidar';
import path from 'path';
import { LangPair, translateLocaleFolder, Languages } from '@aexol/dev-translate-core';

export type DevTranslateOptions = {
  apiKey: string;
  folderName: string;
  lang: LangPair['lang'];
  localeDir: string;
  context?: string;
};

export const watch = async (opts: DevTranslateOptions) => {
  const { apiKey, folderName, lang, localeDir, context } = opts;
  const directoryToWatch = path.join(process.cwd(), localeDir, opts.folderName);
  const translate = async () => {
    try {
      await translateLocaleFolder({
        srcLang: {
          folderName,
          lang,
        },
        apiKey,
        cwd: process.cwd(),
        localeDir,
        context,
      });
    } catch (error) {
      console.log(error);
    }
  };
  const watcher = chokidar.watch(directoryToWatch, {
    persistent: true,
  });
  watcher.on('change', () => {
    translate();
  });
  watcher.on('add', () => {
    translate();
  });
  watcher.on('unlink', () => {
    translate();
  });
  console.log(`Watching for file changes in ${directoryToWatch}`);
  return watcher;
};

export { Languages };
