import { shared } from "../shared";

/**
 *
 * @param {import('@babel/core').types.StringLiteral | import('@babel/core').types.Identifier} val
 * @returns
 */
const get = (val) => {
  const { types: t } = shared().babel;

  let value = "";

  if (t.isStringLiteral(val)) {
    value = val.value;
  } else if (t.isIdentifier(val)) {
    value = val.name;
  }

  return value;
};

export { get };
