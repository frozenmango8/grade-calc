import { GPA_LETTERS, type CourseLevel } from "../math/gpa";
import { evaluateGpa } from "../model/evaluate";
import { fieldInvalid } from "../model/parse";
import type { AppData, Course } from "../model/types";
import type { Actions } from "./actions";
import { button, el, labeledInput } from "./dom";
import { gpaFigure } from "./messages";
import { renderSummary } from "./summary";

const LEVELS: Array<{ value: CourseLevel; label: string }> = [
  { value: "regular", label: "Regular" },
  { value: "honors", label: "Honors" },
  { value: "apib", label: "AP/IB" },
];

export function renderGpaPanel(data: AppData, actions: Actions): HTMLElement {
  const result = evaluateGpa(data.gpa);
  const panel = el("section", {
    role: "tabpanel",
    id: "panel-gpa",
    "aria-labelledby": "tab-gpa",
  }, [
    el("h2", { class: "sr-only" }, ["GPA"]),
    renderSummary(gpaFigure(result)),
  ]);

  const box = el("input", {
    type: "checkbox",
    focus: "gpa-weighted",
    checked: data.gpa.weighted,
  });
  box.addEventListener("change", () => actions.patchGpa({ weighted: box.checked }));
  panel.append(
    el("label", { class: "check" }, [box, el("span", null, ["Weighted"])]),
    el("p", { class: "hint" }, [
      "Unweighted uses a 4.0 scale, where A and A+ are both 4.0. Weighted adds 0.5 for Honors and 1.0 for AP/IB, including an F. The result rounds half up to two decimals.",
    ]),
  );

  const ledger = el("div", { class: "course-ledger" });
  if (data.gpa.courses.length > 0) {
    ledger.append(
      el("div", { class: "course-cols", "aria-hidden": "true" }, [
        el("span", null, ["Course"]),
        el("span", null, ["Credits"]),
        el("span", null, ["Grade"]),
        el("span", null, ["Level"]),
        el("span", null, [""]),
      ]),
    );
    for (const course of data.gpa.courses) ledger.append(renderCourse(course, actions));
    panel.append(ledger);
  } else {
    panel.append(el("p", { class: "hint tight" }, ["No courses yet."]));
  }
  panel.append(button("Add course", { class: "btn add-row", focus: "gpa-add" }, () => actions.addCourse()));

  panel.append(
    el("fieldset", { class: "prior" }, [
      el("legend", null, ["Prior record"]),
      el("div", { class: "prior-grid" }, [
        labeledInput({
          label: "GPA",
          value: data.gpa.priorGpa,
          focus: "gpa-prior",
          mode: "decimal",
          maxLength: 16,
          invalid: fieldInvalid(data.gpa.priorGpa),
          onInput: (value) => actions.patchGpa({ priorGpa: value }),
        }),
        labeledInput({
          label: "Credits",
          value: data.gpa.priorCredits,
          focus: "gpa-prior-credits",
          mode: "decimal",
          maxLength: 16,
          invalid: fieldInvalid(data.gpa.priorCredits),
          onInput: (value) => actions.patchGpa({ priorCredits: value }),
        }),
      ]),
      el("p", { class: "hint" }, ["Leave both blank to calculate this term only."]),
    ]),
  );
  return panel;
}

function renderCourse(course: Course, actions: Actions): HTMLElement {
  const grade = el("select", { focus: `course-${course.id}-letter` });
  for (const letter of GPA_LETTERS) {
    grade.append(el("option", { value: letter, selected: letter === course.letter }, [letter]));
  }
  grade.addEventListener("change", () => actions.patchCourse(course.id, { letter: grade.value }));

  const level = el("select", { focus: `course-${course.id}-level` });
  for (const option of LEVELS) {
    level.append(
      el("option", { value: option.value, selected: option.value === course.level }, [option.label]),
    );
  }
  level.addEventListener("change", () => {
    const value = level.value;
    if (value === "regular" || value === "honors" || value === "apib") {
      actions.patchCourse(course.id, { level: value });
    }
  });

  return el("div", { class: "course" }, [
    labeledInput({
      label: "Course",
      value: course.name,
      focus: `course-${course.id}-name`,
      className: "name",
      maxLength: 80,
      onInput: (value) => actions.patchCourse(course.id, { name: value }),
    }),
    labeledInput({
      label: "Credits",
      value: course.credits,
      focus: `course-${course.id}-credits`,
      mode: "decimal",
      maxLength: 16,
      invalid: fieldInvalid(course.credits),
      onInput: (value) => actions.patchCourse(course.id, { credits: value }),
    }),
    el("label", { class: "field" }, [el("span", { class: "field-label" }, ["Grade"]), grade]),
    el("label", { class: "field" }, [el("span", { class: "field-label" }, ["Level"]), level]),
    button("Remove", {
      class: "btn remove",
      focus: `course-${course.id}-remove`,
      "aria-label": course.name.trim() ? `Remove ${course.name.trim()}` : "Remove course",
    }, () => actions.removeCourse(course.id)),
  ]);
}
