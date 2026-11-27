import { letterCuts } from "../math/letter";
import { createAssignment, createCategory, createClass, createCourse, freshAppData } from "../model/defaults";
import { evaluateClass, readScale } from "../model/evaluate";
import { readShareHash, shareUrl } from "../model/share";
import type { AppData, GradeClass, Tab } from "../model/types";
import type { Actions, UiState } from "./actions";
import { renderClassPanel } from "./classPanel";
import { button, el } from "./dom";
import { renderFinalPanel } from "./finalPanel";
import { formatTrimmed } from "./format";
import { renderGpaPanel } from "./gpaPanel";
import { loadApp, saveApp } from "./persist";
import { appliedTheme, applyTheme, watchSystemTheme } from "./theme";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "class", label: "Class grade" },
  { id: "final", label: "Final exam" },
  { id: "gpa", label: "GPA" },
];

export function mount(root: HTMLElement): void {
  let data = loadApp() ?? freshAppData();
  let ui: UiState = { notice: "", deleteArmed: false, shareFallback: "" };
  let pendingFocus: string | null = null;
  let noticeTimer = 0;

  const shared = readShareHash(location.hash);
  if (shared) {
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    if (shared.cls) {
      data = {
        ...data,
        tab: "class",
        classes: [...data.classes, shared.cls],
        activeClassId: shared.cls.id,
      };
      ui = { ...ui, notice: "Saved the class from this link." };
      saveApp(data);
    } else {
      ui = { ...ui, notice: "This link does not contain a class." };
    }
  }

  const actions: Actions = {
    setTab(tab) {
      pendingFocus = `tab-${tab}`;
      if (tab === data.tab) {
        paint();
        return;
      }
      commit({ ...data, tab });
    },
    toggleTheme() {
      const next = appliedTheme(data.theme) === "dark" ? "light" : "dark";
      commit({ ...data, theme: next }, "theme");
    },
    selectClass(id) {
      commit({ ...data, activeClassId: id }, "class-select");
    },
    addClass() {
      const created = createClass();
      commit(
        { ...data, tab: "class", classes: [...data.classes, created], activeClassId: created.id },
        "class-name",
      );
    },
    renameClass(name) {
      editActive((gradeClass) => ({ ...gradeClass, name }));
    },
    armDelete() {
      if (!data.activeClassId) return;
      if (ui.deleteArmed) {
        const id = data.activeClassId;
        const index = data.classes.findIndex((item) => item.id === id);
        const classes = data.classes.filter((item) => item.id !== id);
        const neighbor = classes[index] ?? classes[index - 1] ?? null;
        commit({ ...data, classes, activeClassId: neighbor?.id ?? null });
        return;
      }
      ui = { ...ui, deleteArmed: true };
      pendingFocus = "delete-class";
      paint();
    },
    copyLink() {
      const gradeClass = activeClass();
      if (!gradeClass) return;
      void writeLink(gradeClass);
    },
    addCategory() {
      const category = createCategory("", "");
      editActive(
        (gradeClass) => ({ ...gradeClass, categories: [...gradeClass.categories, category] }),
        `cat-${category.id}-name`,
      );
    },
    patchCategory(id, patch) {
      editActive((gradeClass) => ({
        ...gradeClass,
        categories: gradeClass.categories.map((category) =>
          category.id === id ? { ...category, ...patch } : category,
        ),
      }));
    },
    removeCategory(id) {
      editActive((gradeClass) => ({
        ...gradeClass,
        categories: gradeClass.categories.filter((category) => category.id !== id),
      }));
    },
    addAssignment(categoryId) {
      const assignment = createAssignment();
      editActive(
        (gradeClass) => ({
          ...gradeClass,
          categories: gradeClass.categories.map((category) =>
            category.id === categoryId
              ? { ...category, assignments: [...category.assignments, assignment] }
              : category,
          ),
        }),
        `asg-${assignment.id}-name`,
      );
    },
    patchAssignment(categoryId, assignmentId, patch) {
      editActive((gradeClass) => ({
        ...gradeClass,
        categories: gradeClass.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                assignments: category.assignments.map((assignment) =>
                  assignment.id === assignmentId ? { ...assignment, ...patch } : assignment,
                ),
              }
            : category,
        ),
      }));
    },
    removeAssignment(categoryId, assignmentId) {
      editActive((gradeClass) => ({
        ...gradeClass,
        categories: gradeClass.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                assignments: category.assignments.filter((assignment) => assignment.id !== assignmentId),
              }
            : category,
        ),
      }));
    },
    patchScale(patch) {
      editActive((gradeClass) => ({ ...gradeClass, scale: { ...gradeClass.scale, ...patch } }));
    },
    patchFinal(patch) {
      commit({ ...data, final: { ...data.final, ...patch } });
    },
    useClassGrade() {
      const gradeClass = activeClass();
      if (!gradeClass) return;
      const rounded = evaluateClass(gradeClass).grade.rounded;
      if (rounded === null) return;
      commit({ ...data, final: { ...data.final, current: formatTrimmed(rounded, 2) } }, "final-current");
    },
    setTargetFromLetter(letter) {
      const gradeClass = activeClass();
      const scale = gradeClass ? readScale(gradeClass.scale) : null;
      const cut = scale ? letterCuts(scale)?.find((item) => item.letter === letter) : undefined;
      if (!cut) return;
      commit({ ...data, final: { ...data.final, target: formatTrimmed(cut.min, 2) } }, "final-target");
    },
    patchGpa(patch) {
      commit({ ...data, gpa: { ...data.gpa, ...patch } });
    },
    addCourse() {
      const course = createCourse();
      commit(
        { ...data, gpa: { ...data.gpa, courses: [...data.gpa.courses, course] } },
        `course-${course.id}-name`,
      );
    },
    patchCourse(id, patch) {
      commit({
        ...data,
        gpa: {
          ...data.gpa,
          courses: data.gpa.courses.map((course) => (course.id === id ? { ...course, ...patch } : course)),
        },
      });
    },
    removeCourse(id) {
      commit({
        ...data,
        gpa: { ...data.gpa, courses: data.gpa.courses.filter((course) => course.id !== id) },
      });
    },
  };

  function activeClass(): GradeClass | null {
    return data.classes.find((item) => item.id === data.activeClassId) ?? null;
  }

  function editActive(recipe: (gradeClass: GradeClass) => GradeClass, focus?: string): void {
    const id = data.activeClassId;
    commit(
      {
        ...data,
        classes: data.classes.map((item) => (item.id === id ? recipe(item) : item)),
      },
      focus,
    );
  }

  function commit(next: AppData, focus?: string): void {
    data = next;
    window.clearTimeout(noticeTimer);
    ui = { notice: "", deleteArmed: false, shareFallback: "" };
    if (focus) pendingFocus = focus;
    saveApp(data);
    paint();
  }

  function flash(message: string): void {
    ui = { ...ui, notice: message };
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => {
      if (ui.notice !== message) return;
      ui = { ...ui, notice: "" };
      paint();
    }, 4000);
    paint();
  }

  async function writeLink(gradeClass: GradeClass): Promise<void> {
    const url = shareUrl(location.href, gradeClass);
    ui = { ...ui, deleteArmed: false };
    try {
      await navigator.clipboard.writeText(url);
      ui = { ...ui, shareFallback: "" };
      flash("Link copied.");
    } catch {
      ui = { ...ui, shareFallback: url };
      pendingFocus = "share-fallback";
      flash("Clipboard is unavailable. Copy the link below.");
    }
  }

  function paint(): void {
    const active = document.activeElement;
    const previousKey = active instanceof HTMLElement ? (active.dataset.focus ?? null) : null;
    let selection: { start: number; end: number } | null = null;
    if (!pendingFocus && active instanceof HTMLInputElement && active.type === "text" && !active.readOnly) {
      selection = {
        start: active.selectionStart ?? active.value.length,
        end: active.selectionEnd ?? active.value.length,
      };
    }
    const focusKey = pendingFocus ?? previousKey;
    pendingFocus = null;

    applyTheme(data.theme);
    root.replaceChildren(renderPage(data, ui, actions));

    if (!focusKey) return;
    const next = root.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focusKey)}"]`);
    if (!next) return;
    next.focus();
    if (!(next instanceof HTMLInputElement)) return;
    if (next.readOnly) {
      next.select();
      return;
    }
    if (selection && previousKey === focusKey) next.setSelectionRange(selection.start, selection.end);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !ui.deleteArmed) return;
    ui = { ...ui, deleteArmed: false };
    pendingFocus = "delete-class";
    paint();
  });

  watchSystemTheme(() => {
    if (data.theme === null) paint();
  });

  paint();
}

