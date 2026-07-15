'use client'

import { createContext, useContext, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DEFAULT_LANGUAGE, LANGUAGES, isPublicLanguage, type LangCode } from '@/lib/languages'

const STORAGE_KEY = 'dramaflash_locale'

const messages = {
  en: {
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.wallet': 'Wallet',
    'nav.me': 'Me',
    'profile.language': 'Language',
    'profile.getVip': 'Get VIP',
    'profile.favorites': 'My Favorites',
    'profile.history': 'Watch History',
    'profile.billing': 'Billing',
    'profile.help': 'Help & Feedback',
    'profile.settings': 'Settings',
    'home.continueWatching': 'Continue Watching',
    'home.trending': 'Trending',
    'home.new': 'New',
    'home.popular': 'Popular',
    'home.recommended': 'Recommended',
    'home.latest': 'Latest',
    'home.noDramas': 'No dramas yet',
    'player.subtitles': 'Subtitles',
    'player.off': 'Off',
    'player.fullscreen': 'Full screen',
    'player.rotate': 'Rotate',
    'category.romance': 'Romance',
    'category.billionaire': 'Billionaire',
    'category.comedy': 'Comedy',
    'category.revenge': 'Revenge',
    'category.mafia': 'Mafia',
    'category.fantasy': 'Fantasy',
    'category.werewolf': 'Werewolf',
    'category.family': 'Family',
    'category.christian': 'Christian',
    'category.drama': 'Drama'
  },
  ja: {
    'nav.home': 'ホーム',
    'nav.discover': '探す',
    'nav.wallet': 'ウォレット',
    'nav.me': 'マイページ',
    'profile.language': '言語',
    'profile.getVip': 'VIPになる',
    'profile.favorites': 'お気に入り',
    'profile.history': '視聴履歴',
    'profile.billing': 'お支払い',
    'profile.help': 'ヘルプ',
    'profile.settings': '設定',
    'home.continueWatching': '続きから見る',
    'home.trending': 'トレンド',
    'home.new': '新着',
    'home.popular': '人気',
    'home.recommended': 'おすすめ',
    'home.latest': '最新',
    'home.noDramas': '作品はまだありません',
    'player.subtitles': '字幕',
    'player.off': 'オフ',
    'player.fullscreen': '全画面',
    'player.rotate': '回転',
    'category.romance': 'ロマンス',
    'category.billionaire': '億万長者',
    'category.comedy': 'コメディ',
    'category.revenge': '復讐',
    'category.mafia': 'マフィア',
    'category.fantasy': 'ファンタジー',
    'category.werewolf': 'ウェアウルフ',
    'category.family': '家族',
    'category.christian': 'クリスチャン',
    'category.drama': 'ドラマ'
  },
  ko: {
    'nav.home': '홈',
    'nav.discover': '둘러보기',
    'nav.wallet': '지갑',
    'nav.me': '마이',
    'profile.language': '언어',
    'profile.getVip': 'VIP 가입',
    'profile.favorites': '내 찜',
    'profile.history': '시청 기록',
    'profile.billing': '결제',
    'profile.help': '도움말',
    'profile.settings': '설정',
    'home.continueWatching': '이어보기',
    'home.trending': '인기 급상승',
    'home.new': '신작',
    'home.popular': '인기',
    'home.recommended': '추천',
    'home.latest': '최신',
    'home.noDramas': '아직 작품이 없습니다',
    'player.subtitles': '자막',
    'player.off': '끄기',
    'player.fullscreen': '전체 화면',
    'player.rotate': '회전',
    'category.romance': '로맨스',
    'category.billionaire': '재벌',
    'category.comedy': '코미디',
    'category.revenge': '복수',
    'category.mafia': '마피아',
    'category.fantasy': '판타지',
    'category.werewolf': '늑대인간',
    'category.family': '가족',
    'category.christian': '기독교',
    'category.drama': '드라마'
  },
  th: {
    'nav.home': 'หน้าแรก',
    'nav.discover': 'ค้นหา',
    'nav.wallet': 'กระเป๋าเงิน',
    'nav.me': 'ฉัน',
    'profile.language': 'ภาษา',
    'profile.getVip': 'สมัคร VIP',
    'profile.favorites': 'รายการโปรด',
    'profile.history': 'ประวัติการรับชม',
    'profile.billing': 'การชำระเงิน',
    'profile.help': 'ช่วยเหลือ',
    'profile.settings': 'การตั้งค่า',
    'home.continueWatching': 'ดูต่อ',
    'home.trending': 'กำลังมาแรง',
    'home.new': 'ใหม่',
    'home.popular': 'ยอดนิยม',
    'home.recommended': 'แนะนำ',
    'home.latest': 'ล่าสุด',
    'home.noDramas': 'ยังไม่มีละคร',
    'player.subtitles': 'คำบรรยาย',
    'player.off': 'ปิด',
    'player.fullscreen': 'เต็มหน้าจอ',
    'player.rotate': 'หมุน',
    'category.romance': 'โรแมนติก',
    'category.billionaire': 'มหาเศรษฐี',
    'category.comedy': 'ตลก',
    'category.revenge': 'แก้แค้น',
    'category.mafia': 'มาเฟีย',
    'category.fantasy': 'แฟนตาซี',
    'category.werewolf': 'มนุษย์หมาป่า',
    'category.family': 'ครอบครัว',
    'category.christian': 'คริสเตียน',
    'category.drama': 'ดราม่า'
  },
  vi: {
    'nav.home': 'Trang chủ',
    'nav.discover': 'Khám phá',
    'nav.wallet': 'Ví',
    'nav.me': 'Tôi',
    'profile.language': 'Ngôn ngữ',
    'profile.getVip': 'Đăng ký VIP',
    'profile.favorites': 'Yêu thích',
    'profile.history': 'Lịch sử xem',
    'profile.billing': 'Thanh toán',
    'profile.help': 'Trợ giúp',
    'profile.settings': 'Cài đặt',
    'home.continueWatching': 'Xem tiếp',
    'home.trending': 'Thịnh hành',
    'home.new': 'Mới',
    'home.popular': 'Phổ biến',
    'home.recommended': 'Đề xuất',
    'home.latest': 'Mới nhất',
    'home.noDramas': 'Chưa có phim',
    'player.subtitles': 'Phụ đề',
    'player.off': 'Tắt',
    'player.fullscreen': 'Toàn màn hình',
    'player.rotate': 'Xoay',
    'category.romance': 'Lãng mạn',
    'category.billionaire': 'Tỷ phú',
    'category.comedy': 'Hài',
    'category.revenge': 'Báo thù',
    'category.mafia': 'Mafia',
    'category.fantasy': 'Kỳ ảo',
    'category.werewolf': 'Người sói',
    'category.family': 'Gia đình',
    'category.christian': 'Cơ Đốc',
    'category.drama': 'Tâm lý'
  },
  id: {
    'nav.home': 'Beranda',
    'nav.discover': 'Jelajahi',
    'nav.wallet': 'Dompet',
    'nav.me': 'Saya',
    'profile.language': 'Bahasa',
    'profile.getVip': 'Dapatkan VIP',
    'profile.favorites': 'Favorit Saya',
    'profile.history': 'Riwayat Tontonan',
    'profile.billing': 'Tagihan',
    'profile.help': 'Bantuan',
    'profile.settings': 'Pengaturan',
    'home.continueWatching': 'Lanjutkan Menonton',
    'home.trending': 'Sedang Tren',
    'home.new': 'Baru',
    'home.popular': 'Populer',
    'home.recommended': 'Rekomendasi',
    'home.latest': 'Terbaru',
    'home.noDramas': 'Belum ada drama',
    'player.subtitles': 'Subtitle',
    'player.off': 'Mati',
    'player.fullscreen': 'Layar penuh',
    'player.rotate': 'Putar',
    'category.romance': 'Romansa',
    'category.billionaire': 'Miliarder',
    'category.comedy': 'Komedi',
    'category.revenge': 'Balas Dendam',
    'category.mafia': 'Mafia',
    'category.fantasy': 'Fantasi',
    'category.werewolf': 'Manusia Serigala',
    'category.family': 'Keluarga',
    'category.christian': 'Kristen',
    'category.drama': 'Drama'
  }
} satisfies Record<LangCode, Record<string, string>>

