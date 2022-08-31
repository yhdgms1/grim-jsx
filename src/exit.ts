import type { VisitNodeFunction } from "@babel/traverse";
import type { types, PluginPass } from "@babel/core";

import { getMutable, getBabel, getConfig } from "./share";

type Program = types.Program;

// @ts-ignore
const exit: VisitNodeFunction<PluginPass, Program> = (path, state) => {
  const { types: t, parseSync } = getBabel();
  const { inuse } = getMutable(state);
  const { node } = path;
  const { body } = node;

  const noImports = Object.values(inuse).every((value) => value === false);

  if (noImports) {
    return;
  }

  const config = getConfig(state);

  const {
    templateFunctionName,
    spreadFunctionName,
    firstElementChild,
    nextElementSibling,
  } = getMutable(state);

  const produceImports = () => {
    const importSpecifiers: types.ImportSpecifier[] = [];

    if (inuse.template) {
      importSpecifiers.push(
        t.importSpecifier(t.identifier(templateFunctionName), t.identifier("template"))
      );
    }

    if (inuse.spread) {
      importSpecifiers.push(
        t.importSpecifier(t.identifier(spreadFunctionName), t.identifier("spread"))
      );
    }

    if (inuse.firstElementChild) {
      importSpecifiers.push(
        t.importSpecifier(
          t.identifier(firstElementChild),
          t.identifier("firstElementChild")
        )
      );
    }

    if (inuse.nextElementSibling) {
      importSpecifiers.push(
        t.importSpecifier(
          t.identifier(nextElementSibling),
          t.identifier("nextElementSibling")
        )
      );
    }

    let addedImport = false;

    for (const child of body) {
      if (t.isImportDeclaration(child)) {
        if (t.isStringLiteral(child.source)) {
          if (child.source.value === config.importSource) {
            child.specifiers.push(...importSpecifiers);

            addedImport = true;
            break;
          }
        }
      }
    }

    if (!noImports && !addedImport) {
      body.unshift(
        t.importDeclaration(
          importSpecifiers,
          t.stringLiteral(config.importSource || "grim-jsx/dist/runtime.js")
        )
      );
    }
  };

  const produceInlining = () => {
    // @ts-expect-error - Rollup will replace it with a string.
    const ast = parseSync(config.customRuntime || RUNTIME);

    if (!ast) {
      throw new Error(`Runtime could not be parsed.`);
    }

    const runtime = ast.program.body;

    if (runtime.length === 0) {
      throw new Error("Runtime is not defined");
    }

    for (const declaration of runtime) {
      if (!t.isVariableDeclaration(declaration)) return;

      const name = declaration.declarations[0].id;

      if (!t.isIdentifier(name)) return;

      let push = false;

      if (name.name === "template" && inuse.template) {
        name.name = templateFunctionName;
        push = true;
      }

      if (name.name === "spread" && inuse.spread) {
        name.name = spreadFunctionName;
        push = true;
      }

      if (name.name === "firstElementChild" && inuse.firstElementChild) {
        name.name = firstElementChild;
        push = true;
      }

      if (name.name === "nextElementSibling" && inuse.nextElementSibling) {
        name.name = nextElementSibling;
        push = true;
      }

      if (push) {
        body.unshift(declaration);
      }
    }
  };

  if (config.inlineRuntime) {
    produceInlining();
  } else {
    produceImports();
  }
};

export { exit };
