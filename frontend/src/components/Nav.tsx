import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/store/auth";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#showcase", label: "See it talk" },
  { href: "#safety", label: "Safety" },
  // { href: '#pricing', label: 'Pricing' },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "bg-paper/85 backdrop-blur-md border-b border-line"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink/80 transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {user ? (
            <Link
              to="/app"
              className="rounded-full border border-line bg-cream px-4 py-2 text-sm font-medium transition-colors hover:border-ink/30"
            >
              Console
            </Link>
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-cream-solid transition-colors hover:bg-coral-deep"
            >
              Get started
            </Link>
          )}
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-cream md:hidden"
        >
          {open ? (
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
          ) : (
            <HugeiconsIcon icon={Menu01Icon} size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
          )}
        </button>
      </div>
      {open ? (
        <nav className="border-t border-line bg-paper px-6 pb-6 pt-3 md:hidden">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <span className="font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase">menu</span>
            <ThemeToggle />
          </div>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line/60 py-3 text-sm text-ink/80 last:border-0"
            >
              {l.label}
            </a>
          ))}
          {user ? (
            <Link
              to="/app"
              onClick={() => setOpen(false)}
              className="block border-b border-line/60 py-3 text-sm text-ink/80 last:border-0"
            >
              Console
            </Link>
          ) : (
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="mt-4 block rounded-full bg-coral px-4 py-2.5 text-center text-sm font-semibold text-cream-solid"
            >
              Get started
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}
