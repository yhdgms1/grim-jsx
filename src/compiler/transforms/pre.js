import { isObject } from "../utils";
import { shared } from "../shared";

/**
 * @param {import('../../../types').Options} options
 */
const createPre = (options) => {
  /**
   * @this {import('@babel/core').PluginPass}
   * @param {import('@babel/core').BabelFile} path
   */
  function pre(path) {
    shared.set("inlineRuntime", false);
    shared.set("importSource", "grim-jsx/dist/runtime.js");

    const { inuse, babel } = shared();

    inuse.template = false;
    inuse.firstElementChild = false;
    inuse.nextElementSibling = false;
    inuse.spread = false;

    if (isObject(options)) {
      if ("importSource" in options && options.importSource) {
        shared.set("importSource", options.importSource);
      }

      if ("inlineRuntime" in options && options.inlineRuntime) {
        const { inlineRuntime } = options;

        shared.set("inlineRuntime", inlineRuntime);

        if (inlineRuntime) {
          // @ts-expect-error - Rollup will replace it with a string.
          const ast = babel.parseSync(options.customRuntime || RUNTIME);

          if (!ast) {
            throw new Error(`Runtime could not be parsed.`);
          }

          shared.set("runtime", ast.program.body);
        }
      }
    }
  }

  return pre;
};

export { createPre };
