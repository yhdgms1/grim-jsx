interface Options {
  /**
   * The module from which grim loads it's runtime.
   * @default "grim-jsx/dist/runtime.js"
   */
  importSource?: string;
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

/**
 * A babel plugin.
 * @see https://babeljs.io/docs/en/plugins/
 */
declare const compileJSXPlugin = (
  babel: babel,
  options?: Options
): babel.PluginObj => {};

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

export { Options, compileJSXPlugin };
