export interface AvatarOption {
  id: string;
  label: string;
  path: string; // Relative to public root, e.g. 'avatars/female/joyW.webp'
  category: 'female' | 'male';
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'joyW', label: 'Radiant', path: 'avatars/female/joyW.webp', category: 'female' },
  { id: 'affectionBr', label: 'Warm', path: 'avatars/female/affectionBr.webp', category: 'female' },
  { id: 'curiosityB', label: 'Curious', path: 'avatars/female/curiosityB.webp', category: 'female' },
  { id: 'flirtyB', label: 'Charm', path: 'avatars/female/flirtyB.webp', category: 'female' },
  { id: 'shyBr', label: 'Gentle', path: 'avatars/female/shyBr.webp', category: 'female' },
  { id: 'surpriseW', label: 'Bright', path: 'avatars/female/surpriseW.webp', category: 'female' },
  { id: 'affectionW', label: 'Kind', path: 'avatars/female/affectionW.webp', category: 'female' },
  { id: 'joyB', label: 'Upbeat', path: 'avatars/female/joyB.webp', category: 'female' },
  { id: 'flirtyW', label: 'Spark', path: 'avatars/female/flirtyW.webp', category: 'female' },
  { id: 'surpriseBr', label: 'Wonder', path: 'avatars/female/surpriseBr.webp', category: 'female' },
  { id: 'angerB', label: 'Bold', path: 'avatars/female/angerB.webp', category: 'female' },
  { id: 'angerW', label: 'Fierce', path: 'avatars/female/angerW.webp', category: 'female' },
  { id: 'angryBr', label: 'Rebel', path: 'avatars/female/angryBr.webp', category: 'female' },
  { id: 'curiosityW', label: 'Poised', path: 'avatars/female/disgustW.webp', category: 'female' },
  { id: 'fearW', label: 'Dreamy', path: 'avatars/female/fearW.webp', category: 'female' },
  { id: 'sadW', label: 'Soulful', path: 'avatars/female/sadW.webp', category: 'female' },
];

export const DEFAULT_AVATAR_PATH = 'avatars/female/joyW.webp';

/**
 * Resolves an avatar path/URL safely across Vite dev, GitHub Pages (/RVStrangers/),
 * Cloudflare Worker root, and Capacitor Android WebView.
 */
export function resolveAvatarUrl(avatar?: string | null): string {
  if (!avatar) {
    const rawBase = import.meta.env.BASE_URL || './';
    const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
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
  // Normalize leading ./ or /
  const clean = trimmed.replace(/^\.?\//, '');
  if (!clean.includes('.') && !clean.includes('/')) {
    // Legacy emoji avatar stored previously -> fall back cleanly to default image avatar
    const rawBase = import.meta.env.BASE_URL || './';
    const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
    return `${base}${DEFAULT_AVATAR_PATH}`;
  }
  const rawBase = import.meta.env.BASE_URL || './';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  return `${base}${clean}`;
}
