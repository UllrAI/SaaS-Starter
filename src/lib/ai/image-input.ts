export const AI_IMAGE_INPUT_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const AI_IMAGE_INPUT_MAX_FILES = 6;

export function isAiImageInputMediaType(
  value: string,
): value is (typeof AI_IMAGE_INPUT_MEDIA_TYPES)[number] {
  return AI_IMAGE_INPUT_MEDIA_TYPES.some((mediaType) => mediaType === value);
}