function renderPage(data: AppData, ui: UiState, actions: Actions): HTMLElement {
  const page = el("div", { class: "page" }, [
    el("a", { class: "skip", href: "#calculator" }, ["Skip to calculator"]),
    renderHeader(data, actions),
    renderTabs(data.tab, actions),
  ]);

  if (ui.notice) page.append(el("p", { class: "status", role: "status" }, [ui.notice]));
  if (ui.shareFallback) {
    page.append(
      el("input", {
        class: "share-fallback",
        type: "text",
        readonly: true,
        value: ui.shareFallback,
        focus: "share-fallback",
        "aria-label": "Share link",
      }),
    );
  }

  const main = el("main", { id: "calculator" });
  if (data.tab === "class") main.append(renderClassPanel(data, ui, actions));
  else if (data.tab === "final") main.append(renderFinalPanel(data, actions));
  else main.append(renderGpaPanel(data, actions));
  page.append(main);
  page.append(
    el("footer", { class: "colophon" }, [
      "Saved in this browser. A shared link contains one class and nothing else.",
    ]),
  );
  return page;
}

function renderHeader(data: AppData, actions: Actions): HTMLElement {
  const dark = appliedTheme(data.theme) === "dark";
  return el("header", { class: "mast" }, [
    el("div", null, [
      el("h1", { class: "wordmark" }, ["Grade Calc"]),
      el("p", { class: "tagline" }, ["Weighted grades, finals, and GPA."]),
    ]),
    button(dark ? "Light mode" : "Dark mode", {
      class: "btn",
      focus: "theme",
      "aria-pressed": dark ? "true" : "false",
    }, () => actions.toggleTheme()),
  ]);
}

function renderTabs(active: Tab, actions: Actions): HTMLElement {
  const list = el("div", { class: "tabs", role: "tablist", "aria-label": "Calculators" });
  for (const tab of TABS) {
    const selected = tab.id === active;
    list.append(
      button(tab.label, {
        class: "tab",
        role: "tab",
        id: `tab-${tab.id}`,
        focus: `tab-${tab.id}`,
        "aria-selected": selected ? "true" : "false",
        "aria-controls": `panel-${tab.id}`,
        tabindex: selected ? "0" : "-1",
      }, () => actions.setTab(tab.id)),
    );
  }
  list.addEventListener("keydown", (event) => {
    const index = TABS.findIndex((tab) => tab.id === active);
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % TABS.length
        : event.key === "ArrowLeft"
          ? (index - 1 + TABS.length) % TABS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? TABS.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    const tab = TABS[next];
    if (tab) actions.setTab(tab.id);
  });
  return list;
}
