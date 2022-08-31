import { types } from "@babel/core";
import { getBabel } from "../share";

type NodeArg = types.JSXIdentifier | types.JSXMemberExpression | types.JSXNamespacedName;

const getJSXElementName = (node: NodeArg) => {
  const { types: t } = getBabel();

  let name = "";

  if (t.isJSXIdentifier(node)) {
    name = node.name;
  } else if (t.isJSXMemberExpression(node)) {
    return { expression: node };
  } else if (t.isJSXNamespacedName(node)) {
    return `${node.namespace.name}:${node.name.name}`;
  }

  return name;
};

export { getJSXElementName };
