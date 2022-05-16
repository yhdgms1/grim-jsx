/**
 * @param {string} html
 * @param {boolean} [isSVG]
 */
export const template = (html, isSVG) => {
  const t = document.createElement("template");
  t.innerHTML = html;

  let node = t.content.firstChild;
  if (isSVG) node = node.firstChild;

  return node;
};

export const firstElementChild = "firstElementChild";
export const nextElementSibling = "nextElementSibling";

/**
 * @param {object} props An object with properties to be set on the element.
 * @param {boolean} [attr]
 */
export const spread = (props, attr) => {
  return Object.entries(props)
    .map(([key, value]) => value == null ? '' : (attr ? `${key}:${value};` : `${key}="${value}"`))
    .join(" ");
};
