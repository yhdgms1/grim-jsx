namespace JSX {
  type Element = HTMLElement | string;

  interface ElementChildrenAttribute {
    children?: any;
  }

  interface IntrinsicElements {
    [element: any]: any;
  }
}

export {};
