import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'

type ModalProps = {
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-ink-deep/40 backdrop-blur-sm" />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-cream p-7 shadow-[0_30px_80px_-30px_rgba(22,24,29,0.6)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition-colors hover:text-ink"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
