import { exampleProcessJob } from "./example";

export const jobDefinitions = [exampleProcessJob] as const;

export const deadLetterQueueName = "jobs.dead-letter";
