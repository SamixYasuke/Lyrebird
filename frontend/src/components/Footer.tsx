import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { Logo } from "@/components/Logo";

const columns = [
  {
    title: "Product",
    links: [
      ["How it works", "#how"],
      ["Features", "#features"],
      ["Safety", "#safety"],
      // ["Pricing", "#pricing"],
      ["FAQ", "#faq"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "#top"],
      ["Blog", "#top"],
      ["Contact", "#cta"],
      ["Status", "#top"],
    ],
  },
  // {
  //   title: "Legal",
  //   links: [
  //     ["Privacy", "#top"],
  //     ["Terms", "#top"],
  //     ["Security", "#safety"],
  //   ],
  // },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              The mimic bird for your API. Every product deserves a voice.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-sm text-ink/75 transition-colors hover:text-coral-deep"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-soft">
            © 2026 Lyrebird. Made for the API-curious.
          </p>
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-ink-soft uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
            status: all systems talking
          </p>
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-soft">
            Created by{" "}
            <a
              href="https://github.com/SamixYasuke"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink underline decoration-coral/60 decoration-2 underline-offset-4 transition-colors hover:text-coral-deep hover:decoration-coral"
            >
              Samuel Adekolu Oluwaseun
            </a>{" "}
            <span className="text-ink-soft">(Samixx Yasuke)</span>
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/SamixYasuke"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-coral-deep"
            >
              <HugeiconsIcon
                icon={GithubIcon}
                size={16}
                strokeWidth={1.5}
                absoluteStrokeWidth
                aria-hidden="true"
              />
              GitHub
            </a>
            <a
              href="https://x.com/samixx_yasuke"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-coral-deep"
            >
              <HugeiconsIcon
                icon={NewTwitterIcon}
                size={15}
                strokeWidth={1.5}
                absoluteStrokeWidth
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
