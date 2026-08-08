import { Section } from '@/components/Section'
import { Reveal } from '@/components/Reveal'

const tiers = [
  {
    name: 'Songbird',
    price: '$0',
    cadence: 'free forever',
    blurb: 'Get one bot talking.',
    features: ['1 bot · 1 service', '500 sessions / month', 'Reads + confirmed writes', 'Community support'],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'Starling',
    price: '$49',
    cadence: 'per month',
    blurb: 'For teams shipping real support.',
    features: [
      '10 bots · 10 services',
      'Unlimited sessions',
      'Conversation memory + summaries',
      'Webhook diagnostics',
      'Priority queue',
    ],
    cta: 'Start free',
    featured: true,
  },
  {
    name: 'Lyrebird Studio',
    price: 'Custom',
    cadence: 'annual',
    blurb: 'Scale & compliance.',
    features: ['Unlimited bots', 'SSO & audit logs', 'Dedicated infrastructure', 'SLA + migration help'],
    cta: 'Talk to us',
    featured: false,
  },
]

export function Pricing() {
  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title={
        <>
          Priced for the <em className="font-warm text-coral italic">API-curious.</em>
        </>
      }
      lede="Start free, no card. Pay when your bot is actually answering your customers."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {tiers.map((t, i) => (
          <Reveal key={t.name} delay={i * 120}>
            <div
              className={`relative flex h-full flex-col rounded-3xl p-7 ${
                t.featured
                  ? 'border-2 border-ink bg-ink text-paper shadow-[0_30px_70px_-40px_rgba(22,24,29,0.5)]'
                  : 'border border-line bg-cream'
              }`}
            >
              {t.featured ? (
                <span className="absolute -top-3 left-7 rounded-full bg-coral px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-cream uppercase">
                  Popular
                </span>
              ) : null}
              <div className="flex items-baseline justify-between">
                <h3 className={`font-display text-xl font-medium tracking-tight ${t.featured ? 'text-cream' : ''}`}>
                  {t.name}
                </h3>
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase opacity-60">{t.cadence}</span>
              </div>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold tracking-tight">{t.price}</span>
                {t.price !== 'Custom' ? <span className="text-sm opacity-60">/ mo</span> : null}
              </p>
              <p className={`mt-1 text-sm ${t.featured ? 'text-paper/70' : 'text-ink-soft'}`}>{t.blurb}</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${t.featured ? 'bg-mint' : 'bg-coral'}`} />
                    <span className={t.featured ? 'text-paper/80' : 'text-ink/80'}>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#cta"
                className={`mt-8 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  t.featured
                    ? 'bg-coral text-cream hover:bg-coral-deep'
                    : 'border border-line bg-paper text-ink hover:border-ink/30'
                }`}
              >
                {t.cta}
              </a>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
