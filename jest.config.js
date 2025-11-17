const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // 提供 Next.js 应用的路径，以便在测试环境中加载 next.config.js 和 .env 文件
  dir: "./",
});

// 添加自定义的 Jest 配置
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  coverageProvider: "v8",
  globalSetup: "<rootDir>/jest.global-setup.js",
  moduleNameMapper: {
    // 处理 tsconfig.json 中那些不符合通用模式的特定别名
    "^@/env$": "<rootDir>/env.js",
    "^@/keystatic.config$": "<rootDir>/keystatic.config.ts",
    // 处理模块别名 (这部分很快会被 next/jest 自动配置)
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  // 如果你有名为 "email.test.tsx.disabled" 的文件，添加这一行来忽略它
  modulePathIgnorePatterns: ["<rootDir>/src/lib/email.test.tsx.disabled"],
};

// createJestConfig 以这种方式导出，是为了确保 next/jest 可以加载异步的 Next.js 配置
module.exports = createJestConfig(customJestConfig);
