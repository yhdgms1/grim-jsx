import { shared } from "../shared";

/**
 * @param {import('@babel/core').types.ObjectProperty} p
 */
const getKey = (p) => {
  const { types: t } = shared().babel;

  if (p.computed) {
    /**
     * We cannot transform this property.
     * { [key]: value }
     */
    return null;
  }

  if (t.isIdentifier(p.key)) {
    return p.key.name;
  } else if (t.isStringLiteral(p.key)) {
    return p.key.value;
  }

  return null;
};

/**
 * @param {import('@babel/core').types.ObjectProperty} p
 */
const getValue = (p) => {
  const { types: t } = shared().babel;

  if (t.isStringLiteral(p.value)) {
    return p.value.value;
  } else if (t.isNumericLiteral(p.value)) {
    return p.value.value;
  }

  return null;
};

/**
 * @param {import('@babel/core').types.ObjectExpression} ex
 */
const objectExpressionToAttribute = (ex) => {
  const { types: t } = shared().babel;

  const properties = ex.properties;

  let result = "";

  for (const property of properties) {
    if (t.isObjectProperty(property)) {
      const key = getKey(property);
      const value = getValue(property);

      if (key !== null && value !== null) {
        result += `${key}:${value};`;
      } else {
        /**
         * In case we cannot use compilation stage, we will use runtime here.
         */
        return null;
      }
    } else {
      return null;
    }
  }

  return result;
};

export { objectExpressionToAttribute };
