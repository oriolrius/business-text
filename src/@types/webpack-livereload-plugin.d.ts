declare module 'webpack-livereload-plugin' {
  import { WebpackPluginInstance } from 'webpack';

  interface LiveReloadOptions {
    port?: number;
    hostname?: string;
    protocol?: 'http' | 'https';
    delay?: number;
    ignore?: RegExp | string | Array<RegExp | string>;
    appendScriptTag?: boolean;
  }

  class LiveReloadPlugin implements WebpackPluginInstance {
    constructor(options?: LiveReloadOptions);
    apply(compiler: any): void;
  }

  export = LiveReloadPlugin;
}
