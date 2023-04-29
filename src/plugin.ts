import type * as BabelCore from "@babel/core";

import { setBabel } from "./share";
import { JSXElement } from "./jsxElement";
import { enter } from "./enter";
import { exit } from "./exit";

const compileJSXPlugin = (babel: typeof BabelCore, options: unknown): babel.PluginObj => {
  setBabel(babel);

  return {
    inherits: () => ({
      name: 'grim-jsx',
      manipulateOptions(_: unknown, opts: { plugins: string[] }) {
        opts.plugins.push('jsx');
      }
    }),
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
