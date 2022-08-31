import { types } from "@babel/core";
import { getBabel } from "../share";

const getAttributeName = (attr: types.JSXAttribute) => {
  const { types: t } = getBabel();

  let name = "";

  if (t.isJSXIdentifier(attr.name)) {
    name = attr.name.name;
  } else if (t.isJSXNamespacedName(attr.name)) {
    name = attr.name.namespace.name + ":" + attr.name.name.name;
  }

  return name;
};

export { getAttributeName };
