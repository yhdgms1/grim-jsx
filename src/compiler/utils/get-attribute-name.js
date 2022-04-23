import * as t from "@babel/types";

/**
 * @param {t.JSXAttribute} attr
 */
const getAttributeName = (attr) => {
  let name = "not-found";

  if (typeof attr.name.name === "string") {
    name = attr.name.name;
  } else if (t.isJSXIdentifier(attr.name.name)) {
    name = attr.name.name.name;
  }

  return name;
};

export { getAttributeName };
