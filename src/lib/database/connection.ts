import env from "@/env";

/**
 * Detects if the application is running in a serverless environment
 */
function isServerlessEnvironment(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.FUNCTIONS_EMULATOR || // Google Cloud Functions
      process.env.AZURE_FUNCTIONS_ENVIRONMENT, // Azure Functions
  );
}

/**
 * Gets the appropriate database connection configuration based on the environment
 */
export function getConnectionConfig() {
  const isServerless = isServerlessEnvironment();

  if (isServerless) {
    // Serverless environment configuration
    return {
      // Maximum connections per instance (keep low for serverless)
      max: 1,

      // Close idle connections after 20 seconds
      idle_timeout: 20,

      // Maximum connection lifetime (30 minutes)
      max_lifetime: 60 * 30,

      // Connection timeout (30 seconds)
      connect_timeout: 30,

      // Enable prepared statements for performance
      prepare: true,

      // Handle connection errors gracefully
      onnotice: () => {}, // Suppress notices in production
    };
  }

  // Traditional server environment configuration
  return {
    // Higher connection pool for traditional servers
    max: env.DB_POOL_SIZE,

    // Longer idle timeout for persistent applications
    idle_timeout: env.DB_IDLE_TIMEOUT, // 5 minutes

    // Longer connection lifetime
    max_lifetime: env.DB_MAX_LIFETIME, // 4 hours

    // Connection timeout
    connect_timeout: env.DB_CONNECT_TIMEOUT,

    // Enable prepared statements
    prepare: true,

    // Transform settings (removed due to compatibility issues)
    // transform: {
    //   column: postgres.toCamel,
    //   value: postgres.fromCamel,
    // },

    // Debug mode for development
    debug: process.env.NODE_ENV === "development",

    // Handle connection errors gracefully
    onnotice: process.env.NODE_ENV === "development" ? console.log : () => {}, // Log notices in development, suppress in production
  };
}

/**
 * Gets the current environment type for logging and monitoring
 */
export function getEnvironmentType(): "serverless" | "traditional" {
  return isServerlessEnvironment() ? "serverless" : "traditional";
}

// Flag to ensure configuration is only logged once
let configValidated = false;

/**
 * Validates the database configuration
 */
export function validateDatabaseConfig(): void {
  // Only validate and log once to avoid spam
  if (configValidated) {
    return;
  }

  const config = getConnectionConfig();
  const envType = getEnvironmentType();

  console.log(`Database configuration loaded for ${envType} environment.`);
  // console.log(`- Max connections: ${config.max}`);
  // console.log(`- Idle timeout: ${config.idle_timeout}s`);
  // console.log(`- Max lifetime: ${config.max_lifetime}s`);
  // console.log(`- Connect timeout: ${config.connect_timeout}s`);

  // Warn about potential issues
  if (envType === "serverless" && config.max && config.max > 2) {
    console.warn(
      "Warning: High connection pool size detected in serverless environment",
    );
  }

  if (envType === "traditional" && config.max && config.max < 5) {
    console.warn(
      "Warning: Low connection pool size for traditional server environment",
    );
  }

  // Mark as validated to prevent repeated logging
  configValidated = true;
}

/**
 * Resets the configuration validation flag (for testing purposes)
 */
export function resetConfigValidation(): void {
  configValidated = false;
}
