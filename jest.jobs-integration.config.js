const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  testEnvironment: "node",
  testMatch: ["<rootDir>/integration/jobs/**/*.test.ts"],
  moduleNameMapper: {
    "^@/env$": "<rootDir>/env.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  maxWorkers: 1,
  testTimeout: 30000,
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
});
