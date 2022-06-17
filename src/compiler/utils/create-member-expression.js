import { shared } from "../shared";

/**
 * @param {(import('@babel/core').types.Identifier | import('@babel/core').types.MemberExpression)[]} parts
 * @returns {import('@babel/core').types.MemberExpression | null}
 */
const createMemberExpression = (...parts) => {
  const { types: t } = shared().babel;

  let current = null;

  for (let i = 1; i < parts.length; i++) {
    current = t.memberExpression(current || parts[0], parts[i], true);
  }

  return current;
};

export { createMemberExpression };
