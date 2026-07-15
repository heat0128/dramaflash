export const PUBLIC_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'ko', label: 'Korean', native: '한국어' },
  { code: 'th', label: 'Thai', native: 'ไทย' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' }
] as const

export const ADMIN_LANGUAGES = [
  ...PUBLIC_LANGUAGES,
  { code: 'zh', label: 'Chinese', native: '中文' }
] as const

export const LANGUAGES = PUBLIC_LANGUAGES
export const DEFAULT_LANGUAGE: LangCode = 'en'

export type LangCode = (typeof PUBLIC_LANGUAGES)[number]['code']
export type AdminLangCode = (typeof ADMIN_LANGUAGES)[number]['code']

export function isPublicLanguage(value: string): value is LangCode {
  return PUBLIC_LANGUAGES.some((language) => language.code === value)
}

export function langLabel(code: string) {
  return ADMIN_LANGUAGES.find((language) => language.code === code)?.native || code
}
