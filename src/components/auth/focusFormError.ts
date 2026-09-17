"use client";

export function focusNamedControl(
  form: HTMLFormElement | null,
  name: string,
): boolean {
  const el = form?.elements.namedItem(name);
  if (el instanceof RadioNodeList) {
    const first = el[0];
    if (first instanceof HTMLElement) {
      first.focus();
      return true;
    }
    return false;
  }
  if (el instanceof HTMLElement) {
    el.focus();
    return true;
  }
  return false;
}
