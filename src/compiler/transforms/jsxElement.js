import { shared } from "../shared";

import {
  objectExpressionToAttribute,
  insertAttrubute,
  createMemberExpression,
  constants,
  getJSXElementName,
  getAttributeName,
  createTemplateLiteralBuilder,
} from "../utils";

/**
 * @param {babel.NodePath<babel.types.JSXElement>} path
 * @returns
 */
function JSXElement(path) {
  const { parent, node } = path;

  const { babel, enableCommentOptions, inuse } = shared();
  const { types: t } = babel;

  if (
    t.isJSXElement(parent) ||
    t.isJSXExpressionContainer(parent) ||
    t.isJSXSpreadChild(parent) ||
    t.isJSXText(parent)
  ) {
    return;
  }

  const {
    spreadFunctionName: sprd,
    firstElementChild: fec,
    nextElementSibling: nes,
  } = shared();

  const spreadFunctionName = t.identifier(sprd);
  const firstElementChild = t.identifier(fec);
  const nextElementSibling = t.identifier(nes);

  const root = node;

  /** @type {babel.types.Identifier[]} */
  let current = [];
  /** @type {null | babel.types.Identifier} */
  let type = firstElementChild;

  /** @type {babel.types.ExpressionStatement[]} */
  const expressions = [];

  const template = createTemplateLiteralBuilder();

  let templateName = t.identifier("tmpl");

  const opts = { enableStringMode: shared().enableStringMode };

  const extendOptions = () => {
    /**
     * Path with comments
     */
    const p = path.findParent((p) => !!p.node.leadingComments);

    if (p) {
      const { leadingComments } = p.node;

      if (!leadingComments) return;

      for (const comment of leadingComments) {
        const { value, loc } = comment;

        if (value.includes("@enableStringMode")) {
          opts.enableStringMode = true;
        }

        if (value.includes("@disableStringMode")) {
          opts.enableStringMode = false;
        }
      }
    }
  };

  /**
   * Try's to find the commend nodes with options
   */
  if (enableCommentOptions) extendOptions();

  /**
   * @param {typeof root.children[number]} node
   */
  const process = (node) => {
    if (t.isJSXText(node)) {
      const value = node.value.trim();

      if (value !== "") {
        /**
         * Template Literals should be escaped
         */
        template.push(value.replaceAll("`", "\\`"));
      }
    } else if (t.isJSXExpressionContainer(node)) {
      const { expression } = node;

      if (t.isJSXEmptyExpression(expression)) {
        /**
         * Empty expression will be taken as a string
         */
        template.push(`{}`);
      } else {
        template.push(expression);
      }
    } else if (t.isJSXElement(node)) {
      let tagName = getJSXElementName(node.openingElement.name);

      template.push(`<`);

      if (typeof tagName === "string") {
        template.push(tagName);
      } else {
        template.push(tagName.expression);
      }

      for (const attr of node.openingElement.attributes) {
        if (t.isJSXAttribute(attr)) {
          let name = getAttributeName(attr);

          if (name === "ref" && t.isJSXExpressionContainer(attr.value)) {
            if (opts.enableStringMode) {
              const error = path.scope.hub.buildError(
                node,
                "Using ref's in string mode is impossible",
                Error
              );

              throw error;
            }

            const { expression } = attr.value;

            if (t.isIdentifier(expression) || t.isMemberExpression(expression)) {
              const right =
                current.length > 0
                  ? createMemberExpression(templateName, ...current) ?? templateName
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
                t.expressionStatement(t.assignmentExpression("=", expression, right))
              );
            }
          } else {
            if (t.isStringLiteral(attr.value)) {
              template.push(insertAttrubute(name, attr.value.value));
            } else if (t.isJSXExpressionContainer(attr.value)) {
              const expression = attr.value.expression;

              if (t.isObjectExpression(expression)) {
                const attr = objectExpressionToAttribute(expression);

                if (attr === null) {
                  inuse.spread = true;

                  template.push(` ${name}="`);
                  template.push(
                    t.callExpression(spreadFunctionName, [
                      expression,
                      t.booleanLiteral(true),
                    ])
                  );
                  template.push(`"`);
                } else {
                  template.push(insertAttrubute(name, attr));
                }
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

  if (opts.enableStringMode) {
    path.replaceWith(template.template);
  } else {
    inuse.template = true;

    const templateCall = t.callExpression(t.identifier(shared().templateFunctionName), [
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
}

export { JSXElement };
