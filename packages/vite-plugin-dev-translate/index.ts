import chokidar from 'chokidar';
import path from 'path';
import { Plugin } from 'vite';
import { LangPair, translateLocaleFolder, Languages } from '@aexol/dev-translate-core';

export type DevTranslateOptions = {
  apiKey: string;
  folderName: string;
  lang: LangPair['lang'];
  localeDir: string;
};

const setupFileWatcher = async (opts: {
  apiKey: string;
  folderName: string;
  lang: LangPair['lang'];
  localeDir: string;
}) => {
  const { apiKey, folderName, lang, localeDir } = opts;
  const directoryToWatch = path.join(process.cwd(), localeDir, opts.folderName);
  const translate = async () => {
    await translateLocaleFolder({
      srcLang: {
        folderName,
        lang,
      },
      apiKey,
      cwd: process.cwd(),
      localeDir,
    });
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

export default function devTranslatePlugin(options: DevTranslateOptions): Plugin {
  return {
    name: 'vite-plugin-dev-translate',
    apply: 'serve', // Apply this plugin in serve mode only

    configureServer(server) {
      // Initialize the watcher
      setupFileWatcher(options).then((watcher) => {
        // Clean up the watcher when the server closes
        server.httpServer?.on('close', () => {
          watcher.close();
        });
      });
    },
  };
}

export { Languages };
