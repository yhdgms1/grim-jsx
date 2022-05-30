const replacements = [
  ["`", "\\`"],
  ["${", "\\${"],
];

/**
 * Escapes '`' and '${'
 * @param {string} text
 */
const escape = (text) => {
  for (const [s, r] of replacements) {
    text = text.replaceAll(s, r);
  }

  return text;
};

export { escape };
