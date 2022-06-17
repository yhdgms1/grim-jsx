import { shared } from "../shared";

/**
 *
 * @param  {...import('@babel/core').types.Statement} body
 * @returns
 */
const createIIFE = (...body) => {
  const { types: t } = shared().babel;

  return t.callExpression(t.arrowFunctionExpression([], t.blockStatement(body)), []);
};

export { createIIFE };
