import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

import Wordmark from '../components/Wordmark.jsx';
import { LangToggle, ThemeToggle } from '../components/Toggles.jsx';
import { useLang } from '../lib/i18n.jsx';

/**
 * Halaman legal dipakai dua rute: /terms dan /privacy. Isi diambil dari
 * kamus (`t.legal[doc]`), jadi teksnya ikut bahasa aktif. Tata letaknya
 * sengaja ringkas: kolom baca sempit, satu aksen, tanpa CTA pemasaran.
 */
export default function Legal({ doc }) {
  const reduceMotion = useReducedMotion();
  const { t } = useLang();
  const copy = t.legal[doc];

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[820px] items-center justify-between gap-6 px-4 md:h-[72px] md:px-8">
          <Link to="/" className="shrink-0" aria-label={t.nav.brandToTop}>
            <Wordmark />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] flex-1 px-4 py-16 md:px-8 md:py-24">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-sm text-ink-2 transition-colors hover:text-accent-ink"
        >
          <ArrowLeft
            size={16}
            weight="bold"
            className="transition-transform duration-300 group-hover:-translate-x-0.5"
          />
          {t.legal.backHome}
        </Link>

        <motion.article
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8"
        >
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase">
            {t.legal.updated}
          </p>
          <h1 className="mt-4 text-3xl leading-[1.1] md:text-5xl">{copy.title}</h1>
          <p className="mt-6 max-w-[60ch] leading-relaxed text-ink-2">{copy.intro}</p>

          <div className="mt-12 space-y-10">
            {copy.sections.map((section, index) => (
              <section key={section.h}>
                <h2 className="flex items-baseline gap-3 text-xl md:text-2xl">
                  <span className="font-mono text-sm text-accent-ink">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {section.h}
                </h2>
                <p className="mt-3 max-w-[64ch] leading-relaxed text-ink-2">{section.p}</p>
              </section>
            ))}
          </div>
        </motion.article>
      </main>

      <footer className="border-t border-line bg-canvas-2">
        <div className="mx-auto flex max-w-[820px] flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center md:px-8">
          <Wordmark />
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/terms" className="text-ink-2 transition-colors hover:text-accent-ink">
              {t.footer.terms}
            </Link>
            <Link to="/privacy" className="text-ink-2 transition-colors hover:text-accent-ink">
              {t.footer.privacy}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
