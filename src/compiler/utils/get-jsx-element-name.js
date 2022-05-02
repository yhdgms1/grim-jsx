import { getBabel } from "../babel";

/**
 * @param {babel.types.JSXIdentifier | babel.types.JSXMemberExpression | babel.types.JSXNamespacedName} node
 */
const getJSXElementName = (node) => {
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
