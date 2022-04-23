import * as t from "@babel/types";

/**
 * @param {t.JSXMemberExpression | t.JSXIdentifier} expr
 */
const jsxMemberExpressionToMemberExpression = (expr) => {
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
