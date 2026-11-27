import { DEFAULT_SCALE, letterCuts, letterFor } from "../math/letter";
import { evaluateClass, evaluateFinal, readScale } from "../model/evaluate";
import { fieldInvalid } from "../model/parse";
import type { AppData } from "../model/types";
import type { Actions } from "./actions";
import { button, el, labeledInput } from "./dom";
import { finalFigure } from "./messages";
import { renderSummary } from "./summary";

export function renderFinalPanel(data: AppData, actions: Actions): HTMLElement {
  const gradeClass = data.classes.find((item) => item.id === data.activeClassId) ?? null;
  const scale = gradeClass ? readScale(gradeClass.scale) : DEFAULT_SCALE;
  const outcome = evaluateFinal(data.final);
  const letter =
    outcome !== "incomplete" && outcome.status === "need" && outcome.neededRounded !== null && scale
      ? letterFor(outcome.neededRounded, scale)
      : null;
  const classGrade = gradeClass ? evaluateClass(gradeClass).grade.rounded : null;

  const panel = el("section", {
    role: "tabpanel",
    id: "panel-final",
    "aria-labelledby": "tab-final",
  }, [
    el("h2", { class: "sr-only" }, ["Final exam"]),
    el("p", { class: "hint lead" }, [
      "The current grade is the percentage before the final. Weight is the final’s share of the class.",
    ]),
  ]);

  const current = el("div", { class: "stack" }, [
    labeledInput({
      label: "Current grade (%)",
      value: data.final.current,
      focus: "final-current",
      mode: "decimal",
      maxLength: 16,
      invalid: fieldInvalid(data.final.current),
      onInput: (value) => actions.patchFinal({ current: value }),
    }),
    button("Use class grade", {
      class: "btn inline-action",
      focus: "final-use",
      disabled: classGrade === null,
    }, () => actions.useClassGrade()),
  ]);

  const target = el("div", { class: "stack" }, [
    labeledInput({
      label: "Target (%)",
      value: data.final.target,
      focus: "final-target",
      mode: "decimal",
      maxLength: 16,
      invalid: fieldInvalid(data.final.target),
      onInput: (value) => actions.patchFinal({ target: value }),
    }),
  ]);

  if (scale) {
    const cuts = letterCuts(scale) ?? [];
    const picker = el("select", { focus: "final-letter" });
    picker.append(el("option", { value: "" }, ["Choose a letter"]));
    for (const cut of cuts) {
      picker.append(el("option", { value: cut.letter }, [cut.letter]));
    }
    picker.addEventListener("change", () => {
      if (picker.value) actions.setTargetFromLetter(picker.value);
    });
    target.append(el("label", { class: "field" }, [el("span", { class: "field-label" }, ["Or match a letter"]), picker]));
  }

  panel.append(
    el("div", { class: "final-grid" }, [
      current,
      labeledInput({
        label: "Final weight (%)",
        value: data.final.weight,
        focus: "final-weight",
        mode: "decimal",
        maxLength: 16,
        invalid: fieldInvalid(data.final.weight),
        onInput: (value) => actions.patchFinal({ weight: value }),
      }),
      target,
    ]),
  );
  panel.append(renderSummary(finalFigure(outcome, letter)));
  return panel;
}
