import { Plugin } from 'vite';
import { watch, DevTranslateOptions, Languages } from '@aexol/dev-translate-watch';

export default function devTranslatePlugin(options: DevTranslateOptions): Plugin {
  return {
    name: 'vite-plugin-dev-translate',
    apply: 'serve', // Apply this plugin in serve mode only

    configureServer(server) {
      // Initialize the watcher
      watch(options).then((watcher) => {
        // Clean up the watcher when the server closes
        server.httpServer?.on('close', () => {
          watcher.close();
        });
      });
    },
  };
}

export { Languages };
