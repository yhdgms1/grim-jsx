import { shared } from "../shared";

/**
 * @param {import('@babel/core').types.JSXAttribute} attr
 */
const getAttributeName = (attr) => {
  const { types: t } = shared().babel;

  let name = "";

  if (t.isJSXIdentifier(attr.name)) {
    name = attr.name.name;
  } else if (t.isJSXNamespacedName(attr.name)) {
    name = attr.name.namespace.name + ":" + attr.name.name.name;
  }

  return name;
};

export { getAttributeName };
