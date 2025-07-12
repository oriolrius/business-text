import { Configuration } from 'webpack';

// This is the base Grafana webpack config
// It should be extended by the root webpack.config.ts file

/**
 * Configuration
 */
const config = async (env): Promise<Configuration> => {
  // Return empty config since this should import from .config/webpack/webpack.config.ts
  // But that seems to be missing, so we'll just return a minimal config
  return {
    mode: env.production ? 'production' : 'development',
    entry: './frontend/src/module.ts',
    output: {
      path: require('path').resolve(__dirname, '../../dist'),
      filename: 'module.js',
    },
  };
};

export default config;
