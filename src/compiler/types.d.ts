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
}

export { Options };
