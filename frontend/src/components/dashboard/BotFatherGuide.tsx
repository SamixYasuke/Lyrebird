import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Copy01Icon,
  Link01Icon,
  TelegramIcon,
  Tick01Icon,
} from '@hugeicons/core-free-icons'

const BOTFATHER_URL = 'https://t.me/BotFather'
const BOTFATHER_DOCS_URL =
  'https://core.telegram.org/bots/features#creating-a-new-bot'
const NEWBOT_COMMAND = '/newbot'

export function BotFatherGuide() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(NEWBOT_COMMAND)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard unavailable — the command is shown inline to copy by hand
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-paper">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral-deep">
          <HugeiconsIcon icon={TelegramIcon} size={15} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-ink">Don't have a bot yet?</span>
          <span className="block font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
            create one with BotFather — 30 seconds
          </span>
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={14}
          strokeWidth={1.5}
          absoluteStrokeWidth
          aria-hidden="true"
          className={`shrink-0 text-ink-soft transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open ? (
        <div className="border-t border-line px-4 py-4">
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-deep text-[10px] font-semibold text-cream-solid">
                1
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-relaxed text-ink">
                  Open <span className="font-medium">BotFather</span> in Telegram — the official bot that builds bots.
                </p>
                <a
                  href={BOTFATHER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-coral px-4 py-1.5 text-[13px] font-semibold text-cream-solid transition-colors hover:bg-coral-deep"
                >
                  <HugeiconsIcon icon={TelegramIcon} size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
                  Open @BotFather
                </a>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-deep text-[10px] font-semibold text-cream-solid">
                2
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-relaxed text-ink">
                  Send <span className="font-mono text-[12px]">/newbot</span>, then pick a name and a username ending in{' '}
                  <span className="font-mono text-[12px]">bot</span>.
                </p>
                <button
                  type="button"
                  onClick={() => void copyCommand()}
                  className={`mt-2 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors ${
                    copied
                      ? 'border-leaf/40 bg-leaf-soft text-leaf-deep'
                      : 'border-line bg-cream text-ink hover:border-coral/40 hover:text-coral-deep'
                  }`}
                >
                  <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
                  {copied ? 'Copied' : 'Copy /newbot'}
                </button>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-deep text-[10px] font-semibold text-cream-solid">
                3
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-relaxed text-ink">
                  BotFather replies with an <span className="font-medium">HTTP API token</span> that looks like{' '}
                  <span className="font-mono text-[12px]">1234567890:AAF…</span>. Paste it into the field above.
                </p>
              </div>
            </li>
          </ol>

          <a
            href={BOTFATHER_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:text-coral-deep"
          >
            <HugeiconsIcon icon={Link01Icon} size={13} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
            Full BotFather guide in the Telegram docs
          </a>
        </div>
      ) : null}
    </div>
  )
}
