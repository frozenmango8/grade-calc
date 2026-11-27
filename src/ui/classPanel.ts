import type { CategoryResult } from "../math/classGrade";
import { letterCuts } from "../math/letter";
import { categoryLabel, classLabel } from "../model/defaults";
import { evaluateClass, viewAssignment } from "../model/evaluate";
import { countInvalid, fieldInvalid } from "../model/parse";
import type { AppData, Category, GradeClass } from "../model/types";
import type { Actions, UiState } from "./actions";
import { button, el, labeledInput } from "./dom";
import { formatFixed, formatTrimmed } from "./format";
import { classBanners, gradeFigure } from "./messages";
import { renderSummary } from "./summary";

export function renderClassPanel(data: AppData, ui: UiState, actions: Actions): HTMLElement {
  const panel = el("section", {
    role: "tabpanel",
    id: "panel-class",
    "aria-labelledby": "tab-class",
  });
  panel.append(el("h2", { class: "sr-only" }, ["Class grade"]));

  const gradeClass = data.classes.find((item) => item.id === data.activeClassId) ?? null;
  if (!gradeClass) {
    panel.append(el("p", { class: "hint" }, ["No classes saved in this browser."]));
    panel.append(button("New class", { class: "btn", focus: "new-class" }, () => actions.addClass()));
    return panel;
  }

  panel.append(renderToolbar(data, gradeClass, ui, actions));
  const evaluated = evaluateClass(gradeClass);
  panel.append(renderSummary(gradeFigure(evaluated.grade, evaluated.letter, evaluated.scale !== null)));
  for (const banner of classBanners(gradeClass, evaluated.grade)) {
    panel.append(el("p", { class: banner.tone === "warn" ? "banner" : "note", role: "status" }, [banner.text]));
  }
  panel.append(
    el("p", { class: "hint" }, [
      "Points in a category are added together. Categories with no scores are left out and the rest are rescaled.",
    ]),
  );

  gradeClass.categories.forEach((category, index) => {
    panel.append(renderCategory(category, evaluated.grade.categories[index], actions));
  });
  panel.append(
    button("Add category", { class: "btn", focus: "add-category" }, () => actions.addCategory()),
  );
  panel.append(renderScale(gradeClass, actions));
  return panel;
}

function renderToolbar(
  data: AppData,
  gradeClass: GradeClass,
  ui: UiState,
  actions: Actions,
): HTMLElement {
  const picker = el("select", { focus: "class-select" });
  for (const item of data.classes) {
    picker.append(el("option", { value: item.id, selected: item.id === gradeClass.id }, [classLabel(item)]));
  }
  picker.addEventListener("change", () => actions.selectClass(picker.value));

  const bar = el("div", { class: "toolbar" }, [
    el("label", { class: "field class-picker" }, [el("span", { class: "field-label" }, ["Class"]), picker]),
    labeledInput({
      label: "Name",
      value: gradeClass.name,
      focus: "class-name",
      className: "grow",
      maxLength: 80,
      onInput: (value) => actions.renameClass(value),
    }),
  ]);

  const actionsRow = el("div", { class: "toolbar-actions" }, [
    button("New class", { class: "btn", focus: "new-class" }, () => actions.addClass()),
    button("Copy link", { class: "btn", focus: "copy-link" }, () => actions.copyLink()),
    button(ui.deleteArmed ? "Confirm delete" : "Delete", {
      class: ui.deleteArmed ? "btn danger" : "btn",
      focus: "delete-class",
      "aria-pressed": ui.deleteArmed ? "true" : "false",
    }, () => actions.armDelete()),
  ]);
  bar.append(actionsRow);
  return bar;
}

