import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

/** @type {import('rollup').RollupOptions} */
const config = {
  input: "src/index.js",
  output: {
    file: "dist/bundle.js",
    format: "esm",
  },
  treeshake: true,
  external: ["@babel/core", "@babel/types", "@babel/plugin-syntax-jsx"],
  plugins: [resolve(), commonjs()],
};

/** @type {import('rollup').RollupOptions} */
const runtime = {
  input: "src/runtime.js",
  output: {
    file: "dist/runtime.js",
    format: "esm",
  },
  plugins: [resolve(), commonjs()],
};

export default [config, runtime];
