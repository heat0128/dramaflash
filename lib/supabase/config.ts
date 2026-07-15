const DEFAULT_SUPABASE_URL = 'https://gbiegzlxgaamfmbaknjk.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_KxYi48KZ7uAzt6E19KnG-w_NMpXHxpX'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY
