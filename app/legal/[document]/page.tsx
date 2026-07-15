import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LEGAL_EFFECTIVE_DATE, legalCopy, type LegalDocument } from '@/lib/legal'

const documents = ['privacy', 'terms', 'refunds'] as const

function isLegalDocument(value: string): value is LegalDocument {
  return documents.includes(value as LegalDocument)
}

export function generateStaticParams() {
  return documents.map((document) => ({ document }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ document: string }>
}): Promise<Metadata> {
  const { document } = await params
  if (!isLegalDocument(document)) return {}
  return {
    title: `${legalCopy[document].title} · BingeGo`,
    description: legalCopy[document].summary,
    alternates: { canonical: `/legal/${document}` }
  }
}

export default async function LegalPage({ params }: { params: Promise<{ document: string }> }) {
  const { document: documentParam } = await params
  if (!isLegalDocument(documentParam)) notFound()
  const document = legalCopy[documentParam]

  return (
    <main className="min-h-screen bg-black px-5 pb-16 pt-8 text-white">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="Back to BingeGo">
          <Image src="/favicon.png" alt="" width={38} height={38} className="rounded-xl" />
          <span className="text-xl font-black text-brand-gradient">BingeGo</span>
        </Link>

        <header className="border-b border-white/10 pb-8 pt-12">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-blue">
            Legal
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight">{document.title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">{document.summary}</p>
          <p className="mt-4 text-xs text-white/40">Effective: {LEGAL_EFFECTIVE_DATE}</p>
        </header>

        <div className="space-y-10 py-10">
          {document.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-white/65">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-7 text-xs text-white/50">
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/refunds">Refunds</Link>
          <a href="mailto:heatcolin@gmail.com">heatcolin@gmail.com</a>
        </footer>
      </article>
    </main>
  )
}
