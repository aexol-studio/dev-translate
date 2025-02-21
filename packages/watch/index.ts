import chokidar from 'chokidar';
import path from 'path';
import { LangPair, translateLocaleFolder, Languages, BackendProps } from '@aexol/dev-translate-core';

export type DevTranslateOptions = BackendProps & {
  apiKey: string;
  folderName: string;
  lang: LangPair['lang'];
  localeDir: string;
};

export const watch = async (opts: DevTranslateOptions) => {
  let isTranslating = false;
  const { apiKey, folderName, lang, localeDir, ...backendProps } = opts;
  const directoryToWatch = path.join(process.cwd(), localeDir, opts.folderName);
  const translate = async ({ fileNameFilter }: { fileNameFilter?: string }) => {
    if (isTranslating) return;
    isTranslating = true;
    try {
      await translateLocaleFolder({
        ...backendProps,
        srcLang: {
          folderName,
          lang,
        },
        apiKey,
        cwd: process.cwd(),
        localeDir,
        fileNameFilter,
      });
    } catch (error) {
      console.log(error);
    } finally {
      isTranslating = false;
    }
  };
  const watcher = chokidar.watch(directoryToWatch, {
    persistent: true,
  });
  console.log('Running translations for all languages');
  translate({});
  watcher.on('change', (fileChanged) => {
    const fileNameFilter = path.parse(fileChanged).base;
    console.log(`${fileNameFilter} file changed. Running translations for all languages`);
    translate({ fileNameFilter });
  });
  watcher.on('add', () => {
    //noop
  });
  watcher.on('unlink', () => {
    //noop
  });
  console.log(`Watching for file changes in ${directoryToWatch}`);
  return watcher;
};

export { Languages };
