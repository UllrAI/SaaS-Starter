const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Transform patterns for external modules
  transformIgnorePatterns: [
    "node_modules/(?!(@t3-oss/env-nextjs|@t3-oss/env-core|postgres|better-auth|better-call|uncrypto|clsx|class-variance-authority|jose|standardwebhooks|next-safe-action|nanostores)/)",
  ],

  // Coverage configuration
  coverageReporters: ["text", "lcov", "html"],

  // Exclude UI-only files and configuration files from coverage
  coveragePathIgnorePatterns: [
    // System and build files
    "node_modules/",
    "\\.next/",
    "coverage/",
    "\\.claude/",

    // Configuration files
    "jest\\.config\\.js",
    "jest\\.setup\\.ts",
    "next\\.config\\.(js|ts)",
    "tailwind\\.config\\.js",
    "postcss\\.config\\.js",
    "drizzle\\.config\\.ts",
    "keystatic\\.config\\.ts",

    // Test files
    "\\.test\\.(ts|tsx)$",
    "\\.spec\\.(ts|tsx)$",

    // Type definitions and utilities
    "types/",
    "scripts/",
    "src/database/config",

    // Static files
    "src/app/robots\\.ts",
    "src/app/sitemap\\.ts",

    // Email templates (UI-only)
    "src/emails/",

    // Pure UI components (shadcn/ui and similar)
    "src/components/ui/",

    // Theme and styling components
    "src/providers/theme-provider\\.tsx",
    "src/components/mode-toggle\\.tsx",

    // Simple utility hooks with no business logic
    "src/hooks/use-mobile\\.tsx",

    // Marketing and static page components
    "src/components/homepage/",
    "src/components/blog/",
    "src/components/logo\\.tsx",
    "src/components/cookie-consent\\.tsx",

    // Complex UI components with minimal business logic
    "src/components/payment-options\\.tsx",
    "src/components/admin/StatCard\\.tsx",
    "src/components/admin/admin-table-base\\.tsx",
    "src/components/admin/user-avatar-cell\\.tsx",
    "src/components/admin/generic-table/",
    "src/components/auth/auth-form-base\\.tsx",
    "src/components/auth/link-sent-card\\.tsx",
    "src/components/auth/social-login-buttons\\.tsx",

    // Next.js App Router pages (UI-only)
    "src/app/\\(pages\\)/", // Marketing pages
    "src/app/\\(auth\\)/", // Auth pages
    "src/app/dashboard/.*/_components/(?!session-guard)", // Dashboard UI components (except session-guard)
    "src/app/dashboard/.*/page\\.tsx", // Dashboard pages
    "src/app/keystatic/", // CMS pages

    // Layout files
    "src/app/.*/layout\\.tsx",
    "src/app/loading\\.tsx",
    "src/app/not-found\\.tsx",
    "src/app/layout\\.tsx",
  ],

  // Collect coverage from all source files
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
  ],
};

module.exports = createJestConfig(config);
