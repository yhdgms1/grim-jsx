import { rollup, defineConfig } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

/**
 * @param {string} code
 */
const escapeStringLiteral = (code) => {
  return code.replaceAll("`", "\\`").replaceAll("${", "\\${");
};

const buildRuntime = rollup(
  defineConfig({
    input: "src/runtime.js",
  })
);

async function main() {
  const { write } = await buildRuntime;

  const { output } = await write({
    file: "dist/runtime.js",
    format: "esm",
  });

  const code = output[0].code;

  const plugin = await rollup(
    defineConfig({
      input: "src/index.js",
      treeshake: true,
      external: ["@babel/core", "@babel/types", "@babel/plugin-syntax-jsx"],
      plugins: [
        resolve(),
        commonjs(),
        replace({
          preventAssignment: true,
          values: {
            RUNTIME: "`" + escapeStringLiteral(code) + "`",
          },
        }),
      ],
    })
  );

  await plugin.write({
    file: "dist/bundle.js",
    format: "esm",
  });
}

main();
