const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(@t3-oss/env-nextjs|@t3-oss/env-core|postgres|better-auth|better-call|uncrypto|clsx|class-variance-authority|jose|standardwebhooks|next-safe-action|nanostores)/)"
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
    "!**/components/auth/auth-form-base.tsx", // Base UI component with minimal logic
    "!**/components/auth/link-sent-card.tsx", // Pure UI component
    "!**/components/auth/social-login-buttons.tsx", // UI interaction component
    "!**/app/(pages)/**", // Exclude all pages under app/(pages)
    "!**/app/(auth)/**", // Exclude auth pages (mostly UI)
    "!**/app/dashboard/**/page.tsx", // Exclude dashboard page components
    "!**/app/**/layout.tsx", // Exclude layout components
    "!**/app/loading.tsx",
    "!**/app/not-found.tsx",
    "!**/app/layout.tsx", // Main layout
    "!**/emails/**", // Email templates
    "!**/providers/theme-provider.tsx",
    "!**/hooks/use-mobile.tsx", // Simple hook
    "!**/components/cookie-consent.tsx", // UI component
  ],
  coverageReporters: ["text", "lcov", "html"]
};

module.exports = createJestConfig(config);
