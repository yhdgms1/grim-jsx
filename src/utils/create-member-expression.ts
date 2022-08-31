import { types } from "@babel/core";
import { getBabel } from "../share";

type Part = types.Identifier | types.MemberExpression;
type Parts = Part[];

const createMemberExpression = (...parts: Parts): types.MemberExpression => {
  const { types: t } = getBabel();

  let current = null;

  for (let i = 1; i < parts.length; i++) {
    current = t.memberExpression(current || parts[0], parts[i], true);
  }

  return current as types.MemberExpression;
};

export { createMemberExpression };
