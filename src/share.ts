import type { PluginPass } from "@babel/core";
import type { Options } from "../types";
import type { WithConfig } from "./enter";

const getConfig = (state: PluginPass): Options => {
  const metadata = state.file.metadata as WithConfig;

  return metadata.config as Options;
};

const getMutable = (state: PluginPass) => {
  const metadata = state.file.metadata as WithConfig;

  return metadata.mutable;
};

/**
 * Используется, чтобы не иметь импортов из @babel/core
 */
let $babel = null as typeof import("@babel/core") | null;

const setBabel = (babel: typeof import("@babel/core")) => {
  $babel = babel;
};

const getBabel = () => {
  return $babel!;
};

export { getConfig, getMutable, setBabel, getBabel };
