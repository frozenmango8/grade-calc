export type Attrs = Record<string, string | number | boolean | undefined>;
export type Child = Node | string | null | false | undefined;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs | null,
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === false) continue;
      if (key === "class") {
        node.className = String(value);
        continue;
      }
      if (key === "focus") {
        node.dataset.focus = String(value);
        continue;
      }
      if (value === true) {
        node.setAttribute(key, "");
        continue;
      }
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

export function button(label: string, attrs: Attrs, onClick: () => void): HTMLButtonElement {
  const node = el("button", { type: "button", ...attrs }, [label]);
  node.addEventListener("click", (event) => {
    event.preventDefault();
    onClick();
  });
  return node;
}

export function labeledInput(options: {
  label: string;
  value: string;
  focus: string;
  onInput: (value: string) => void;
  invalid?: boolean;
  mode?: "text" | "decimal" | "numeric";
  maxLength?: number;
  className?: string;
}): HTMLLabelElement {
  const input = el("input", {
    type: "text",
    value: options.value,
    focus: options.focus,
    inputmode: options.mode ?? "text",
    maxlength: options.maxLength,
    autocomplete: "off",
    spellcheck: "false",
    "aria-invalid": options.invalid ? "true" : undefined,
  });
  input.addEventListener("input", () => options.onInput(input.value));
  return el("label", { class: options.className ? `field ${options.className}` : "field" }, [
    el("span", { class: "field-label" }, [options.label]),
    input,
  ]);
}
