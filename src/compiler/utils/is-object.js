/**
 * @param {unknown} arg
 * @returns {arg is object}
 */
const isObject = (arg) => {
  return typeof arg === "object" && !Array.isArray(arg) && arg !== null;
};

export { isObject };
