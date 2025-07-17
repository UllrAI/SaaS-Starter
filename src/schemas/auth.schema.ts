import { z } from "zod";
import MailChecker from "mailchecker";

// Unified auth schema for magic link authentication
export const authSchema = z.object({
  email: z
    .string()
    .trim() // Remove leading/trailing whitespace
    .toLowerCase() // Normalize to lowercase
    .email({ message: "Please enter a valid email address" })
    .refine(MailChecker.isValid, {
      message: "This email provider is not allowed.",
    }),
});
