import { shared } from "../shared";

import { jsxMemberExpressionToMemberExpression } from "./jsx-member-expression-to-member-expression";

const createTemplateLiteralBuilder = () => {
  const { types: t } = shared().babel;

  const tl = t.templateLiteral([t.templateElement({ raw: "", cooked: "" })], []);

  /**
   * The unshift method works only with strings.
   * @param {string} arg
   */
  const unshift = (arg) => {
    tl.quasis[0].value.raw = arg + tl.quasis[0].value.raw;
    tl.quasis[0].value.cooked = arg + tl.quasis[0].value.cooked;
  };

  /**
   * @param {string | import('@babel/core').types.Expression | import('@babel/core').types.JSXMemberExpression} arg
   */
  const push = (arg) => {
    if (typeof arg === "string") {
      tl.quasis[tl.quasis.length - 1].value.raw += arg;
      tl.quasis[tl.quasis.length - 1].value.cooked += arg;
    } else {
      let expr = t.isJSXMemberExpression(arg)
        ? jsxMemberExpressionToMemberExpression(arg)
        : arg;

      tl.expressions.push(expr);
      tl.quasis.push(t.templateElement({ raw: "", cooked: "" }));
    }
  };

  return {
    push,
    unshift,
    template: tl,
  };
};

export { createTemplateLiteralBuilder };
