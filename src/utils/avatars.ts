export type AvatarCategory = 'male' | 'female' | 'neutral';

export interface AvatarOption {
  id: string;
  label: string;
  path: string; // Relative to public root, e.g. 'avatars/male/joyB.webp'
  category: AvatarCategory;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  // Male avatars (16)
  { id: 'm-joyB', label: 'Upbeat', path: 'avatars/male/joyB.webp', category: 'male' },
  { id: 'm-affectionBr', label: 'Warm', path: 'avatars/male/affectionBr.webp', category: 'male' },
  { id: 'm-curiosityB', label: 'Curious', path: 'avatars/male/curiosityB.webp', category: 'male' },
  { id: 'm-flirtyB', label: 'Charm', path: 'avatars/male/flirtyB.webp', category: 'male' },
  { id: 'm-affectionW', label: 'Kind', path: 'avatars/male/affectionW.webp', category: 'male' },
  { id: 'm-flirtyW', label: 'Spark', path: 'avatars/male/flirtyW.webp', category: 'male' },
  { id: 'm-shyBr', label: 'Gentle', path: 'avatars/male/shyBr.webp', category: 'male' },
  { id: 'm-affection+', label: 'Bright', path: 'avatars/male/affection+.webp', category: 'male' },
  { id: 'm-affectionW+', label: 'Radiant', path: 'avatars/male/affectionW+.webp', category: 'male' },
  { id: 'm-angerB', label: 'Bold', path: 'avatars/male/angerB.webp', category: 'male' },
  { id: 'm-angerW', label: 'Fierce', path: 'avatars/male/angerW.webp', category: 'male' },
  { id: 'm-angerW+', label: 'Driven', path: 'avatars/male/angerW+.webp', category: 'male' },
  { id: 'm-angryBr', label: 'Rebel', path: 'avatars/male/angryBr.webp', category: 'male' },
  { id: 'm-disgustW', label: 'Poised', path: 'avatars/male/disgustW.webp', category: 'male' },
  { id: 'm-fearW', label: 'Dreamy', path: 'avatars/male/fearW.webp', category: 'male' },
  { id: 'm-sadW', label: 'Soulful', path: 'avatars/male/sadW.webp', category: 'male' },

  // Female avatars (16)
  { id: 'f-joyW', label: 'Radiant', path: 'avatars/female/joyW.webp', category: 'female' },
  { id: 'f-affectionBr', label: 'Warm', path: 'avatars/female/affectionBr.webp', category: 'female' },
  { id: 'f-curiosityB', label: 'Curious', path: 'avatars/female/curiosityB.webp', category: 'female' },
  { id: 'f-flirtyB', label: 'Charm', path: 'avatars/female/flirtyB.webp', category: 'female' },
  { id: 'f-shyBr', label: 'Gentle', path: 'avatars/female/shyBr.webp', category: 'female' },
  { id: 'f-surpriseW', label: 'Bright', path: 'avatars/female/surpriseW.webp', category: 'female' },
  { id: 'f-affectionW', label: 'Kind', path: 'avatars/female/affectionW.webp', category: 'female' },
  { id: 'f-joyB', label: 'Upbeat', path: 'avatars/female/joyB.webp', category: 'female' },
  { id: 'f-flirtyW', label: 'Spark', path: 'avatars/female/flirtyW.webp', category: 'female' },
  { id: 'f-surpriseBr', label: 'Wonder', path: 'avatars/female/surpriseBr.webp', category: 'female' },
  { id: 'f-angerB', label: 'Bold', path: 'avatars/female/angerB.webp', category: 'female' },
  { id: 'f-angerW', label: 'Fierce', path: 'avatars/female/angerW.webp', category: 'female' },
  { id: 'f-angryBr', label: 'Rebel', path: 'avatars/female/angryBr.webp', category: 'female' },
  { id: 'f-disgustW', label: 'Poised', path: 'avatars/female/disgustW.webp', category: 'female' },
  { id: 'f-fearW', label: 'Dreamy', path: 'avatars/female/fearW.webp', category: 'female' },
  { id: 'f-sadW', label: 'Soulful', path: 'avatars/female/sadW.webp', category: 'female' },

  // Neutral avatars (16)
  { id: 'n-butterfly', label: 'Butterfly', path: 'avatars/neutral/butterfly.webp', category: 'neutral' },
  { id: 'n-coco', label: 'Coco', path: 'avatars/neutral/coco.webp', category: 'neutral' },
  { id: 'n-cube', label: 'Cube', path: 'avatars/neutral/cube.webp', category: 'neutral' },
  { id: 'n-eyes', label: 'Eyes', path: 'avatars/neutral/eyes.webp', category: 'neutral' },
  { id: 'n-face', label: 'Face', path: 'avatars/neutral/face.webp', category: 'neutral' },
  { id: 'n-ghost', label: 'Ghost', path: 'avatars/neutral/ghost.webp', category: 'neutral' },
  { id: 'n-jojo', label: 'Jojo', path: 'avatars/neutral/jojo.webp', category: 'neutral' },
  { id: 'n-joy', label: 'Joy', path: 'avatars/neutral/joy.webp', category: 'neutral' },
  { id: 'n-leaf', label: 'Leaf', path: 'avatars/neutral/leaf.webp', category: 'neutral' },
  { id: 'n-light', label: 'Light', path: 'avatars/neutral/light.webp', category: 'neutral' },
  { id: 'n-moon', label: 'Moon', path: 'avatars/neutral/moon.webp', category: 'neutral' },
  { id: 'n-rambo', label: 'Rambo', path: 'avatars/neutral/rambo.webp', category: 'neutral' },
  { id: 'n-sixtoe', label: 'Sixtoe', path: 'avatars/neutral/sixtoe.webp', category: 'neutral' },
  { id: 'n-stone', label: 'Stone', path: 'avatars/neutral/stone.webp', category: 'neutral' },
  { id: 'n-stones', label: 'Stones', path: 'avatars/neutral/stones.webp', category: 'neutral' },
  { id: 'n-wisdom', label: 'Wisdom', path: 'avatars/neutral/wisdom.webp', category: 'neutral' },
];

export const DEFAULT_AVATAR_PATH = 'avatars/male/joyB.webp';

/**
 * Resolves an avatar path/URL safely across Vite dev, GitHub Pages (/RVStrangers/),
 * Cloudflare Worker root, and Capacitor Android WebView.
 */
export function resolveAvatarUrl(avatar?: string | null): string {
  const rawBase = import.meta.env.BASE_URL || './';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  if (!avatar) {
    return `${base}${DEFAULT_AVATAR_PATH}`;
  }
  const trimmed = avatar.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const clean = trimmed.replace(/^\.?\//, '');
  if (!clean.includes('.') && !clean.includes('/')) {
    return `${base}${DEFAULT_AVATAR_PATH}`;
  }
  return `${base}${clean}`;
}
