import { aiGenerationJob } from "@/lib/ai/generation-worker";
import { exampleProcessJob } from "./example";

export const jobDefinitions = [exampleProcessJob, aiGenerationJob] as const;

export const deadLetterQueueName = "jobs.dead-letter";
