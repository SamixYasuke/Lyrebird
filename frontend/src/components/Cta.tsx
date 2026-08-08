import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon } from '@hugeicons/core-free-icons'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/Reveal'

export function Cta() {
  return (
    <section id="cta" className="scroll-mt-24 bg-paper px-6 pb-24 md:pb-32">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-ink-deep bg-ink-deep px-8 py-16 text-center md:py-20">
          <div
            aria-hidden="true"
            className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-coral/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 left-[-10%] h-64 w-64 rounded-full bg-leaf/20 blur-3xl"
          />

          <div className="relative">
            <p className="font-mono text-[11px] tracking-[0.22em] text-mint uppercase">
              three minutes · no training · just your spec
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl leading-[1.06] font-medium tracking-tight text-balance text-cream-solid md:text-6xl">
              Give your product{' '}
              <em className="font-warm text-coral italic">a voice.</em>
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-cream-solid/70">
              The first bot will be talking before your coffee's gone.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/app"
                className="group inline-flex items-center gap-2 rounded-full bg-coral px-7 py-3.5 text-[15px] font-semibold text-cream-solid transition-colors hover:bg-coral-deep"
              >
                Start free
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  size={15}
                  strokeWidth={1.5}
                  absoluteStrokeWidth
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <a
                href="#showcase"
                className="inline-flex items-center gap-2 rounded-full border border-cream-solid/25 px-7 py-3.5 text-[15px] font-medium text-cream-solid transition-colors hover:border-cream-solid/50"
              >
                Watch it talk
              </a>
            </div>

            <div className="mx-auto mt-10 flex max-w-md items-center gap-3 rounded-xl border border-cream-solid/15 bg-code px-4 py-3 text-left">
              <span className="font-mono text-[12px] text-leaf">POST /tenants/1/services</span>
              <span className="ml-auto font-mono text-[12px] text-mint">201 created</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
