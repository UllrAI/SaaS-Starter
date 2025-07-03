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
  
  // Transform patterns for external modules
  transformIgnorePatterns: [
    "node_modules/(?!(@t3-oss/env-nextjs|@t3-oss/env-core|postgres|better-auth|better-call|uncrypto|clsx|class-variance-authority|jose|standardwebhooks|next-safe-action|nanostores)/)"
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
    "database/config",
    
    // Static files
    "app/robots\\.ts",
    "app/sitemap\\.ts",
    
    // Email templates (UI-only)
    "emails/",
    
    // Pure UI components (shadcn/ui and similar)
    "components/ui/",
    
    // Theme and styling components
    "providers/theme-provider\\.tsx",
    "components/mode-toggle\\.tsx",
    
    // Simple utility hooks with no business logic
    "hooks/use-mobile\\.tsx",
    
    // Marketing and static page components
    "components/homepage/",
    "components/blog/",
    "components/logo\\.tsx",
    "components/cookie-consent\\.tsx",
    
    // Complex UI components with minimal business logic
    "components/payment-options\\.tsx",
    "components/admin/StatCard\\.tsx",
    "components/admin/admin-table-base\\.tsx",
    "components/admin/user-avatar-cell\\.tsx",
    "components/admin/generic-table/",
    "components/auth/auth-form-base\\.tsx",
    "components/auth/link-sent-card\\.tsx",
    "components/auth/social-login-buttons\\.tsx",
    
    // Next.js App Router pages (UI-only)
    "app/\\(pages\\)/",           // Marketing pages
    "app/\\(auth\\)/",            // Auth pages  
    "app/dashboard/.*/_components/", // Dashboard UI components
    "app/dashboard/.*/page\\.tsx",   // Dashboard pages
    "app/keystatic/",            // CMS pages
    
    // Layout files
    "app/.*/layout\\.tsx",
    "app/loading\\.tsx",
    "app/not-found\\.tsx",
    "app/layout\\.tsx",
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