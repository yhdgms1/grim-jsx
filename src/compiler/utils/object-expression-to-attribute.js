import { getBabel } from "../babel";

/**
 * @param {babel.types.ObjectProperty} p
 */
const getKey = (p) => {
  const { types: t } = getBabel();

  if (t.isIdentifier(p.key)) {
    return p.key.name;
  } else if (t.isStringLiteral(p.key)) {
    return p.key.value;
  }

  return null;
};

/**
 * @param {babel.types.ObjectProperty} p
 */
const getValue = (p) => {
  const { types: t } = getBabel();

  if (t.isStringLiteral(p.value)) {
    return p.value.value;
  } else if (t.isNumericLiteral(p.value)) {
    return p.value.value;
  }

  return null;
};

/**
 * @param {babel.types.ObjectExpression} ex
 */
const objectExpressionToAttribute = (ex) => {
  const { types: t } = getBabel();

  const properties = ex.properties;

  let result = "";

  for (const property of properties) {
    if (t.isObjectProperty(property)) {
      const key = getKey(property);

      if (key === null) continue;

      const value = getValue(property);

      if (value === null) continue;

      result += `${key}:${value};`;
    }
  }

  return result;
};

export { objectExpressionToAttribute };
