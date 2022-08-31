/**
 * Is items[] contains an item
 */
const is = (it: unknown, ...items: unknown[]) => {
  for (const item of items) {
    if (it === item) return true;
  }

  return false;
};

export { is };
