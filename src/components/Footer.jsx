import { ArrowUpRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

import Wordmark from './Wordmark.jsx';
import { useLang } from '../lib/i18n.jsx';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="border-t border-line bg-canvas-2">
      {/* Penutup: satu ajakan terakhir, memakai label yang sama dengan nav. */}
      <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-20">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <h2 className="max-w-[24ch] text-3xl leading-[1.1] md:text-4xl">{t.footer.ctaHeading}</h2>
          <a
            href="#studio"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium whitespace-nowrap text-accent-fg transition-transform hover:brightness-105 active:translate-y-px"
          >
            {t.footer.ctaButton}
            <ArrowUpRight
              size={16}
              weight="bold"
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </div>

        <div className="hairline my-12" />

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[52ch] space-y-4">
            <Wordmark />
            <p className="text-xs leading-relaxed text-ink-3">{t.footer.disclaimer}</p>
          </div>

          <nav className="flex flex-col gap-2.5 text-sm md:items-end" aria-label="Tautan legal">
            <Link to="/terms" className="text-ink-2 transition-colors hover:text-accent-ink">
              {t.footer.terms}
            </Link>
            <Link to="/privacy" className="text-ink-2 transition-colors hover:text-accent-ink">
              {t.footer.privacy}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
