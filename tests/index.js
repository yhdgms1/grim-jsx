import { test } from "uvu";
import { is } from "uvu/assert";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";

import { transformAsync } from "@babel/core";
import { compileJSXPlugin } from "../dist/bundle.js";

const defaultOptions = {
  importSource: "grim-jsx/runtime.js",
  templateFunctionName: "template",
  firstElementChild: "firstElementChild",
  nextElementSibling: "nextElementSibling",
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

        const ignoreDefaultOptions = code.includes(
          "/* !no-default-options! */"
        );

        const optionsInCaseOfIgnoringDefaults = {
          importSource: defaultOptions.importSource,
        };

        test(entry, async () => {
          const transformResult = await transformAsync(code, {
            plugins: [
              [
                compileJSXPlugin,
                ignoreDefaultOptions
                  ? optionsInCaseOfIgnoringDefaults
                  : defaultOptions,
              ],
            ],
            babelrc: false,
            comments: false,
          });

          if (!transformResult) {
            throw new Error(`Could not transform ${entry}.`);
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
