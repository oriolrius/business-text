/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

/**
 * Webpack configuration that extends Grafana's base config
 */
const config = async (env) => {
  // Register ts-node to handle TypeScript files
  require('ts-node').register({
    project: path.join(__dirname, 'tsconfig.json'),
    transpileOnly: true,
    compilerOptions: {
      module: 'commonjs',
      target: 'es2020',
      strict: false,
      skipLibCheck: true,
      esModuleInterop: true
    }
  });
  
  // Load the Grafana config using require
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const grafanaConfig = require('./.config/webpack/webpack.config.ts').default;
  const baseConfig = await grafanaConfig(env);

  // Add handlebars configuration
  baseConfig.resolve = {
    ...baseConfig.resolve,
    alias: {
      ...baseConfig.resolve?.alias,
      handlebars: 'handlebars/dist/handlebars.js',
    },
    fallback: {
      ...baseConfig.resolve?.fallback,
      fs: false,
      util: false,
    },
  };

  return baseConfig;
};

module.exports = config;
