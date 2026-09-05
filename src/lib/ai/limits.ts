export const AI_RUN_TIMEOUT_MS = 3 * 60 * 1000;
export const AI_MAX_STEPS = 5;
export const AI_MAX_OUTPUT_TOKENS = 4096;
export const AI_MAX_CONTEXT_BYTES = 64 * 1024;
// Reserve a conservative allowance for repeated context and intermediate tools.
// Unknown provider usage retains this reservation instead of becoming free.
export const AI_RUN_TOKEN_RESERVATION = 400_000;
