/**
 * If items[] contains an item
 * @param {unknown} it
 * @param {unknown[]} items
 */
const is = (it, ...items) => {
  for (const item of items) {
    if (it === item) return true;
  }

  return false;
};

export { is };
