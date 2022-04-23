import * as t from "@babel/types";

/**
 * @param {t.Identifier[]} parts
 * @returns {t.MemberExpression | null}
 */
const createMemberExpression = (...parts) => {
  let current = null;

  for (let i = 1; i < parts.length; i++) {
    current = t.memberExpression(current || parts[0], parts[i], true);
  }

  return current;
};

export { createMemberExpression };
