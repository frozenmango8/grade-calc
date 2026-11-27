import { el } from "./dom";
import type { Figure } from "./messages";

export function renderSummary(figure: Figure): HTMLElement {
  const score = el("div", { class: "summary-score" }, [renderFigure(figure.figure)]);
  if (figure.letter) score.append(el("p", { class: "letter" }, [figure.letter]));
  const block = el("div", { class: "summary", role: "status", "aria-live": "polite", "aria-atomic": "true" }, [
    el("p", { class: "kicker" }, [figure.kicker]),
    score,
  ]);
  if (figure.detail) block.append(el("p", { class: "detail" }, [figure.detail]));
  return block;
}

function renderFigure(text: string): HTMLElement {
  if (!text.endsWith("%")) return el("p", { class: "percent" }, [text]);
  return el("p", { class: "percent" }, [text.slice(0, -1), el("span", { class: "unit" }, ["%"])]);
}
