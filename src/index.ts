import { compileJSXPlugin } from "./plugin";

/**
 * @param {import('../types').Options} [config]
 * @returns {import('../types').Options}
 * @description A helper for configuring the compiler.
 */
const defineConfig = (config = {}) => {
  return config;
};

export { defineConfig, compileJSXPlugin };
export default compileJSXPlugin;
