import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/grade-calc/",
  test: {
    include: ["src/**/*.test.ts"],
  },
});
