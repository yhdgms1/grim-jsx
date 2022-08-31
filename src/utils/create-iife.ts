import type { types } from "@babel/core";
import { getBabel } from "../share";

const createIIFE = (...body: types.Statement[]) => {
  const { types: t } = getBabel();

  return t.callExpression(t.arrowFunctionExpression([], t.blockStatement(body)), []);
};

export { createIIFE };
