import { NextConfig } from 'next';
import { watch, Languages, DevTranslateOptions } from '@aexol/dev-translate-watch';

// Plugin function to be used in next.config.js
export function withDevTranslate(nextConfig: NextConfig = {}, options: DevTranslateOptions): NextConfig {
  const env = process.env.NODE_ENV;
  if (env !== 'development') {
    return nextConfig;
  }
  watch(options);
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
