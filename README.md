# Grim-JSX

Compiling JSX to produce grim static templates

## Introduction

Ever wanted to use JSX, but at very primitive level? Grim will help you to do it. Look more closer at it below.

### Static HTML

This code:

```jsx
const title = <h1>Hello, Grim!</h1>;
```

Will be compiled to:

```jsx
const title = template(`<h1>Hello, Grim!</h1>`);
```

### More Flexible

But sometimes just the static HTML is not enough.

Here is an example of an attribute that is not a just string. This code:

```jsx
import styles from "./styles.module.css";

const title = <h1 class={styles.title}>Hello, {name}!</h1>;
```

Will be compiled to:

```jsx
import styles from "./styles.module.css";

const title = template(`<h1 class="${styles.title}">Hello, ${name}!</h1>`);
```

### Spread attributes

Setting attributes manually is cool, but what if you want some attributes to be spreaded? Not a problem.

This code:

```jsx
const title = <h1 {...props}>Hello!</h1>;
```

Will be compiled to:

```jsx
const _spread = (props) =>
  Object.entries(props)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");

const title = template(`<h1 ${_spread(props)}>Hello!</h1>`);
```

### Refs

Setting attributes is not enough too. What if you want to get a reference to an element? That's where refs come in.

So this code:

```jsx
let button;

const article = (
  <article>
    <h2>Are cats real?</h2>
    <p>Not, they're not.</p>
    <button type="button" ref={button}>
      You're serious?
    </button>
  </article>
);
```

Will be compiled to:

```jsx
let button;

const article = (() => {
  const tmpl = template(
    `<article><h2>Are cats real?</h2><p>Not, they're not.</p><button type="button">You're serious?</button></article>`
  );

  button = tmpl.firstElementChild.nextElementSibling.nextElementSibling;
  return tmpl;
})();
```

So you can use the button reference in your code.

### No Runtime

But what if you just want Grim to compile JSX into strings and not to bring it's own runtime? You can use the `enableStringMode` option.
Within this mode, this code:

```jsx
const people = ["Artem", "Ivan", "Arina", "Roman", "Kenzi"];

const element = (
  <div>
    <h1>Hello!</h1>
    <ul>{people.map((person) => <li>{person}</li>).join("")}</ul>
  </div>
);
```

Will be compiled to:

```jsx
const people = ["Artem", "Ivan", "Arina", "Roman", "Kenzi"];
const element = `<div><h1>Hello!</h1><ul>${people.map((person) => `<li>${person}</li>`).join("")}</ul></div>`;
```

However, [Refs](#refs) will not work in this mode.
