import { z } from "zod";

const mediaUrlSchema = z
  .string()
  .url()
  .max(8_192)
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  }, "Media URL must use HTTP or HTTPS.");

export const artifactSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("markdown"),
    title: z.string().trim().min(1).max(120),
    content: z.string().trim().min(1).max(100_000),
  }),
  z.object({
    kind: z.enum(["image", "video"]),
    title: z.string().trim().min(1).max(120),
    url: mediaUrlSchema,
    description: z.string().trim().max(500).optional(),
  }),
]);
