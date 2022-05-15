import { shared } from "../shared";

/**
 * @param {babel.types.JSXIdentifier | babel.types.JSXMemberExpression | babel.types.JSXNamespacedName} node
 */
const getJSXElementName = (node) => {
  const { types: t } = shared().babel;

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
