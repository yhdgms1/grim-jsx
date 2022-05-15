import { shared } from "../shared";

/**
 * @param {babel.types.JSXMemberExpression | babel.types.JSXIdentifier} expr
 */
const jsxMemberExpressionToMemberExpression = (expr) => {
  const { types: t } = shared().babel;

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
