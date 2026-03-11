import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Enforce conventional types: feat fix docs style refactor perf test chore ci build revert
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "ci", "build", "revert"],
    ],
    // Subject line max 100 chars (matches Biome line width)
    "header-max-length": [2, "always", 100],
    // Subject must not end with a period
    "subject-full-stop": [2, "never", "."],
    // Subject must be in lower-case
    "subject-case": [2, "always", "lower-case"],
    // Body lines max 100 chars
    "body-max-line-length": [2, "always", 100],
  },
};

export default config;
