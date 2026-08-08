import type { ReactNode } from 'react'
import { Reveal } from '@/components/Reveal'

type SectionProps = {
  id?: string
  eyebrow: string
  title: ReactNode
  lede?: ReactNode
  children: ReactNode
  className?: string
  tone?: 'paper' | 'ink'
}

export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  className = '',
  tone = 'paper',
}: SectionProps) {
  const dark = tone === 'ink'
  return (
    <section id={id} className={`scroll-mt-24 ${dark ? 'bg-ink-deep text-cream-solid' : 'bg-paper text-ink'} ${className}`}>
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal className="max-w-2xl">
          <p
            className={`font-mono text-[11px] tracking-[0.22em] uppercase ${
              dark ? 'text-mint' : 'text-coral-deep'
            }`}
          >
            {eyebrow}
          </p>
          <h2
            className={`mt-4 font-display text-4xl leading-[1.08] font-medium tracking-tight md:text-5xl ${
              dark ? 'text-cream-solid' : ''
            }`}
          >
            {title}
          </h2>
          {lede ? (
            <p className={`mt-5 text-lg leading-relaxed ${dark ? 'text-cream-solid/70' : 'text-ink-soft'}`}>
              {lede}
            </p>
          ) : null}
        </Reveal>
        <div className="mt-14">{children}</div>
      </div>
    </section>
  )
}
