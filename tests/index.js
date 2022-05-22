import { test } from "uvu";
import { is } from "uvu/assert";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";

import { transformAsync } from "@babel/core";
import { compileJSXPlugin } from "../dist/bundle.js";

const defaultOptions = {
  importSource: "grim-jsx/runtime.js",
  enableCommentOptions: true,
};

const cwd = process.cwd();

async function main() {
  const dir = await fsp.readdir(path.resolve(cwd, "tests"));

  for (const entry of dir) {
    if (entry === "index.js") continue;
    const testPath = path.resolve(cwd, "tests", entry);
    const stat = await fsp.stat(testPath);

    if (stat.isDirectory()) {
      const codePath = path.join(testPath, "code.snapshot");
      const expectedPath = path.join(testPath, "expected.snapshot");

      const codeExists = await fs.existsSync(codePath);
      const expectedExists = fs.existsSync(expectedPath);

      if (codeExists && expectedExists) {
        const code = await fsp.readFile(codePath, "utf-8");
        const expected = await fsp.readFile(expectedPath, "utf-8");

        test(entry, async () => {
          /** @type {null | object} */
          const options = (() => {
            let rx = /\/\*(.*?)\*\//s;

            let match = rx.exec(code);

            if (typeof match === "object" && Array.isArray(match)) {
              if (typeof match[1] === "string") {
                let m = match[1].trim();

                if (m.startsWith("options: ")) {
                  m = m.slice(9);

                  try {
                    return JSON.parse(m);
                  } catch (error) {
                    return null;
                  }
                }
              }
            }

            return null;
          })();

          const transformResult = await transformAsync(code, {
            plugins: [
              [
                compileJSXPlugin,
                options !== null ? { ...defaultOptions, ...options } : defaultOptions,
              ],
            ],
            babelrc: false,
            browserslistConfigFile: false,
            configFile: false,
            highlightCode: false,
            comments: false,
            filename: entry.replaceAll(" ", "_"),
          });

          if (!transformResult) {
            return console.log(`Could not transform ${entry}.`);
          }

          const { code: result } = transformResult;

          if (expected === "") {
            console.log(result);
            return;
          }

          is(result, expected);
        });
      }
    }
  }
}

main().then(test.run);
