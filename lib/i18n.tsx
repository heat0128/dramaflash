'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { LANGUAGES } from '@/lib/languages'

const STORAGE_KEY = 'bingego_lang'

export function getSavedLang(): string {
  if (typeof window === 'undefined') return 'en'
  return localStorage.getItem(STORAGE_KEY) || 'en'
}

// Translation dictionary. English is the fallback for any missing key.
const DICT: Record<string, Record<string, string>> = {
  'nav.home':        { en:'Home', es:'Inicio', pt:'Início', fr:'Accueil', ja:'ホーム', ko:'홈', vi:'Trang chủ', ms:'Utama', id:'Beranda', 'zh-Hant':'首頁' },
  'nav.discover':    { en:'Discover', es:'Explorar', pt:'Descobrir', fr:'Découvrir', ja:'見つける', ko:'발견', vi:'Khám phá', ms:'Terokai', id:'Jelajah', 'zh-Hant':'探索' },
  'nav.wallet':      { en:'Wallet', es:'Cartera', pt:'Carteira', fr:'Portefeuille', ja:'ウォレット', ko:'지갑', vi:'Ví', ms:'Dompet', id:'Dompet', 'zh-Hant':'錢包' },
  'nav.me':          { en:'Me', es:'Yo', pt:'Eu', fr:'Moi', ja:'マイ', ko:'나', vi:'Tôi', ms:'Saya', id:'Saya', 'zh-Hant':'我的' },

  'profile.signin':  { en:'Tap to sign in or sign up', es:'Toca para iniciar sesión', pt:'Toque para entrar', fr:'Appuyez pour vous connecter', ja:'タップしてログイン', ko:'탭하여 로그인', vi:'Chạm để đăng nhập', ms:'Ketik untuk log masuk', id:'Ketuk untuk masuk', 'zh-Hant':'點擊登入或註冊' },
  'profile.guest':   { en:'Guest', es:'Invitado', pt:'Visitante', fr:'Invité', ja:'ゲスト', ko:'게스트', vi:'Khách', ms:'Tetamu', id:'Tamu', 'zh-Hant':'訪客' },
  'profile.saved':   { en:'Saved', es:'Guardado', pt:'Salvos', fr:'Enregistrés', ja:'保存', ko:'저장됨', vi:'Đã lưu', ms:'Disimpan', id:'Tersimpan', 'zh-Hant':'收藏' },
  'profile.watched': { en:'Watched', es:'Vistos', pt:'Assistidos', fr:'Vus', ja:'視聴済み', ko:'시청함', vi:'Đã xem', ms:'Ditonton', id:'Ditonton', 'zh-Hant':'已看' },
  'profile.coins':   { en:'Coins', es:'Monedas', pt:'Moedas', fr:'Pièces', ja:'コイン', ko:'코인', vi:'Xu', ms:'Syiling', id:'Koin', 'zh-Hant':'金幣' },
  'profile.getVip':  { en:'Get VIP', es:'Obtener VIP', pt:'Obter VIP', fr:'Obtenir VIP', ja:'VIPになる', ko:'VIP 가입', vi:'Mua VIP', ms:'Dapatkan VIP', id:'Dapatkan VIP', 'zh-Hant':'開通 VIP' },
  'profile.favorites':{ en:'My Favorites', es:'Mis favoritos', pt:'Meus favoritos', fr:'Mes favoris', ja:'お気に入り', ko:'즐겨찾기', vi:'Yêu thích', ms:'Kegemaran', id:'Favorit', 'zh-Hant':'我的收藏' },
  'profile.history': { en:'Watch History', es:'Historial', pt:'Histórico', fr:'Historique', ja:'視聴履歴', ko:'시청 기록', vi:'Lịch sử xem', ms:'Sejarah Tontonan', id:'Riwayat', 'zh-Hant':'觀看歷史' },
  'profile.billing': { en:'Billing', es:'Facturación', pt:'Pagamentos', fr:'Facturation', ja:'お支払い', ko:'결제', vi:'Thanh toán', ms:'Bil', id:'Tagihan', 'zh-Hant':'帳單' },
  'profile.help':    { en:'Help & Feedback', es:'Ayuda', pt:'Ajuda', fr:'Aide', ja:'ヘルプ', ko:'도움말', vi:'Trợ giúp', ms:'Bantuan', id:'Bantuan', 'zh-Hant':'幫助與反饋' },
  'profile.settings':{ en:'Settings', es:'Ajustes', pt:'Configurações', fr:'Paramètres', ja:'設定', ko:'설정', vi:'Cài đặt', ms:'Tetapan', id:'Pengaturan', 'zh-Hant':'設定' },
  'profile.signout': { en:'Sign out', es:'Cerrar sesión', pt:'Sair', fr:'Déconnexion', ja:'ログアウト', ko:'로그아웃', vi:'Đăng xuất', ms:'Log keluar', id:'Keluar', 'zh-Hant':'登出' },
  'profile.language':{ en:'Language', es:'Idioma', pt:'Idioma', fr:'Langue', ja:'言語', ko:'언어', vi:'Ngôn ngữ', ms:'Bahasa', id:'Bahasa', 'zh-Hant':'語言' },

  'wallet.title':    { en:'Wallet & VIP', es:'Cartera y VIP', pt:'Carteira e VIP', fr:'Portefeuille et VIP', ja:'ウォレットとVIP', ko:'지갑 & VIP', vi:'Ví & VIP', ms:'Dompet & VIP', id:'Dompet & VIP', 'zh-Hant':'錢包與 VIP' },
  'wallet.earnFree': { en:'Earn Free Coins', es:'Gana monedas gratis', pt:'Ganhe moedas grátis', fr:'Gagnez des pièces', ja:'無料コイン獲得', ko:'무료 코인 받기', vi:'Kiếm xu miễn phí', ms:'Dapat Syiling Percuma', id:'Dapatkan Koin Gratis', 'zh-Hant':'免費賺金幣' },
  'wallet.subscribe':{ en:'Subscribe to VIP', es:'Suscríbete a VIP', pt:'Assine o VIP', fr:'Abonnez-vous VIP', ja:'VIPに登録', ko:'VIP 구독', vi:'Đăng ký VIP', ms:'Langgan VIP', id:'Langganan VIP', 'zh-Hant':'訂閱 VIP' },
  'wallet.recharge': { en:'Recharge Coins', es:'Recargar monedas', pt:'Recarregar moedas', fr:'Recharger', ja:'コインをチャージ', ko:'코인 충전', vi:'Nạp xu', ms:'Tambah Syiling', id:'Isi Koin', 'zh-Hant':'充值金幣' },

  'discover.recommended':{ en:'Recommended', es:'Recomendado', pt:'Recomendado', fr:'Recommandé', ja:'おすすめ', ko:'추천', vi:'Đề xuất', ms:'Disyorkan', id:'Rekomendasi', 'zh-Hant':'推薦' },
  'discover.forYou': { en:'For You', es:'Para ti', pt:'Para você', fr:'Pour vous', ja:'あなたへ', ko:'추천', vi:'Dành cho bạn', ms:'Untuk Anda', id:'Untuk Anda', 'zh-Hant':'為你推薦' },
  'discover.new':    { en:'New Releases', es:'Novedades', pt:'Lançamentos', fr:'Nouveautés', ja:'新作', ko:'신작', vi:'Mới ra mắt', ms:'Keluaran Baru', id:'Rilis Baru', 'zh-Hant':'新劇上線' },
  'discover.categories':{ en:'Categories', es:'Categorías', pt:'Categorias', fr:'Catégories', ja:'カテゴリ', ko:'카테고리', vi:'Thể loại', ms:'Kategori', id:'Kategori', 'zh-Hant':'分類' },

  'paywall.title':   { en:'Unlock to keep watching', es:'Desbloquea para seguir viendo', pt:'Desbloqueie para continuar', fr:'Déverrouillez pour continuer', ja:'続きを見るには解除', ko:'계속 보려면 잠금 해제', vi:'Mở khóa để xem tiếp', ms:'Buka kunci untuk teruskan', id:'Buka untuk lanjut', 'zh-Hant':'解鎖以繼續觀看' },
  'paywall.useCoins':{ en:'Use Coins', es:'Usar monedas', pt:'Usar moedas', fr:'Utiliser des pièces', ja:'コインを使う', ko:'코인 사용', vi:'Dùng xu', ms:'Guna Syiling', id:'Pakai Koin', 'zh-Hant':'使用金幣' },
  'paywall.watchAd': { en:'Watch an ad', es:'Ver un anuncio', pt:'Ver um anúncio', fr:'Regarder une pub', ja:'広告を見る', ko:'광고 보기', vi:'Xem quảng cáo', ms:'Tonton iklan', id:'Tonton iklan', 'zh-Hant':'觀看廣告' },
  'paywall.free':    { en:'Free', es:'Gratis', pt:'Grátis', fr:'Gratuit', ja:'無料', ko:'무료', vi:'Miễn phí', ms:'Percuma', id:'Gratis', 'zh-Hant':'免費' },

  'home.noDramas':   { en:'No dramas yet', es:'Aún no hay series', pt:'Ainda sem séries', fr:'Pas encore de séries', ja:'まだ作品がありません', ko:'아직 드라마가 없습니다', vi:'Chưa có phim', ms:'Belum ada drama', id:'Belum ada drama', 'zh-Hant':'尚無短劇' },

  'player.subtitles':{ en:'Subtitles', es:'Subtítulos', pt:'Legendas', fr:'Sous-titres', ja:'字幕', ko:'자막', vi:'Phụ đề', ms:'Sari kata', id:'Subtitle', 'zh-Hant':'字幕' },
  'player.off':      { en:'Off', es:'Desactivado', pt:'Desligado', fr:'Désactivé', ja:'オフ', ko:'끄기', vi:'Tắt', ms:'Mati', id:'Mati', 'zh-Hant':'關閉' }
}

type Ctx = { lang: string; setLang: (l: string) => void; t: (key: string) => string }
const I18nContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState('en')

  useEffect(() => { setLangState(getSavedLang()) }, [])

  const setLang = (l: string) => {
    setLangState(l)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, l)
  }

  const t = (key: string) => DICT[key]?.[lang] || DICT[key]?.en || key

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) return { lang: 'en', setLang: () => {}, t: (k: string) => DICT[k]?.en || k }
  return ctx
}

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  return (
    <select value={lang} onChange={e => setLang(e.target.value)}
      className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}
    </select>
  )
}
