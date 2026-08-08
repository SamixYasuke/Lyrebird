import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { LogoMark } from "@/components/Logo";

function Bubble({
  side,
  children,
  delay,
}: {
  side: "user" | "bot";
  children: ReactNode;
  delay: number;
}) {
  const user = side === "user";
  return (
    <div
      className={`pop flex ${user ? "justify-end" : "justify-start"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
          user
            ? "rounded-br-md bg-paper-2 text-ink"
            : "rounded-bl-md border border-line bg-cream text-ink"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ToolPill({
  delay,
  method,
  path,
  status,
  tone,
}: {
  delay: number;
  method: string;
  path: string;
  status: string;
  tone: "pending" | "done";
}) {
  const pending = tone === "pending";
  return (
    <div
      className="pop flex justify-start"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px] ${
          pending
            ? "border-coral/30 bg-coral-soft text-coral-deep"
            : "border-leaf/40 bg-leaf-soft text-leaf-deep"
        }`}
      >
        <span className="font-semibold">{method}</span>
        <span className="opacity-80">{path}</span>
        <span
          className={`h-1 w-1 rounded-full ${pending ? "bg-coral" : "bg-leaf"}`}
        />
        <span className="opacity-70">{status}</span>
      </div>
    </div>
  );
}

function Typing({ delay }: { delay: number }) {
  return (
    <div
      className="pop flex justify-start"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-line bg-cream px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-ink-soft"
            style={{
              animation: `typing 1.2s ${i * 0.15}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-44"
    >
      <div
        aria-hidden="true"
        className="absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full bg-coral/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-160px] left-[-8%] h-[380px] w-[380px] rounded-full bg-leaf/15 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <div
            className="rise flex items-center gap-2 self-start rounded-full border border-line bg-cream px-3 py-1.5"
            style={{ animationDelay: "0ms" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" />
            </span>
            <span className="font-mono text-[11px] tracking-[0.18em] text-ink-soft uppercase">
              OpenAPI native
            </span>
          </div>

          <h1
            className="rise mt-6 font-display font-medium tracking-tight text-balance text-[2.75rem] leading-[1.04] md:text-6xl"
            style={{ animationDelay: "90ms" }}
          >
            Your product, finally{" "}
            <em className="font-warm font-display text-coral italic">
              fluent in human.
            </em>
          </h1>

          <p
            className="rise mt-6 max-w-xl text-lg leading-relaxed text-ink-soft"
            style={{ animationDelay: "180ms" }}
          >
            Connect your OpenAPI spec and Lyrebird turns your product's API into
            a Telegram bot your users can just talk to. “Where's my order?” — it
            works it out, and gets it done.
          </p>

          <div
            className="rise mt-8 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "270ms" }}
          >
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-[15px] font-semibold text-cream-solid transition-colors hover:bg-coral-deep"
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
            </a>
            <a
              href="#showcase"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-6 py-3 text-[15px] font-medium transition-colors hover:border-ink/30"
            >
              See it talk
            </a>
          </div>

          <div
            className="rise mt-10 flex flex-wrap items-center gap-x-5 gap-y-2"
            style={{ animationDelay: "360ms" }}
          >
            {[
              "NO PER-COMPANY CODE",
              "READS INSTANT · WRITES CONFIRM",
              "YOUR KEYS STAY SERVER-SIDE",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-ink-soft"
              >
                <span className="h-1 w-1 rounded-full bg-coral" />
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="rise relative" style={{ animationDelay: "200ms" }}>
          <div className="float-slow rounded-3xl border border-line bg-cream/90 p-4 shadow-[0_30px_80px_-40px_rgba(22,24,29,0.35)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between border-b border-line px-2 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-deep">
                  <LogoMark className="scale-[0.65]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold leading-tight">
                    Parcels Co.
                  </p>
                  <p className="flex items-center gap-1.5 font-mono text-[10px] text-ink-soft">
                    <span className="h-1.5 w-1.5 rounded-full bg-leaf" />{" "}
                    official bot
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-ink-soft">20:41</span>
            </div>

            <div className="space-y-2.5 px-2">
              <Bubble side="user" delay={500}>
                where's my order?
              </Bubble>
              <Typing delay={1300} />
              <ToolPill
                delay={1700}
                method="GET"
                path="/orders/8124"
                status="200"
                tone="done"
              />
              <Bubble side="bot" delay={2300}>
                Order <span className="font-mono text-[13px]">#8124</span> is
                currently at Abuja. It would be arriving Thursday.
              </Bubble>
              <Bubble side="user" delay={3300}>
                cancel it, actually
              </Bubble>
              <ToolPill
                delay={4100}
                method="POST"
                path="/orders/8124/cancel"
                status="needs confirm"
                tone="pending"
              />
              <Bubble side="bot" delay={4700}>
                That'll cancel{" "}
                <span className="font-mono text-[13px]">#8124</span> and refund{" "}
                <span className="font-mono text-[13px]">₦42,340</span>. Confirm?
              </Bubble>
              <Bubble side="user" delay={5700}>
                yes
              </Bubble>
              <ToolPill
                delay={6300}
                method="POST"
                path="/orders/8124/cancel"
                status="200 · executed"
                tone="done"
              />
              <Bubble side="bot" delay={6900}>
                Done — <span className="font-mono text-[13px]">₦42,340</span>{" "}
                refunded to your card.
              </Bubble>
            </div>
          </div>

          <p className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-line bg-paper px-4 py-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
            discovered straight from your spec · no training
          </p>
        </div>
      </div>
    </section>
  );
}
