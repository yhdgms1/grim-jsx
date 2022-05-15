import { im } from "@artemis69/im";
import syntaxJSX from "@babel/plugin-syntax-jsx";

/**
 * It is a fix for the 'default' export being an object with 'default' key.
 */
const SyntaxJSX = im(syntaxJSX);

import { createPre, post, JSXElement } from "./transforms";

import { shared } from "./shared";

/**
 * @param {typeof babel} babel
 * @param {import('../../types').Options} options
 * @returns {babel.PluginObj}
 */
const compileJSXPlugin = (babel, options) => {
  shared.reset();
  shared.set("babel", babel);

  return {
    inherits: SyntaxJSX,
    pre: createPre(options),
    visitor: {
      JSXFragment(path) {
        throw path.buildCodeFrameError("JSXFragment is not supported.");
      },
      Program(path) {
        shared.set("templateFunctionName", path.scope.generateUidIdentifier("tmpl").name);
        shared.set("firstElementChild", path.scope.generateUidIdentifier("fec").name);
        shared.set("nextElementSibling", path.scope.generateUidIdentifier("nes").name);
        shared.set("spreadFunctionName", path.scope.generateUidIdentifier("sprd").name);
      },
      JSXElement,
    },
    post,
  };
};

export { compileJSXPlugin };
