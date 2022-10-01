import type { VisitNodeFunction, NodePath } from "@babel/traverse";
import type { types, PluginPass } from "@babel/core";

type Program = types.Program;

interface Inuse {
  template: boolean;
  firstElementChild: boolean;
  nextElementSibling: boolean;
  spread: boolean;
}

interface MutableData {
  templateFunctionName: string;
  firstElementChild: string;
  nextElementSibling: string;
  spreadFunctionName: string;

  inuse: Inuse;

  generateGlobalUid: (name?: string) => string;
  unshift: (...items: types.Statement[]) => number;

  sharedNodes: Record<string, types.VariableDeclaration>;
}

interface WithConfig {
  config: object;
  mutable: MutableData;
}

// @ts-ignore
const enter: VisitNodeFunction<PluginPass, Program> = (path, state) => {
  const metadata = state.file.metadata as WithConfig;

  metadata.config = Object.assign({}, state.opts);

  const generateUid = path.scope.generateUid.bind(path.scope);
  const unshift = path.node.body.unshift.bind(path.node.body);

  metadata.mutable = {
    templateFunctionName: generateUid("template"),
    firstElementChild: generateUid("fec"),
    nextElementSibling: generateUid("nes"),
    spreadFunctionName: generateUid("sprd"),

    inuse: {
      template: false,
      firstElementChild: false,
      nextElementSibling: false,
      spread: false,
    },

    generateGlobalUid: generateUid,
    unshift,

    sharedNodes: {},
  };
};

export { enter };
export type { WithConfig, MutableData };
