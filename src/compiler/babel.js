/** @type {import('@babel/core') | null} */
let _module = null;

/**
 * @param {import('@babel/core')} arg
 */
let setBabel = (arg) => {
  _module = arg;
};

/**
 * @returns {import('@babel/core')}
 */
//@ts-ignore
let getBabel = () => _module;

export { getBabel, setBabel };
