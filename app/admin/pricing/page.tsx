import { createServiceClient } from '@/lib/supabase/server'
import { PricingEditor } from './editor'

export const dynamic = 'force-dynamic'

export default async function AdminPricingPage() {
  const svc = createServiceClient()
  const [{ data: packs }, { data: plans }] = await Promise.all([
    svc.from('coin_packs').select('*').order('display_order'),
    svc.from('subscription_plans').select('*').order('display_order')
  ])
  return <PricingEditor packs={packs || []} plans={plans || []} />
}
