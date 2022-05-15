import { Osake } from "osake";

const shared = Osake({
  babel: /** @type {babel} */ ({}),

  importSource: "grim-jsx/dist/runtime.js",

  inlineRuntime: false,
  runtime: /** @type {babel.types.Statement[]} */ ([]),

  inuse: {
    template: false,
    firstElementChild: false,
    nextElementSibling: false,
    spread: false,
  },
});

export { shared };
