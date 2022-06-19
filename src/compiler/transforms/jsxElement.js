import { shared } from "../shared";

import {
  objectExpressionToAttribute,
  insertAttrubute,
  createMemberExpression,
  constants,
  getJSXElementName,
  getAttributeName,
  createTemplateLiteralBuilder,
  createIIFE,
  is,
  escape,
  trim,
  get,
} from "../utils";

/**
 * @param {babel.NodePath<import('@babel/core').types.JSXElement>} path
 * @returns
 */
function JSXElement(path) {
  const { parent, node } = path;

  const { babel, enableCommentOptions, inuse, programPath } = shared();
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

  /** @type {import('@babel/core').types.Identifier[]} */
  let current = [];
  /** @type {null | import('@babel/core').types.Identifier} */
  let type = firstElementChild;

  /** @type {import('@babel/core').types.ExpressionStatement[]} */
  const expressions = [];

  const template = createTemplateLiteralBuilder();

  let templateName = (programPath || path).scope.generateUidIdentifier("el");

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

  /** @type {Record<string, import('@babel/core').types.Identifier | import('@babel/core').types.MemberExpression>} */
  const pathsMap = {};

  /**
   * @param {import('@babel/core').types.Identifier | import('@babel/core').types.MemberExpression} [expr]
   */
  const generateNodeReference = (expr) => {
    /** @type {string} */
    const curr_path =
      current.length === 0 ? templateName.name : current.map((i) => i.name).join(".");

    /** @type {(import('@babel/core').types.Identifier | import('@babel/core').types.MemberExpression)[]} */
    let ph = [...current];
    let path_changed = false;

    const keys = Object.keys(pathsMap);

    /**
     * Longest paths comes to the end, so we iterate from the end
     */
    for (let i = keys.length; i > 0; i--) {
      const key = keys[i - 1];

      if (curr_path.startsWith(key)) {
        const nd = pathsMap[key];

        if (key !== templateName.name) {
          const str = curr_path.substring(0, key.length);
          const slc = str.split(".").length;

          ph = ph.slice(slc, ph.length);
          ph = [nd, ...ph];

          path_changed = true;
          break;
        }
      }
    }

    /**
     * It is needed to generate a new reference for later usage
     */
    if (expr) {
      pathsMap[curr_path] = expr;
    }

    const path = path_changed
      ? createMemberExpression(...ph) || templateName
      : current.length > 0
      ? createMemberExpression(templateName, ...current) || templateName
      : templateName;

    return path;
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
      const trimmed = trim(node.value);

      if (trimmed === null) return;

      template.push(trimmed);
    } else if (t.isJSXExpressionContainer(node)) {
      const { expression } = node;

      if (t.isJSXEmptyExpression(expression)) {
        /**
         * Empty expression will be taken as a string
         */
        template.push(`{}`);
      } else if (t.isStringLiteral(expression)) {
        let { value } = expression;

        /**
         * Statically injects the string
         * i.e. `<div>{'hello lol'}</div>` -> `<div>hello lol</div>`
         */

        value = escape(value);

        template.push(value);
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

          if (is(name, "ref", "textContent") && t.isJSXExpressionContainer(attr.value)) {
            if (opts.enableStringMode) {
              const error = path.scope.hub.buildError(
                attr,
                `Using ${name} in string mode is impossible`,
                Error
              );

              throw error;
            }

            const { expression } = attr.value;

            if (!t.isExpression(expression)) {
              continue;
            }

            for (const item of current) {
              if (item.name === firstElementChild.name) {
                inuse.firstElementChild = true;
              }

              if (item.name === nextElementSibling.name) {
                inuse.nextElementSibling = true;
              }
            }

            if (name === "ref") {
              if (!t.isLVal(expression)) {
                continue;
              }

              const right = generateNodeReference(expression);

              expressions.push(
                t.expressionStatement(t.assignmentExpression("=", expression, right))
              );
            } else if (name === "textContent") {
              expressions.push(
                t.expressionStatement(
                  t.assignmentExpression(
                    "=",
                    t.memberExpression(generateNodeReference(), t.identifier("textContent")),
                    expression
                  )
                )
              );
            }
          } else {
            if (t.isStringLiteral(attr.value)) {
              let { value } = attr.value;

              value = escape(value);

              template.push(insertAttrubute(name, value));
            } else if (t.isJSXExpressionContainer(attr.value)) {
              const { expression } = attr.value;

              if (t.isObjectExpression(expression)) {
                const attr = objectExpressionToAttribute(expression);

                if (attr === null) {
                  inuse.spread = true;

                  template.push(` ${name}="`);
                  template.push(
                    t.callExpression(spreadFunctionName, [expression, t.booleanLiteral(true)])
                  );
                  template.push(`"`);
                } else {
                  template.push(insertAttrubute(name, attr));
                }
              } else if (t.isStringLiteral(expression)) {
                template.push(insertAttrubute(name, expression.value));
              } else if (t.isIdentifier(expression)) {
                const binding = path.scope.getBinding(expression.name);

                const write = () => {
                  template.push(` ${name}="`);
                  template.push(expression);
                  template.push(`"`);
                };

                if (!binding) {
                  write();
                  continue;
                }

                const { node } = binding.path;

                if (!t.isVariableDeclarator(node)) {
                  write();
                  continue;
                }

                if (binding.kind === "const") {
                  if (t.isStringLiteral(node.init) && t.isIdentifier(node.id)) {
                    template.push(` ${name}="${node.init.value}"`);
                  } else {
                    write();
                  }
                } else {
                  write();
                }
              } else if (t.isMemberExpression(expression)) {
                const inline = () => {
                  const { object, property } = expression;

                  if (!t.isIdentifier(object)) return;
                  if (!t.isIdentifier(property)) return;

                  const binding = path.scope.getBinding(object.name);

                  if (!binding) return;

                  const { path: bindingPath } = binding;
                  const { node: bindingNode } = bindingPath;

                  if (!t.isVariableDeclarator(bindingNode)) return;

                  const { init } = bindingNode;

                  if (!t.isObjectExpression(init)) return;

                  const { properties } = init;

                  let valid = true;
                  /** @type {null | string} */
                  let content = null;

                  const mark = () => {
                    valid = false;
                  };

                  for (const prop of properties) {
                    if (t.isObjectMethod(prop) || t.isSpreadElement(prop)) {
                      mark();
                      break;
                    }
                    if (prop.computed) {
                      mark();
                      break;
                    }

                    const { key, value } = prop;

                    if (!(t.isStringLiteral(key) || t.isIdentifier(key))) {
                      mark();
                      break;
                    }
                    if (!(t.isStringLiteral(value) || t.isIdentifier(value))) {
                      mark();
                      break;
                    }

                    if (get(key) === get(property)) {
                      if (t.isStringLiteral(value)) {
                        content = value.value;
                      } else {
                        const binding = path.scope.getBinding(value.name);

                        if (!binding) {
                          mark();
                          break;
                        }

                        const { path: bindingPath } = binding;
                        const { node: bindingNode } = bindingPath;

                        if (!t.isVariableDeclarator(bindingNode)) {
                          mark();
                          break;
                        }

                        const { init } = bindingNode;

                        if (!t.isStringLiteral(init)) {
                          mark();
                          break;
                        }

                        content = init.value;
                      }
                    }
                  }

                  if (valid && content) {
                    template.push(` ${name}="${content}"`);

                    return true;
                  }
                };

                if (!inline()) {
                  template.push(` ${name}="`);
                  template.push(expression);
                  template.push(`"`);
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

    /**
     * We are lucky today, because this is just an _static_ html.
     * TemplateLiteral does not have any expressions, so template could be extracted
     */
    if (programPath && template.template.quasis.length === 1) {
      const current_raw = template.template.quasis[0].value.raw;
      const { sharedNodes } = shared();

      /** @type {import('@babel/core').types.VariableDeclaration | null} */
      let decl = null;

      /**
       * If there are identical elements, we reuse them
       */
      if (sharedNodes[current_raw]) {
        decl = sharedNodes[current_raw];
      } else {
        decl = t.variableDeclaration("let", [
          t.variableDeclarator(
            (programPath || path).scope.generateUidIdentifier("tmpl"),
            templateCall
          ),
        ]);

        programPath.node.body.unshift(decl);

        shared().sharedNodes[current_raw] = decl;
      }

      const object = decl.declarations[0].id;

      if (!t.isExpression(object)) {
        throw path.scope.hub.buildError(node, `${node.type} in unsupported.`, Error);
      }

      const call = t.callExpression(t.memberExpression(object, t.identifier("cloneNode")), [
        t.booleanLiteral(true),
      ]);

      if (expressions.length > 0) {
        path.replaceWith(
          createIIFE(
            t.variableDeclaration("let", [t.variableDeclarator(templateName, call)]),
            ...expressions,
            t.returnStatement(templateName)
          )
        );
      } else {
        path.replaceWith(call);
      }
    } else {
      if (expressions.length > 0) {
        path.replaceWith(
          createIIFE(
            t.variableDeclaration("let", [t.variableDeclarator(templateName, templateCall)]),
            ...expressions,
            t.returnStatement(templateName)
          )
        );
      } else {
        path.replaceWith(templateCall);
      }
    }
  }
}

export { JSXElement };
