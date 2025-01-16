import chokidar from 'chokidar';
import path from 'path';
import { NextConfig } from 'next';
import { LangPair, translateLocaleFolder } from '@aexol/dev-translate-core';

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
    const result = await translateLocaleFolder({
      srcLang: {
        folderName,
        lang,
      },
      apiKey,
      cwd: process.cwd(),
      localeDir,
    });
    console.log(JSON.stringify(result, null, 2));
  };
  const watcher = chokidar.watch(directoryToWatch, {
    persistent: true,
  });

  watcher.on('change', (filePath: string) => {
    console.log(`File changed: ${filePath}`);
    translate();
  });

  watcher.on('add', (filePath: string) => {
    console.log(`File added: ${filePath}`);
    translate();
  });

  watcher.on('unlink', (filePath: string) => {
    console.log(`File removed: ${filePath}`);
    translate();
  });

  console.log(`Watching for file changes in ${directoryToWatch}`);
};

// Plugin function to be used in next.config.js
export function withDevTranslate(nextConfig: NextConfig = {}, options: DevTranslateOptions): NextConfig {
  setupFileWatcher(options);
  return {
    ...nextConfig,
    webpack(config, options) {
      // Optionally, customize the webpack configuration

      // Don't forget to include other plugins' webpack modification
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }

      return config;
    },
  };
}
