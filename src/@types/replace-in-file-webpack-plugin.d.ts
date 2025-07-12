declare module 'replace-in-file-webpack-plugin' {
  import { WebpackPluginInstance } from 'webpack';

  interface ReplaceInFileOptions {
    files: string | string[];
    from: string | RegExp | Array<string | RegExp>;
    to: string | string[] | Function;
    allowEmptyPaths?: boolean;
    countMatches?: boolean;
    encoding?: string;
    dry?: boolean;
    glob?: any;
  }

  class ReplaceInFileWebpackPlugin implements WebpackPluginInstance {
    constructor(options: ReplaceInFileOptions[]);
    apply(compiler: any): void;
  }

  export = ReplaceInFileWebpackPlugin;
}
