import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    redirect('/login?next=/admin')
  }
  return (
    <div
      className="min-h-screen pb-12"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      <header className="px-4 py-4 flex items-center justify-between border-b border-white/5">
        <div className="text-lg font-extrabold text-brand-gradient">Admin · BingeGo</div>
        <Link href="/" className="text-xs opacity-60">
          ← Back to site
        </Link>
      </header>
      <nav className="flex border-b border-white/5 px-2">
        <NavLink href="/admin">Dashboard</NavLink>
        <NavLink href="/admin/series">Series</NavLink>
        <NavLink href="/admin/upload">Upload</NavLink>
        <NavLink href="/admin/users">Users</NavLink>
        <NavLink href="/admin/revenue">Revenue</NavLink>
      </nav>
      <main className="px-4 py-6 max-w-2xl mx-auto">{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-3 text-sm font-semibold opacity-70 hover:opacity-100 border-b-2 border-transparent hover:border-brand-pink"
    >
      {children}
    </Link>
  )
}
