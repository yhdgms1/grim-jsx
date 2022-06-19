import { escape } from "./escape";

/**
 * @param {string} value
 * @returns {string | null}
 */
const trim = (value) => {
  if (value.trim() === "") return null;

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

  return text;
};

export { trim };
