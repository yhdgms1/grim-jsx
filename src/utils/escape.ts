const replacements = [
  ["`", "\\`"],
  ["${", "\\${"],
];

/**
 * Escapes '`' and '${'
 */
const escape = (text: string) => {
  for (const [s, r] of replacements) {
    text = text.replaceAll(s, r);
  }

  return text;
};

export { escape };
