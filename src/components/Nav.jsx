import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

import Wordmark from './Wordmark.jsx';
import { LangToggle, ThemeToggle } from './Toggles.jsx';
import { useLang } from '../lib/i18n.jsx';

export default function Nav() {
  const reduceMotion = useReducedMotion();
  const { t } = useLang();
  const { scrollY } = useScroll();
  // Garis bawah nav baru muncul setelah halaman digulir, jadi hero terasa lapang.
  const borderOpacity = useTransform(scrollY, [0, 90], [0, 1]);

  return (
    <header className="sticky top-0 z-50">
      <motion.div
        className="absolute inset-0 border-b border-line bg-canvas/85 backdrop-blur-xl"
        style={{ opacity: reduceMotion ? 1 : borderOpacity }}
      />
      <nav className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-4 md:h-[72px] md:px-8">
        <a href="#atas" className="shrink-0" aria-label={t.nav.brandToTop}>
          <Wordmark />
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {t.nav.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm whitespace-nowrap text-ink-2 transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <a
            href="#studio"
            className="hidden rounded-full bg-accent px-4 py-2 text-sm font-medium whitespace-nowrap text-accent-fg transition-transform hover:brightness-105 active:translate-y-px sm:inline-block"
          >
            {t.nav.cta}
          </a>
        </div>
      </nav>
    </header>
  );
}
