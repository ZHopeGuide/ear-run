const KEY = 'ear-run:name';

export function getSavedName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(KEY) ?? '';
}

export function saveName(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, name);
}
