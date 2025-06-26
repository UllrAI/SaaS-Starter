
import { generateAvatarUrl, getUserAvatarUrl } from './avatar';
import { AVATAR_STYLE } from '@/lib/config/constants';

describe('generateAvatarUrl', () => {
  it('should generate a valid DiceBear URL with the default style', () => {
    const seed = 'test@example.com';
    const expectedUrl = `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;
    expect(generateAvatarUrl(seed)).toBe(expectedUrl);
  });

  it('should generate a valid DiceBear URL with a custom style', () => {
    const seed = 'custom-seed';
    const style = 'adventurer';
    const expectedUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
    expect(generateAvatarUrl(seed, style)).toBe(expectedUrl);
  });

  it('should properly encode the seed', () => {
    const seed = 'a seed with spaces';
    const expectedUrl = `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=a%20seed%20with%20spaces`;
    expect(generateAvatarUrl(seed)).toBe(expectedUrl);
  });
});

describe('getUserAvatarUrl', () => {
  const userImage = 'https://example.com/user.png';
  const email = 'test@example.com';
  const name = 'Test User';

  it('should return the user image if available', () => {
    expect(getUserAvatarUrl(userImage, email, name)).toBe(userImage);
  });

  it('should return a generated avatar URL with email as seed if user image is not available', () => {
    const expectedUrl = generateAvatarUrl(email);
    expect(getUserAvatarUrl(null, email, name)).toBe(expectedUrl);
  });

  it('should return a generated avatar URL with name as seed if user image and email are not available', () => {
    const expectedUrl = generateAvatarUrl(name);
    expect(getUserAvatarUrl(null, null, name)).toBe(expectedUrl);
  });

  it('should return a generated avatar URL with "User" as seed if user image, email, and name are not available', () => {
    const expectedUrl = generateAvatarUrl('User');
    expect(getUserAvatarUrl(null, null, null)).toBe(expectedUrl);
  });

  it('should use a custom style if provided', () => {
    const style = 'pixel-art';
    const expectedUrl = generateAvatarUrl(email, style);
    expect(getUserAvatarUrl(null, email, name, style)).toBe(expectedUrl);
  });
});
