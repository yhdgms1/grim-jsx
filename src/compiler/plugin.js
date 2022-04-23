import SyntaxJSX from "@babel/plugin-syntax-jsx";

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
 * @param {import('./types').Options} options
 * @returns {babel.PluginObj}
 */
const compileJSXPlugin = (babel, options) => {
  const { types: t } = babel;

  let templateFunctionName = t.identifier("grim_$t");
  let spreadFunctionName = t.identifier("grim_$s");
  let firstElementChild = t.identifier("grim_$fec");
  let nextElementSibling = t.identifier("grim_$nes");

  let templateName = t.identifier("tmpl");
  let importSource = "grim-jsx/dist/runtime.js";

  if (typeof options === "object" && !Array.isArray(options)) {
    if (typeof options.importSource === "string") {
      importSource = options.importSource;
    }

    if (typeof options.templateFunctionName === "string") {
      templateFunctionName = t.identifier(options.templateFunctionName);
    }

    if (typeof options.firstElementChild === "string") {
      firstElementChild = t.identifier(options.firstElementChild);
    }

    if (typeof options.nextElementSibling === "string") {
      nextElementSibling = t.identifier(options.nextElementSibling);
    }

    if (typeof options.spreadFunctionName === "string") {
      spreadFunctionName = t.identifier(options.spreadFunctionName);
    }
  }

  return {
    inherits: SyntaxJSX,
    visitor: {
      JSXFragment(path) {
        throw path.buildCodeFrameError(
          "Grim: Transforming JSXFramgents is not supported"
        );
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
                  if (t.isIdentifier(attr.value.expression)) {
                    const right =
                      current.length > 0
                        ? createMemberExpression(templateName, ...current) ??
                          templateName
                        : templateName;

                    expressions.push(
                      t.expressionStatement(
                        t.assignmentExpression(
                          "=",
                          t.identifier(attr.value.expression.name),
                          right
                        )
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

        const templateCall = t.callExpression(templateFunctionName, [
          template.template,
        ]);

        let tagName = getJSXElementName(root.openingElement.name);

        if (typeof tagName === "string") {
          if (tagName !== "svg" && constants.SVGElements.has(tagName)) {
            template.unshift(`<svg>`);
            templateCall.arguments.push(t.booleanLiteral(true));
            template.push(`</svg>`);
          }
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
      },
      Program(path) {
        /**
         * If the default values is present lets change them to identifies that doesn't collide with any locally defined variables
         */
        if (templateFunctionName.name === "grim_$t") {
          templateFunctionName = path.scope.generateUidIdentifier("t");
        }

        if (firstElementChild.name === "grim_$fec") {
          firstElementChild = path.scope.generateUidIdentifier("fec");
        }

        if (nextElementSibling.name === "grim_$nes") {
          nextElementSibling = path.scope.generateUidIdentifier("nes");
        }

        if (spreadFunctionName.name === "grim_$s") {
          spreadFunctionName = path.scope.generateUidIdentifier("s");
        }

        const body = path.node.body;

        let addedImport = false;

        const importSpecifiers = [
          t.importSpecifier(templateFunctionName, t.identifier("template")),
          t.importSpecifier(spreadFunctionName, t.identifier("spread")),
          t.importSpecifier(
            firstElementChild,
            t.identifier("firstElementChild")
          ),
          t.importSpecifier(
            nextElementSibling,
            t.identifier("nextElementSibling")
          ),
        ];

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

        if (!addedImport) {
          const importeer = t.importDeclaration(
            importSpecifiers,
            t.stringLiteral(importSource)
          );

          body.unshift(importeer);
        }
      },
    },
  };
};

export { compileJSXPlugin };
