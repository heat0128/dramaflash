// The 10 languages BingeGo supports (UI + subtitles).
export const LANGUAGES = [
  { code: 'en',      label: 'English',             native: 'English' },
  { code: 'es',      label: 'Spanish',             native: 'Español' },
  { code: 'pt',      label: 'Portuguese',          native: 'Português' },
  { code: 'fr',      label: 'French',              native: 'Français' },
  { code: 'ja',      label: 'Japanese',            native: '日本語' },
  { code: 'ko',      label: 'Korean',              native: '한국어' },
  { code: 'vi',      label: 'Vietnamese',          native: 'Tiếng Việt' },
  { code: 'ms',      label: 'Malay',               native: 'Bahasa Melayu' },
  { code: 'id',      label: 'Indonesian',          native: 'Bahasa Indonesia' },
  { code: 'zh-Hant', label: 'Traditional Chinese', native: '繁體中文' }
] as const

export type LangCode = typeof LANGUAGES[number]['code']

export function langLabel(code: string) {
  return LANGUAGES.find(l => l.code === code)?.native || code
}
