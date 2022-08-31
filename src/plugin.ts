import type * as BabelCore from "@babel/core";

import { im } from "@artemis69/im";
import syntaxJSX from "@babel/plugin-syntax-jsx";

import { setBabel } from "./share";
import { JSXElement } from "./jsxElement";
import { enter } from "./enter";
import { exit } from "./exit";

const compileJSXPlugin = (babel: typeof BabelCore, options: unknown): babel.PluginObj => {
  setBabel(babel);

  return {
    inherits: im(syntaxJSX),
    visitor: {
      JSXFragment(path) {
        throw path.buildCodeFrameError("JSXFragment is not supported.");
      },
      Program: {
        enter: enter,
        exit: exit,
      },
      JSXElement,
    },
  };
};

export { compileJSXPlugin };
