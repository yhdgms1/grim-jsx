import type { types, PluginPass } from "@babel/core";
import type { VisitNodeFunction } from "@babel/traverse";

type JSXElement = types.JSXElement;

import { getBabel, getConfig, getMutable } from "./share";

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
} from "./utils";

const JSXElement: VisitNodeFunction<PluginPass, JSXElement> = (path, state) => {
  const { parent, node } = path;

  const {
    templateFunctionName: tmpl,
    spreadFunctionName: sprd,
    firstElementChild: fec,
    nextElementSibling: nes,
    inuse,
    generateGlobalUid,
    programPath,
    sharedNodes,
  } = getMutable(state);

  const config = getConfig(state);
  const babel = getBabel();
  const { types: t } = babel;

  // prettier-ignore
  if (t.isJSXElement(parent) || t.isJSXExpressionContainer(parent) || t.isJSXSpreadChild(parent) || t.isJSXText(parent)) {
    return;
  }

  const spreadFunctionName = t.identifier(sprd);
  const firstElementChild = t.identifier(fec);
  const nextElementSibling = t.identifier(nes);

  const root = node;

  let current: types.Identifier[] = [];
  let type: null | types.Identifier = firstElementChild;

  const expressions: types.ExpressionStatement[] = [];

  const template = createTemplateLiteralBuilder();

  let templateName = t.identifier(generateGlobalUid("el"));

  let enableStringMode = config.enableStringMode;
  let enableCommentOptions = config.enableCommentOptions;

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
          enableStringMode = true;
        }

        if (value.includes("@disableStringMode")) {
          enableStringMode = false;
        }
      }
    }
  };

  type Ref = types.Identifier | types.MemberExpression;
  const pathsMap = {} as Record<string, Ref>;

  const generateNodeReference = (ref?: Ref) => {
    const empty = current.length === 0;
    const rootElement = templateName.name;
    const currentPath = empty ? rootElement : current.map((i) => i.name).join(".");

    let path = current.slice() as Ref[];
    let pathChanged = false;

    const keys = Object.keys(pathsMap);

    for (let i = keys.length; i > 0; i--) {
      const key = keys[i - 1];

      if (currentPath.startsWith(key)) {
        const node = pathsMap[key];

        if (key !== rootElement) {
          const str = currentPath.substring(0, key.length);
          // количество элементов, входящих в путь
          const selection = str.split(".").length;

          path = [node, ...path.slice(selection, path.length)];

          pathChanged = true;
          break;
        }
      }
    }

    ref && (pathsMap[currentPath] = ref);

    const ph = pathChanged
      ? createMemberExpression(...path) || templateName
      : current.length > 0
      ? createMemberExpression(templateName, ...current) || templateName
      : templateName;

    return ph;
  };

  /**
   * Try's to find the commend nodes with options
   */
  if (enableCommentOptions) extendOptions();

  const process = (node: typeof root.children[number]) => {
    if (t.isJSXText(node)) {
      const { value } = node;

      if (value.trim() === "") return;

      const splitted = value.split("\n");

      let text = "";

      let i = 0;

      while (i < splitted.length) {
        const line = splitted[i];

        let str = escape(line.trim());

        /**
         *  `     I am formatting` -> `I am formatting`
         *  ` I am not`            -> ` I am not`
         *  `I just retarded     ` -> `I just retarded`
         *  `I am not `            -> `I am not `
         */

        if (line[0] === " " && line[1] !== " ") {
          str = " " + str;
        }

        let len = line.length;

        if (line[len - 1] === " " && line[len - 2] !== " ") {
          str += " ";
        }

        if (str.trim() !== "") {
          text += i > 1 ? " " + str : str;
        }

        i++;
      }

      template.push(text);
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
      template.push(tagName);

      for (const attr of node.openingElement.attributes) {
        if (t.isJSXAttribute(attr)) {
          let name = getAttributeName(attr);

          if (is(name, "ref", "textContent") && t.isJSXExpressionContainer(attr.value)) {
            if (enableStringMode) {
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
                    t.memberExpression(
                      generateNodeReference(),
                      t.identifier("textContent")
                    ),
                    expression
                  )
                )
              );
            }
          } else {
            if (t.isStringLiteral(attr.value)) {
              const value = escape(attr.value.value);

              template.push(insertAttrubute(name, value));
            } else if (t.isJSXExpressionContainer(attr.value)) {
              const { expression } = attr.value;

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
              } else if (t.isStringLiteral(expression)) {
                template.push(insertAttrubute(name, expression.value));
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

      const selfClosing = constants.voidElements.has(tagName as string);

      if (!selfClosing) {
        template.push(`</`);
        template.push(tagName);
        template.push(`>`);
      }
    }
  };

  process(root);

  let tagName = getJSXElementName(root.openingElement.name);

  const isSVG = tagName !== "svg" && constants.SVGElements.has(tagName as string);

  if (enableStringMode) {
    path.replaceWith(template.template);
  } else {
    inuse.template = true;

    const templateCall = t.callExpression(t.identifier(tmpl), [template.template]);

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

      let decl: types.VariableDeclaration | null = null;

      /**
       * If there are identical elements, we reuse them
       */
      if (sharedNodes[current_raw]) {
        decl = sharedNodes[current_raw];
      } else {
        decl = t.variableDeclaration("let", [
          t.variableDeclarator(t.identifier(generateGlobalUid("tmpl")), templateCall),
        ]);

        programPath.node.body.unshift(decl);

        sharedNodes[current_raw] = decl;
      }

      const object = decl!.declarations[0].id;

      if (!t.isExpression(object)) {
        throw path.scope.hub.buildError(node, `${node.type} in unsupported.`, Error);
      }

      const call = t.callExpression(
        t.memberExpression(object, t.identifier("cloneNode")),
        [t.booleanLiteral(true)]
      );

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
            t.variableDeclaration("let", [
              t.variableDeclarator(templateName, templateCall),
            ]),
            ...expressions,
            t.returnStatement(templateName)
          )
        );
      } else {
        path.replaceWith(templateCall);
      }
    }
  }
};

export { JSXElement };
