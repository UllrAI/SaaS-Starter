const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@t3-oss/env-nextjs$": "<rootDir>/__mocks__/@t3-oss/env-nextjs.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  
  transformIgnorePatterns: [
    "/node_modules/(?!@t3-oss/env-nextjs|@t3-oss/env-core)",
  ],
};

module.exports = createJestConfig(config);
