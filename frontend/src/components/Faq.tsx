import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { Section } from '@/components/Section'
import { Reveal } from '@/components/Reveal'

const faqs = [
  {
    q: 'Do I need to write any code?',
    a: 'No. Paste your OpenAPI spec and a bot token from @BotFather. Lyrebird parses the spec and generates the bot from it — no per-company code, no training runs.',
  },
  {
    q: 'Which API specs are supported?',
    a: 'OpenAPI 3.x as JSON or YAML, with $ref resolution handled for you. Swagger 2.0 support is on the roadmap.',
  },
  {
    q: 'Is my bot token safe?',
    a: 'Yes. The token is stored encrypted at rest, and any auth headers for your API are injected at call time inside your infrastructure — they are never shown to the model.',
  },
  {
    q: 'Can the bot do anything outside my API?',
    a: 'No. It can only reach the endpoints defined in your spec. That is a hard trust boundary — prompt injection cannot reach beyond your published API.',
  },
  {
    q: 'What does the confirmation step actually do?',
    a: 'Reads execute instantly. Writes — POST, PUT, PATCH, DELETE — pause at a hard stop in the pipeline and wait for an explicit “yes” on the next turn before executing.',
  },
  {
    q: 'What about WhatsApp?',
    a: 'On the roadmap. The agent pipeline is transport-agnostic, so the same tools and safety rules work once a second channel is wired in.',
  },
]

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="font-display text-lg font-medium tracking-tight md:text-xl">{q}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-cream transition-transform duration-300 ${
            open ? 'rotate-45' : ''
          }`}
          aria-hidden="true"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 leading-relaxed text-ink-soft">{a}</p>
        </div>
      </div>
    </div>
  )
}

export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title={
        <>
          Questions, <em className="font-warm text-coral italic">answered.</em>
        </>
      }
      lede="The usual things people want to know before they hand their API to a talking bird."
    >
      <Reveal>
        <div className="max-w-3xl">
          {faqs.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </Reveal>
    </Section>
  )
}
