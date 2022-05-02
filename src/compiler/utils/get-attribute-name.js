import { getBabel } from "../babel";

/**
 * @param {babel.types.JSXAttribute} attr
 */
const getAttributeName = (attr) => {
  const { types: t } = getBabel();

  let name = "not-found";

  if (typeof attr.name.name === "string") {
    name = attr.name.name;
  } else if (t.isJSXIdentifier(attr.name.name)) {
    name = attr.name.name.name;
  }

  return name;
};

export { getAttributeName };
