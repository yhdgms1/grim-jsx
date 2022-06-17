import { Osake } from "osake";

const shared = Osake({
  babel: /** @type {babel} */ ({}),

  importSource: "grim-jsx/dist/runtime.js",

  enableCommentOptions: false,
  enableStringMode: false,

  inlineRuntime: false,
  runtime: /** @type {import('@babel/core').types.Statement[]} */ ([]),

  inuse: {
    template: false,
    firstElementChild: false,
    nextElementSibling: false,
    spread: false,
  },

  templateFunctionName: "grim_$t",
  spreadFunctionName: "grim_$s",
  firstElementChild: "grim_$fec",
  nextElementSibling: "grim_$nes",

  programPath: /** @type {babel.NodePath<import('@babel/core').types.Program> | null} */ (null),
  sharedNodes: /** @type {Record<string, import('@babel/core').types.VariableDeclaration>} */ ({}),
});

export { shared };
