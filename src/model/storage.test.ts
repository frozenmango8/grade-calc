import { describe, expect, it } from "vitest";
import { freshAppData } from "./defaults";
import { deserialize, serialize } from "./storage";
import type { AppData } from "./types";

function saved(): AppData {
  const data = freshAppData();
  data.theme = "dark";
  data.tab = "gpa";
  data.final = { current: "88", weight: "20", target: "90" };
  data.gpa = {
    weighted: true,
    priorGpa: "3.4",
    priorCredits: "12",
    courses: [{ id: "course-1", name: "English", credits: "3", letter: "A-", level: "honors" }],
  };
  const gradeClass = data.classes[0];
  if (!gradeClass) throw new Error("missing class");
  gradeClass.name = "History";
  return data;
}

describe("storage", () => {
  it("round-trips the saved app", () => {
    const data = saved();
    expect(deserialize(serialize(data))).toEqual(data);
  });

  it("rejects corrupt JSON and a different version", () => {
    expect(deserialize("")).toBeNull();
    expect(deserialize("{")).toBeNull();
    expect(deserialize("null")).toBeNull();
    expect(deserialize(JSON.stringify({ v: 2 }))).toBeNull();
    expect(deserialize(JSON.stringify({ v: 1, classes: "nope" }))).toBeNull();
  });

  it("drops a damaged class and keeps the rest", () => {
    const data = saved();
    const raw = JSON.parse(serialize(data)) as { classes: unknown[] };
    raw.classes.push({ id: "bad" });
    raw.classes.push({
      id: "class-2",
      name: "Art",
      scale: { a: "90", b: "80", c: "70", d: "60", plusMinus: false },
      categories: [],
    });
    const loaded = deserialize(JSON.stringify(raw));
    expect(loaded?.classes.map((item) => item.name)).toEqual(["History", "Art"]);
  });

  it("selects the first class when the active id is missing", () => {
    const data = saved();
    const raw = JSON.parse(serialize(data)) as { activeClassId: string };
    raw.activeClassId = "missing";
    const loaded = deserialize(JSON.stringify(raw));
    expect(loaded?.activeClassId).toBe(data.classes[0]?.id);
  });

  it("keeps an explicit empty class list", () => {
    const data = saved();
    data.classes = [];
    data.activeClassId = null;
    const loaded = deserialize(serialize(data));
    expect(loaded?.classes).toEqual([]);
    expect(loaded?.activeClassId).toBeNull();
    expect(loaded?.theme).toBe("dark");
  });

  it("ignores a course whose letter is not on the scale", () => {
    const data = saved();
    const raw = JSON.parse(serialize(data)) as {
      gpa: { courses: Array<{ letter: string }> };
    };
    const course = raw.gpa.courses[0];
    if (!course) throw new Error("missing course");
    course.letter = "E";
    const loaded = deserialize(JSON.stringify(raw));
    expect(loaded?.gpa.courses).toEqual([]);
    expect(loaded?.gpa.weighted).toBe(true);
  });
});
