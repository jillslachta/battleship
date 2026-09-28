export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: { className?: string; text?: string; html?: string; attrs?: Record<string, string> } = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.html !== undefined) node.innerHTML = options.html;
  Object.entries(options.attrs ?? {}).forEach(([name, value]) => node.setAttribute(name, value));
  children.forEach((child) => node.append(child));
  return node;
}

export function mount(view: HTMLElement): void {
  const app = document.getElementById('app');
  if (!app) throw new Error('#app container is missing');
  app.replaceChildren(view);
  window.scrollTo({ top: 0 });
}