export type TranslationKey = keyof (typeof messages)['en']
type ContextValue = { lang: LangCode; t: (key: TranslationKey) => string }
const I18nContext = createContext<ContextValue | null>(null)

export function getSavedLang(): LangCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  const pathLocale = window.location.pathname.split('/')[1]
  if (isPublicLanguage(pathLocale)) return pathLocale
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored && isPublicLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

export function LanguageProvider({
  children,
  initialLanguage = DEFAULT_LANGUAGE
}: {
  children: React.ReactNode
  initialLanguage?: LangCode
}) {
  const value = useMemo<ContextValue>(() => {
    const dictionary = messages[initialLanguage] || messages.en
    return {
      lang: initialLanguage,
      t: (key) => dictionary[key] || messages.en[key] || key
    }
  }, [initialLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    return { lang: DEFAULT_LANGUAGE, t: (key: TranslationKey) => messages.en[key] || key }
  }
  return context
}

export function LanguageSwitcher() {
  const { lang } = useI18n()
  const pathname = usePathname()
  const router = useRouter()

  const changeLanguage = (nextLanguage: string) => {
    if (!isPublicLanguage(nextLanguage)) return
    localStorage.setItem(STORAGE_KEY, nextLanguage)
    document.cookie = `app_locale=${nextLanguage}; Path=/; Max-Age=31536000; SameSite=Lax`
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] && isPublicLanguage(segments[0])) segments[0] = nextLanguage
    else segments.unshift(nextLanguage)
    router.push(`/${segments.join('/')}`)
  }

  return (
    <select
      value={lang}
      onChange={(event) => changeLanguage(event.target.value)}
      aria-label="Language"
      className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm outline-none"
    >
      {LANGUAGES.map((language) => (
        <option key={language.code} value={language.code}>
          {language.native}
        </option>
      ))}
    </select>
  )
}
