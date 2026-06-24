import { createServiceClient } from '@/lib/supabase/server'
import { SettingsEditor } from './editor'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const svc = createServiceClient()
  const { data: rows } = await svc.from('app_settings').select('key, value')
  const settings: Record<string, string> = {}
  for (const r of rows || []) settings[r.key] = r.value
  return <SettingsEditor initial={settings} />
}
