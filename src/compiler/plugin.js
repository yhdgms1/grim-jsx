import SyntaxJSX from "@babel/plugin-syntax-jsx";

import { setBabel } from "./babel";

import {
  objectExpressionToAttribute,
  insertAttrubute,
  createMemberExpression,
  constants,
  getJSXElementName,
  getAttributeName,
  createTemplateLiteralBuilder,
} from "./utils";

/**
 * @param {typeof babel} babel
 * @param {import('../../types').Options} options
 * @returns {babel.PluginObj}
 */
const compileJSXPlugin = (babel, options) => {
  setBabel(babel);

  const { types: t } = babel;

  let templateFunctionName = t.identifier("grim_$t");
  let spreadFunctionName = t.identifier("grim_$s");
  let firstElementChild = t.identifier("grim_$fec");
  let nextElementSibling = t.identifier("grim_$nes");

  let importSource = "grim-jsx/dist/runtime.js";

  if (typeof options === "object" && !Array.isArray(options)) {
    if (typeof options.importSource === "string") {
      importSource = options.importSource;
    }
  }

  let inuse = {
    template: false,
    firstElementChild: false,
    nextElementSibling: false,
    spread: false,
  };

  return {
    inherits: SyntaxJSX,
    visitor: {
      JSXFragment(path) {
        throw path.buildCodeFrameError(
          "Grim: Transforming JSXFramgents is not supported"
        );
      },
      Program(path) {
        /**
         * Clean up
         */
        inuse = {
          template: false,
          firstElementChild: false,
          nextElementSibling: false,
          spread: false,
        };

        templateFunctionName = path.scope.generateUidIdentifier("tmpl");
        firstElementChild = path.scope.generateUidIdentifier("fec");
        nextElementSibling = path.scope.generateUidIdentifier("nes");
        spreadFunctionName = path.scope.generateUidIdentifier("sprd");
      },
      JSXElement(path) {
        const { parent, node } = path;

        if (
          t.isJSXElement(parent) ||
          t.isJSXExpressionContainer(parent) ||
          t.isJSXSpreadChild(parent) ||
          t.isJSXText(parent)
        ) {
          return;
        }

        const root = node;

        /** @type {babel.types.Identifier[]} */
        let current = [];
        /** @type {null | babel.types.Identifier} */
        let type = firstElementChild;

        /** @type {babel.types.ExpressionStatement[]} */
        const expressions = [];

        const template = createTemplateLiteralBuilder();

        let templateName = t.identifier("tmpl");

        /**
         * @param {typeof root.children[number]} node
         */
        const process = (node) => {
          if (t.isJSXText(node)) {
            const value = node.value.trim();

            value !== "" && template.push(value);
          } else if (t.isJSXExpressionContainer(node)) {
            const expression = node.expression;

            if (!t.isJSXEmptyExpression(expression)) {
              template.push(expression);
            }
          } else if (t.isJSXElement(node)) {
            let tagName = getJSXElementName(node.openingElement.name);

            if (typeof tagName === "string") {
              template.push(`<${tagName}`);
            } else {
              template.push(`<`);
              template.push(tagName.expression);
            }

            for (const attr of node.openingElement.attributes) {
              if (t.isJSXAttribute(attr)) {
                let name = getAttributeName(attr);

                if (name === "ref" && t.isJSXExpressionContainer(attr.value)) {
                  if (!!options.enableStringMode) {
                    throw path.buildCodeFrameError(
                      "Grim: Using ref's in string mode is impossible"
                    );
                  }

                  const { expression } = attr.value;

                  if (
                    t.isIdentifier(expression) ||
                    t.isMemberExpression(expression)
                  ) {
                    const right =
                      current.length > 0
                        ? createMemberExpression(templateName, ...current) ??
                          templateName
                        : templateName;

                    for (const item of current) {
                      if (item.name === firstElementChild.name) {
                        inuse.firstElementChild = true;
                      }

                      if (item.name === nextElementSibling.name) {
                        inuse.nextElementSibling = true;
                      }
                    }

                    expressions.push(
                      t.expressionStatement(
                        t.assignmentExpression("=", expression, right)
                      )
                    );
                  }
                } else {
                  if (t.isStringLiteral(attr.value)) {
                    template.push(insertAttrubute(name, attr.value.value));
                  } else if (t.isJSXExpressionContainer(attr.value)) {
                    const expression = attr.value.expression;

                    if (t.isObjectExpression(expression)) {
                      template.push(
                        insertAttrubute(
                          name,
                          objectExpressionToAttribute(expression)
                        )
                      );
                    } else if (t.isExpression(expression)) {
                      template.push(` ${name}="`);
                      template.push(expression);
                      template.push(`"`);
                    }
                  }
                }
              } else if (t.isJSXSpreadAttribute(attr)) {
                const { argument } = attr;

                template.push(` `);
                template.push(t.callExpression(spreadFunctionName, [argument]));

                inuse.spread = true;
              }
            }

            template.push(`>`);

            const current_index = current.length;

            let goneDeeper = false;

            for (let i = 0; i < node.children.length; i++) {
              const child = node.children[i];

              if (i === 0) {
                type = firstElementChild;
              } else {
                type = goneDeeper ? nextElementSibling : firstElementChild;
              }

              if (t.isJSXText(child)) {
                type = null;
              }

              if (type && type.name === firstElementChild.name) {
                goneDeeper = true;
              }

              type !== null && current.push(type);

              process(child);
            }

            current = current.slice(0, current_index);

            if (typeof tagName === "string") {
              if (!constants.voidElements.has(tagName)) {
                template.push(`</${tagName}>`);
              }
            } else {
              template.push(`</`);
              template.push(tagName.expression);
              template.push(`>`);
            }
          }
        };

        process(root);

        let tagName = getJSXElementName(root.openingElement.name);

        let isSVG = false;

        if (typeof tagName === "string") {
          isSVG = tagName !== "svg" && constants.SVGElements.has(tagName);
        }

        if (options.enableStringMode) {
          path.replaceWith(template.template);
        } else {
          inuse.template = true;

          const templateCall = t.callExpression(templateFunctionName, [
            template.template,
          ]);

          if (isSVG) {
            template.unshift(`<svg>`);
            templateCall.arguments.push(t.booleanLiteral(true));
            template.push(`</svg>`);
          }

          if (expressions.length > 0) {
            path.replaceWith(
              t.callExpression(
                t.arrowFunctionExpression(
                  [],
                  t.blockStatement([
                    t.variableDeclaration("const", [
                      t.variableDeclarator(templateName, templateCall),
                    ]),
                    ...expressions,
                    t.returnStatement(templateName),
                  ])
                ),
                []
              )
            );
          } else {
            path.replaceWith(templateCall);
          }
        }
      },
    },
    post(file) {
      const { body } = file.ast.program;

      /** @type {babel.types.ImportSpecifier[]} */
      const importSpecifiers = [];

      if (inuse.template === true) {
        importSpecifiers.push(
          t.importSpecifier(templateFunctionName, t.identifier("template"))
        );
      }

      if (inuse.spread === true) {
        importSpecifiers.push(
          t.importSpecifier(spreadFunctionName, t.identifier("spread"))
        );
      }

      if (inuse.firstElementChild === true) {
        importSpecifiers.push(
          t.importSpecifier(
            firstElementChild,
            t.identifier("firstElementChild")
          )
        );
      }

      if (inuse.nextElementSibling === true) {
        importSpecifiers.push(
          t.importSpecifier(
            nextElementSibling,
            t.identifier("nextElementSibling")
          )
        );
      }

      let addedImport = false;

      for (const child of body) {
        if (t.isImportDeclaration(child)) {
          if (t.isStringLiteral(child.source)) {
            if (child.source.value === importSource) {
              child.specifiers.push(...importSpecifiers);

              addedImport = true;
              break;
            }
          }
        }
      }

      const noImports = Object.values(inuse).every((value) => value === false);

      if (!noImports && !addedImport) {
        body.unshift(
          t.importDeclaration(importSpecifiers, t.stringLiteral(importSource))
        );
      }
    },
  };
};

export { compileJSXPlugin };
