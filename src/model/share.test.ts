import { describe, expect, it } from "vitest";
import { createClass } from "./defaults";
import { decodeShare, encodeShare, readShareHash, shareUrl } from "./share";
import type { GradeClass } from "./types";

function biology(): GradeClass {
  const gradeClass = createClass("Cálculo");
  gradeClass.scale.plusMinus = true;
  gradeClass.scale.a = "92";
  const homework = gradeClass.categories[0];
  if (!homework) throw new Error("missing category");
  homework.dropLowest = "1";
  homework.assignments = [{ id: "a1", name: "Tarea 1", earned: "9.5", possible: "10" }];
  return gradeClass;
}

describe("share links", () => {
  it("round-trips a class and assigns new ids", () => {
    const original = biology();
    const decoded = decodeShare(encodeShare(original));
    expect(decoded).not.toBeNull();
    if (!decoded) return;
    expect(decoded.id).not.toBe(original.id);
    expect(decoded.name).toBe("Cálculo");
    expect(decoded.scale).toEqual({ a: "92", b: "80", c: "70", d: "60", plusMinus: true });
    expect(decoded.categories.map((category) => category.name)).toEqual(["Homework", "Quizzes", "Tests"]);
    expect(decoded.categories[0]?.dropLowest).toBe("1");
    expect(decoded.categories[0]?.assignments[0]).toMatchObject({
      name: "Tarea 1",
      earned: "9.5",
      possible: "10",
    });
    expect(decoded.categories[0]?.assignments[0]?.id).not.toBe("a1");
  });

  it("builds a url whose hash loads the same class", () => {
    const original = biology();
    const url = shareUrl("https://frozenmango8.github.io/grade-calc/", original);
    const hash = new URL(url).hash;
    const read = readShareHash(hash);
    expect(read?.cls?.name).toBe("Cálculo");
    expect(readShareHash("")).toBeNull();
    expect(readShareHash("#other")).toBeNull();
  });

  it("rejects a damaged payload, a bad version, and a payload that is not a class", () => {
    expect(decodeShare("not base64!!")).toBeNull();
    expect(decodeShare("")).toBeNull();
    expect(readShareHash("#c=%%%%")).toEqual({ cls: null });

    const encoded = encodeShare(biology());
    const bytes = Uint8Array.from(atob(encoded.replaceAll("-", "+").replaceAll("_", "/")), (char) =>
      char.charCodeAt(0),
    );
    const body = JSON.parse(new TextDecoder().decode(bytes)) as { v: number };
    body.v = 2;
    const rewritten = btoa(JSON.stringify(body)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
    expect(decodeShare(rewritten)).toBeNull();
  });
});
