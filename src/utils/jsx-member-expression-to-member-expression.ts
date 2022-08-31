import { types } from "@babel/core";
import { getBabel } from "../share";

type ExprArg = types.JSXMemberExpression | types.JSXIdentifier;

const jsxMemberExpressionToMemberExpression = (expr: ExprArg) => {
  const { types: t } = getBabel();

  if (t.isJSXIdentifier(expr)) {
    return t.identifier(expr.name);
  }

  let object = expr.object;
  let property = expr.property;

  let out = t.memberExpression(
    jsxMemberExpressionToMemberExpression(object),
    t.identifier(property.name)
  );

  return out;
};

export { jsxMemberExpressionToMemberExpression };
