interface Options {
  /**
   * The module from which grim loads it's runtime.
   * @default "grim-jsx/dist/runtime.js"
   */
  importSource?: string;
  /**
   * Needed only for beauty. Changes the import specifier name
   */
  templateFunctionName?: string;
  /**
   * Needed only for beauty. Changes the import specifier name
   */
  spreadFunctionName?: string;
  /**
   * Needed only for beauty. Changes the import specifier name
   */
  firstElementChild?: string;
  /**
   * Needed only for beauty. Changes the import specifier name
   */
  nextElementSibling?: string;
  /**
   * Enables the string mode. In this mode there is no Grim's runtime.
   * @default false
   */
  enableStringMode?: boolean;
}

export { Options };
