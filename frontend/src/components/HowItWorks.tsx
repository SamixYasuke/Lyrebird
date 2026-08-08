import { Section } from '@/components/Section'
import { Reveal } from '@/components/Reveal'

type StepProps = {
  n: string
  label: string
  title: string
  body: string
}

function Step({ n, label, title, body }: StepProps) {
  return (
    <div className="relative rounded-3xl border border-line bg-cream p-7">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.18em] text-coral-deep uppercase">{label}</span>
        <span className="font-display text-5xl leading-none text-paper-2 dark:text-line">{n}</span>
      </div>
      <h3 className="mt-6 font-display text-2xl font-medium tracking-tight">{title}</h3>
      <p className="mt-3 leading-relaxed text-ink-soft">{body}</p>
    </div>
  )
}

const steps: StepProps[] = [
  {
    n: '01',
    label: 'POST /services',
    title: 'Connect',
    body: 'Paste your OpenAPI spec and a bot token from @BotFather. Lyrebird reads every endpoint, schema, and security scheme.',
  },
  {
    n: '02',
    label: 'SET WEBHOOK',
    title: 'Learn',
    body: 'Your bot is registered and alive. Every endpoint becomes a tool — reads and writes, described in plain language the model understands.',
  },
  {
    n: '03',
    label: 'RECEIVE :chat_id',
    title: 'Talk',
    body: 'Your users just ask. Reads answer instantly; anything that changes data pauses for a confirmed yes before it happens.',
  },
]

export function HowItWorks() {
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title={
        <>
          Three quiet steps.
          <br />
          Then your product just <em className="font-warm text-coral italic">talks.</em>
        </>
      }
      lede="No per-company code. No training runs. The whole thing is data-driven from the spec you already ship."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 120}>
            <Step {...s} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={200} className="mt-10">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-paper-2 px-6 py-4 font-mono text-[12px] text-ink-soft">
          <span className="text-coral-deep">telegram</span>
          <span>→</span>
          <span>parse intent</span>
          <span>→</span>
          <span className="text-leaf-deep">tool call</span>
          <span>→</span>
          <span>your API</span>
          <span>→</span>
          <span>reply</span>
          <span className="mx-1 hidden h-1 w-1 rounded-full bg-ink/30 md:inline-block" />
          <span className="uppercase tracking-[0.14em]">one pipeline, any endpoint</span>
        </div>
      </Reveal>
    </Section>
  )
}
