import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowRight } from '@phosphor-icons/react';

import { useLang } from '../lib/i18n.jsx';

const EASE = [0.16, 1, 0.3, 1];

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const { t } = useLang();
  const sectionRef = useRef(null);

  // Parallax digerakkan oleh useScroll, bukan listener scroll manual.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const backY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const frontY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);

  const rise = (delay) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.75, delay, ease: EASE },
        };

  return (
    <section
      id="atas"
      ref={sectionRef}
      className="relative flex min-h-[calc(100dvh-72px)] items-center overflow-hidden pt-10 pb-16 md:pt-16"
    >
      {/* Latar: cahaya aksen lembut, tanpa mesh gradient berwarna-warni. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/4 -right-1/4 h-[520px] w-[520px] rounded-full opacity-[0.16] blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent 68%)' }}
      />

      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-12 px-4 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* ---------- Kolom teks ---------- */}
        <div className="max-w-xl">
          <motion.h1
            {...rise(0.05)}
            className="text-[2.6rem] leading-[1.08] tracking-[-0.04em] sm:text-6xl lg:text-[4.2rem]"
          >
            {t.hero.titleA}
            <br />
            {t.hero.titleB}{' '}
            {/* Penekanan memakai italic dari font yang sama, plus garis bawah aksen.
                pb-[0.1em] menyediakan ruang bagi ekor huruf turun (j/g/p) agar tidak terpotong. */}
            <span className="relative inline-block pb-[0.1em] italic">
              {t.hero.emphasis}
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-[0.07em] rounded-full bg-accent"
                initial={reduceMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
                style={{ originX: 0 }}
              />
            </span>
          </motion.h1>

          <motion.p {...rise(0.16)} className="mt-6 max-w-[46ch] text-base leading-relaxed text-ink-2 md:text-lg">
            {t.hero.subtitle}
          </motion.p>

          <motion.div {...rise(0.26)} className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#studio"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium whitespace-nowrap text-accent-fg transition-transform hover:brightness-105 active:translate-y-px"
            >
              {t.hero.ctaPrimary}
              <ArrowRight
                size={16}
                weight="bold"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </a>
            <a
              href="#cara"
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 text-sm whitespace-nowrap text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              <ArrowDown size={15} weight="bold" />
              {t.hero.ctaSecondary}
            </a>
          </motion.div>
        </div>

        {/* ---------- Kolom gambar: dua foto nyata, disusun tumpang tindih ---------- */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          className="relative mx-auto w-full max-w-[520px] lg:mx-0"
        >
          <motion.div
            style={reduceMotion ? undefined : { y: backY }}
            className="relative overflow-hidden rounded-2xl border border-line shadow-[var(--shadow-panel)]"
          >
            <img
              src="https://picsum.photos/seed/noisy-hero-utama/680/850"
              alt={t.hero.imgMain}
              width={680}
              height={850}
              fetchPriority="high"
              decoding="async"
              className="aspect-[4/5] w-full object-cover"
            />
          </motion.div>

          <motion.div
            style={reduceMotion ? undefined : { y: frontY }}
            className="absolute -bottom-8 -left-4 w-[42%] overflow-hidden rounded-2xl border border-line-strong shadow-[var(--shadow-panel)] sm:-left-8 sm:w-[38%]"
          >
            {/* Seed sama dengan gambar utama, rasio kotak, jadi picsum
                mengembalikan potongan dari foto yang sama. Terbaca sebagai
                detail dari foto di belakangnya, bukan gambar acak lain. */}
            <img
              src="https://picsum.photos/seed/noisy-hero-utama/400/400"
              alt={t.hero.imgInset}
              width={400}
              height={400}
              decoding="async"
              className="aspect-square w-full object-cover"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
