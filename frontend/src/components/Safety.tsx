import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon, LockIcon, SecurityCheckIcon } from '@hugeicons/core-free-icons'
import { Section } from '@/components/Section'
import { Reveal } from '@/components/Reveal'

const items = [
  {
    icon: <HugeiconsIcon icon={ArrowRight02Icon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />,
    title: 'Reads answer. Writes confirm.',
    body: 'GETs execute instantly. Anything that changes data — cancel, pause, update, delete — pauses for an explicit yes before it happens. No silent writes, ever.',
  },
  {
    icon: <HugeiconsIcon icon={LockIcon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />,
    title: 'Your keys stay server-side.',
    body: 'Auth headers are injected at call time, in your infrastructure. Secrets are never passed to the model and never appear in a prompt.',
  },
  {
    icon: <HugeiconsIcon icon={SecurityCheckIcon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />,
    title: 'A hard trust boundary.',
    body: 'The bot can only reach endpoints in your spec — never internal ones. No amount of prompt injection reaches past your published API.',
  },
]

export function Safety() {
  return (
    <Section
      id="safety"
      tone="ink"
      eyebrow="Safety by default"
      title={
        <>
          Mutations ask first. <em className="font-warm text-mint italic">Always.</em>
        </>
      }
      lede="The confirmation isn't a prompt the model improvises — it's a hard stop in the pipeline. A write only executes after an explicit yes on the next turn."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={i * 120}>
            <div className="h-full rounded-3xl border border-cream-solid/15 bg-cream-solid/5 p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-solid/15 text-mint">
                {it.icon}
              </div>
              <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-cream-solid">{it.title}</h3>
              <p className="mt-2.5 leading-relaxed text-cream-solid/60">{it.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200} className="mt-8">
        <p className="text-center font-mono text-[11px] tracking-[0.16em] text-cream-solid/50 uppercase">
          AUTH: INJECTED AT CALL TIME — NEVER IN PROMPT
        </p>
      </Reveal>
    </Section>
  )
}
