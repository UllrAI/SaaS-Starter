/**
 * Generate avatar URL using DiceBear API
 * @param seed - The seed for avatar generation (email, name, or any string)
 * @param style - The DiceBear avatar style (default: 'initials')
 * @returns Avatar URL
 */
import { AVATAR_STYLE } from "@/lib/config/constants";

export function generateAvatarUrl(
  seed: string,
  style: string = AVATAR_STYLE,
): string {
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodedSeed}`;
}

/**
 * Get user avatar URL with fallback to DiceBear
 * @param userImage - User's uploaded image URL
 * @param email - User's email
 * @param name - User's name
 * @param style - DiceBear avatar style
 * @returns Avatar URL
 */
export function getUserAvatarUrl(
  userImage?: string | null,
  email?: string | null,
  name?: string | null,
  style: string = AVATAR_STYLE,
): string {
  if (userImage) {
    return userImage;
  }

  const seed = email || name || "User";
  return generateAvatarUrl(seed, style);
}
