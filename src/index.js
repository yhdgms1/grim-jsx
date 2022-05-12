export * from "./compiler";

/**
 * @param {import('../types').Options} [config]
 * @returns {import('../types').Options}
 * @description A helper for configuring the compiler.
 */
const defineConfig = (config = {}) => {
  return config;
};

export { defineConfig };
