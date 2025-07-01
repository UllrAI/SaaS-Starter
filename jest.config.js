const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(@t3-oss/env-nextjs|@t3-oss/env-core|postgres|better-auth|better-call|uncrypto|clsx|class-variance-authority|jose|standardwebhooks|next-safe-action)/)"
  ],
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/.claude/**",
    "!**/jest.config.js",
    "!**/jest.setup.ts",
    "!**/next.config.js", 
    "!**/tailwind.config.js",
    "!**/postcss.config.js",
    "!**/drizzle.config.ts",
    "!**/keystatic.config.ts",
    "!**/*.test.{ts,tsx}",
    "!**/types/**",
    "!**/scripts/**",
    "!**/database/config*.ts",
    "!**/app/robots.ts",
    "!**/app/sitemap.ts",
    // Pure UI-only components exclusions (no business logic)
    "!**/components/ui/**", // Exclude all components under components/ui
    "!**/components/homepage/**",
    "!**/components/blog/**",
    "!**/components/logo.tsx",
    "!**/app/(pages)/**", // Exclude all pages under app/(pages)
    "!**/app/loading.tsx",
    "!**/app/not-found.tsx",
    "!**/providers/theme-provider.tsx"
  ],
  coverageReporters: ["text", "lcov", "html"]
};

module.exports = createJestConfig(config);