function renderCategory(
  category: Category,
  result: CategoryResult | undefined,
  actions: Actions,
): HTMLElement {
  const dropped = new Set(result?.dropped ?? []);
  const block = el("section", { class: "category" });
  const head = el("div", { class: "cat-head" }, [
    labeledInput({
      label: "Category",
      value: category.name,
      focus: `cat-${category.id}-name`,
      className: "cat-name",
      maxLength: 80,
      onInput: (value) => actions.patchCategory(category.id, { name: value }),
    }),
    labeledInput({
      label: "Weight (%)",
      value: category.weight,
      focus: `cat-${category.id}-weight`,
      mode: "decimal",
      maxLength: 16,
      invalid: fieldInvalid(category.weight),
      onInput: (value) => actions.patchCategory(category.id, { weight: value }),
    }),
    labeledInput({
      label: "Drop lowest",
      value: category.dropLowest,
      focus: `cat-${category.id}-drop`,
      mode: "numeric",
      maxLength: 4,
      invalid: countInvalid(category.dropLowest),
      onInput: (value) => actions.patchCategory(category.id, { dropLowest: value }),
    }),
    el("div", { class: "cat-score" }, [
      el("p", { class: "cat-percent" }, [categoryPercent(result)]),
      categoryStatus(category, result),
    ]),
    button("Remove", {
      class: "btn cat-remove",
      focus: `cat-${category.id}-remove`,
      "aria-label": `Remove ${categoryLabel(category)}`,
    }, () => actions.removeCategory(category.id)),
  ]);
  block.append(head);

  const ledger = el("div", { class: "ledger" });
  if (category.assignments.length > 0) {
    ledger.append(
      el("div", { class: "cols", "aria-hidden": "true" }, [
        el("span", null, ["Assignment"]),
        el("span", null, ["Earned"]),
        el("span", null, ["Possible"]),
        el("span", null, ["Score"]),
        el("span", null, [""]),
      ]),
    );
  } else {
    block.append(el("p", { class: "hint tight" }, ["No assignments yet."]));
  }

  for (const assignment of category.assignments) {
    const view = viewAssignment(assignment.earned, assignment.possible);
    const isDropped = dropped.has(category.assignments.indexOf(assignment));
    const row = el("div", { class: isDropped ? "asg is-dropped" : "asg" }, [
      labeledInput({
        label: "Assignment",
        value: assignment.name,
        focus: `asg-${assignment.id}-name`,
        className: "name",
        maxLength: 80,
        onInput: (value) => actions.patchAssignment(category.id, assignment.id, { name: value }),
      }),
      labeledInput({
        label: "Earned",
        value: assignment.earned,
        focus: `asg-${assignment.id}-earned`,
        mode: "decimal",
        maxLength: 16,
        invalid: fieldInvalid(assignment.earned),
        onInput: (value) => actions.patchAssignment(category.id, assignment.id, { earned: value }),
      }),
      labeledInput({
        label: "Possible",
        value: assignment.possible,
        focus: `asg-${assignment.id}-possible`,
        mode: "decimal",
        maxLength: 16,
        invalid: fieldInvalid(assignment.possible),
        onInput: (value) => actions.patchAssignment(category.id, assignment.id, { possible: value }),
      }),
      scoreCell(view, isDropped),
      button("Remove", {
        class: "btn remove",
        focus: `asg-${assignment.id}-remove`,
        "aria-label": assignment.name.trim()
          ? `Remove ${assignment.name.trim()}`
          : "Remove assignment",
      }, () => actions.removeAssignment(category.id, assignment.id)),
    ]);
    ledger.append(row);
  }
  if (category.assignments.length > 0) block.append(ledger);

  block.append(
    button("Add assignment", { class: "btn add-row", focus: `cat-${category.id}-add` }, () =>
      actions.addAssignment(category.id),
    ),
  );
  return block;
}

function categoryPercent(result: CategoryResult | undefined): string {
  if (!result || result.percent === null) return "—";
  return `${formatFixed(result.percent, 2)}%`;
}

function categoryStatus(category: Category, result: CategoryResult | undefined): HTMLElement | null {
  const note = categoryNote(category, result);
  if (!note) return null;
  return el("p", { class: "cat-note" }, [note]);
}

function categoryNote(category: Category, result: CategoryResult | undefined): string | null {
  if (!result || result.included) return null;
  if (result.reason === "empty") return category.assignments.length === 0 ? null : "No scores";
  if (result.reason === "all-dropped") return "All dropped";
  if (result.reason === "zero-weight") return category.weight.trim() === "" ? "No weight" : "Weight 0";
  if (result.reason === "invalid-weight") return "Not counted";
  return null;
}

function scoreCell(
  view: ReturnType<typeof viewAssignment>,
  dropped: boolean,
): HTMLElement {
  if (view.ignored) return el("p", { class: "score" }, ["Ignored"]);
  if (view.percent === null) return el("p", { class: "score" }, ["—"]);
  const text = `${formatFixed(view.percent, 2)}%`;
  if (!dropped) return el("p", { class: "score" }, [text]);
  return el("p", { class: "score" }, [
    el("span", { class: "struck" }, [text]),
    el("span", { class: "dropped-label" }, ["Dropped"]),
  ]);
}

function renderScale(gradeClass: GradeClass, actions: Actions): HTMLElement {
  const evaluated = evaluateClass(gradeClass);
  const scale = evaluated.scale;
  const cuts = scale ? letterCuts(scale) : null;
  const fields: Array<{ key: "a" | "b" | "c" | "d"; label: string }> = [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
    { key: "c", label: "C" },
    { key: "d", label: "D" },
  ];

  const grid = el("div", { class: "scale-grid" });
  for (const field of fields) {
    grid.append(
      labeledInput({
        label: field.label,
        value: gradeClass.scale[field.key],
        focus: `scale-${field.key}`,
        mode: "decimal",
        maxLength: 16,
        invalid: fieldInvalid(gradeClass.scale[field.key]),
        onInput: (value) => actions.patchScale({ [field.key]: value }),
      }),
    );
  }

  const box = el("input", {
    type: "checkbox",
    focus: "scale-plus",
    checked: gradeClass.scale.plusMinus,
  });
  box.addEventListener("change", () => actions.patchScale({ plusMinus: box.checked }));

  const section = el("section", { class: "scale", "aria-labelledby": "scale-heading" }, [
    el("h2", { id: "scale-heading" }, ["Letter grades"]),
    el("p", { class: "hint" }, [
      "A score at or above a cutoff receives that letter. Percentages round half up to two decimals first. Plus and minus split the gap up to the next cutoff into equal thirds.",
    ]),
    el("fieldset", null, [el("legend", null, ["Minimum percent"]), grid]),
    el("label", { class: "check" }, [box, el("span", null, ["Plus and minus"])]),
  ]);

  if (!scale) {
    section.append(
      el("p", { class: "banner", role: "status" }, [
        "Cutoffs must decrease from A to D and stay between 0 and 100.",
      ]),
    );
  } else if (cuts) {
    const preview = cuts.map((cut) => `${cut.letter} ${formatTrimmed(cut.min, 2)}`).join(" · ");
    section.append(el("p", { class: "cuts" }, [preview]));
  }
  return section;
}
