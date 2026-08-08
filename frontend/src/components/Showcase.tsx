import type { ReactNode } from 'react'
import { Section } from '@/components/Section'
import { Reveal } from '@/components/Reveal'

function U({ children }: { children: ReactNode }) {
  return <span className="text-mint">{children}</span>
}
function C({ children }: { children: ReactNode }) {
  return <span className="text-coral">{children}</span>
}
function G({ children }: { children: ReactNode }) {
  return <span className="text-leaf">{children}</span>
}

function TraceLine({ indent, children }: { indent: number; children: ReactNode }) {
  return (
    <div className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed">
      <span style={{ display: 'inline-block', width: `${indent}ch` }} />
      {children}
    </div>
  )
}

export function Showcase() {
  return (
    <Section
      id="showcase"
      eyebrow="See it talk"
      title={
        <>
          One conversation. <em className="font-warm text-coral italic">Two perspectives.</em>
        </>
      }
      lede="Left is what your user experiences. Right is the quiet machinery behind it — the model turning plain words into a tool call against your API."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-3xl border border-line bg-cream p-6">
            <div className="mb-5 flex items-center justify-between border-b border-line pb-3">
              <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                What your user sees
              </p>
              <span className="font-mono text-[11px] text-ink-soft">Telegram</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-paper-2 px-4 py-2.5 text-[14px]">
                  I want to pause my membership for a month
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-cream px-4 py-2.5 text-[14px]">
                  Pausing pauses your monthly billing — nothing else. Confirm?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-paper-2 px-4 py-2.5 text-[14px]">
                  yep
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-cream px-4 py-2.5 text-[14px]">
                  Done — your plan is paused until{' '}
                  <span className="font-mono text-[13px]">2026-09-08</span>.
                </div>
              </div>
            </div>
            <p className="mt-6 border-t border-line pt-4 font-mono text-[11px] tracking-[0.14em] text-ink-soft uppercase">
              reads feel instant · writes feel safe
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="h-full overflow-hidden rounded-3xl border border-ink-deep bg-code p-6 shadow-[0_30px_80px_-50px_rgba(22,24,29,0.6)]">
            <div className="mb-5 flex items-center justify-between border-b border-cream-solid/15 pb-3">
              <p className="font-mono text-[11px] tracking-[0.18em] text-mint uppercase">
                What actually happens
              </p>
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-cream-solid/25" />
                <span className="h-2.5 w-2.5 rounded-full bg-leaf/70" />
              </div>
            </div>

            <div className="space-y-1 text-cream-solid/80">
              <TraceLine indent={0}>
                <C>user</C>  I want to pause my membership for a month
              </TraceLine>
              <TraceLine indent={0}>
                <span className="text-cream-solid/40">────────────</span>
              </TraceLine>
              <TraceLine indent={1}>
                <G>agent</G>  → tool_call <U>pauseSubscription</U>({'{month: 1}'})
              </TraceLine>
              <TraceLine indent={1}>
                {'→ '}
                <C>isMutation</C> → <span className="text-cream-solid">intercept: needs confirm</span>
              </TraceLine>
              <TraceLine indent={1}>
                → “Pausing pauses your monthly billing… Confirm?”
              </TraceLine>
              <TraceLine indent={0}>
                <span className="text-cream-solid/40">────────────</span>
              </TraceLine>
              <TraceLine indent={0}>
                <C>user</C>  yep
              </TraceLine>
              <TraceLine indent={0}>
                <span className="text-cream-solid/40">────────────</span>
              </TraceLine>
              <TraceLine indent={1}>
                <G>agent</G>  → <C>allowlist</C> check → execute
              </TraceLine>
              <TraceLine indent={1}>
                {'→ '}
                <U>PATCH</U> <U>/membership/pause</U> →{' '}
                <G>200</G> {'{pausedUntil: "2026-09-08"}'}
              </TraceLine>
              <TraceLine indent={1}>
                → “Done — your plan is paused until <G>2026-09-08</G>.”
              </TraceLine>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
