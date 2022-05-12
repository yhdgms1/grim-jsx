interface BasicOptions {
  /**
   * Enables the string mode. In this mode there is no Grim's runtime.
   * @default false
   */
  enableStringMode?: boolean;
  /**
   * Enables the possibility to use comments to configure the compiler.
   * @default undefined
   */
  enableCommentOptions?: boolean;
}

type RuntimeOptions =
  | {
      /**
       * The module from which grim loads it's runtime.
       * @default "grim-jsx/dist/runtime.js"
       */
      importSource?: string;
    }
  | {
      /**
       * In case the imports cannot be used, inline runtime.
       * @default undefined
       */
      inlineRuntime?: boolean;
      /**
       * The runtime to be inlined. By default, it is a grim's runtime.
       */
      customRuntime?: string;
    };

type Options = BasicOptions & RuntimeOptions;

/**
 * A babel plugin.
 * @see https://babeljs.io/docs/en/plugins/
 */
declare const compileJSXPlugin = (
  babel: babel,
  options?: Options
): babel.PluginObj => {};

/**
 * @description A helper for configuring the compiler.
 */
declare const defineConfig = (config?: Options): Options => {};

declare module "grim-jsx/jsx-runtime" {
  namespace JSX {
    type Element = HTMLElement;

    interface ElementChildrenAttribute {
      children?: string | never | never[];
    }

    interface IntrinsicElements {
      [element: string]: string | number | Record<string, string>;
    }
  }
}

export { Options, compileJSXPlugin, defineConfig };
