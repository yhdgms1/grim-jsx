import { shared } from "../shared";

/**
 * @this {import('@babel/core').PluginPass}
 * @param {import('@babel/core').BabelFile} file
 */
function post(file) {
  const { body } = file.ast.program;

  const { inuse, babel } = shared();
  const { types: t } = babel;

  const noImports = Object.values(inuse).every((value) => value === false);

  if (noImports) {
    /**
     * At this stage post function only manages imports, so if there is no imports, just return...
     */
    return;
  }

  const {
    templateFunctionName,
    spreadFunctionName,
    firstElementChild,
    nextElementSibling,
  } = shared();

  const produceImports = () => {
    /** @type {babel.types.ImportSpecifier[]} */
    const importSpecifiers = [];

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
          if (child.source.value === shared().importSource) {
            child.specifiers.push(...importSpecifiers);

            addedImport = true;
            break;
          }
        }
      }
    }

    if (!noImports && !addedImport) {
      body.unshift(
        t.importDeclaration(importSpecifiers, t.stringLiteral(shared().importSource))
      );
    }
  };

  const produceInlining = () => {
    const { runtime } = shared();

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

  if (shared().inlineRuntime) {
    produceInlining();
  } else {
    produceImports();
  }
}

export { post };
