/** @type {Record<string, string>} */
const escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

/**
 * @param {string} html
 */
const escapeHTML = (html) =>
  html.replace(/["'&<>]/g, (match) => escaped[match]);

export { escapeHTML };
