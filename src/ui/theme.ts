import type { ThemeChoice } from "../model/types";

export function appliedTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice) return choice;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(choice: ThemeChoice): void {
  const theme = appliedTheme(choice);
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#131210" : "#efeae1");
}

export function watchSystemTheme(onChange: () => void): void {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onChange);
}
