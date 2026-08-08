import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Chatting01Icon,
  FileCodeIcon,
  RefreshIcon,
  Scissor01Icon,
  TelegramIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { Section } from '@/components/Section'
import { Reveal } from '@/components/Reveal'

type FeatureProps = {
  tag: string
  title: string
  body: string
  icon: ReactNode
}

const features: FeatureProps[] = [
  {
    tag: 'SPEC',
    icon: <HugeiconsIcon icon={FileCodeIcon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />,
    title: 'OpenAPI-native',
    body: 'JSON or YAML, any version. $refs resolved for you — drop in the spec you already ship.',
  },
  {
    tag: 'MEMORY',
    icon: <HugeiconsIcon icon={Chatting01Icon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />,
    title: 'Conversations with memory',
    body: 'Sessions keep rolling summaries that survive across days of messages — the bot remembers context without a giant transcript.',
  },
  {
    tag: 'TELEGRAM',
    icon: <HugeiconsIcon icon={TelegramIcon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />,
    title: 'Telegram-first',
    body: 'Webhook pipeline with dedupe and queue-safe delivery. WhatsApp rides the same engine later.',
  },
  {
    tag: 'MULTI-TENANT',
    icon: <HugeiconsIcon icon={UserGroupIcon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />,
    title: 'Multi-tenant ready',
    body: 'Tenant → service → end users, cleanly namespaced. One deployment, many companies, zero cross-talk.',
  },
  {
    tag: 'PRUNED',
    icon: <HugeiconsIcon icon={Scissor01Icon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />,
    title: 'Sharp context, by design',
    body: 'Huge specs are pruned per request so the model only sees the endpoints relevant to the ask.',
  },
  {
    tag: 'RECOVERY',
    icon: <HugeiconsIcon icon={RefreshIcon} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />,
    title: 'Self-correcting loops',
    body: 'The agent retries, feeds errors back, and falls back gracefully instead of stalling on a flaky call.',
  },
]

export function Features() {
  return (
    <Section
      id="features"
      eyebrow="Features"
      title={
        <>
          Built like it ships.
          <br />
          Not like a <em className="font-warm text-coral italic">demo.</em>
        </>
      }
      lede="Every knob below is a thing we had to get right to run production conversations against someone else's API."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.tag} delay={(i % 3) * 100}>
            <div className="group h-full rounded-3xl border border-line bg-cream p-7 transition-colors hover:border-coral/40">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-2 text-ink transition-colors group-hover:bg-coral-soft group-hover:text-coral-deep">
                  {f.icon}
                </div>
                <span className="font-mono text-[10px] tracking-[0.2em] text-ink-soft">{f.tag}</span>
              </div>
              <h3 className="mt-5 font-display text-xl font-medium tracking-tight">{f.title}</h3>
              <p className="mt-2.5 leading-relaxed text-ink-soft">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
