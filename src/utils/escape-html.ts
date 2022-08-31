const escaped: Record<string, string> = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

const escapeHTML = (html: string) => html.replace(/["'&<>]/g, (match) => escaped[match]);

export { escapeHTML };
