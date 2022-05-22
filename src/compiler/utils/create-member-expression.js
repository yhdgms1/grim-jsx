import { shared } from "../shared";

/**
 * @param {(babel.types.Identifier | babel.types.MemberExpression)[]} parts
 * @returns {babel.types.MemberExpression | null}
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
