import * as t from "@babel/types";

/**
 * @param {t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName} node
 */
const getJSXElementName = (node) => {
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
