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
 * @param {object} props
 */
export const spread = (props) =>
  Object.entries(props)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");
