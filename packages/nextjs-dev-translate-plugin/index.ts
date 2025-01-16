import chokidar from 'chokidar';
import path from 'path';
import { NextConfig } from 'next';
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

export { Languages };
