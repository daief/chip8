export const $id = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as any as T;
