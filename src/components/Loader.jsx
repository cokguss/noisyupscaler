import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import Wordmark from './Wordmark.jsx';
import { useLang } from '../lib/i18n.jsx';

/**
 * Layar-muat bergaya seperti proyek referensi pengguna: wordmark dengan
 * pecahan warna, label MEMUAT/LOADING, bilah progres, dan penghitung 0-100%.
 * Muncul sekali di awal, lalu memudar. Palet tetap satu aksen (acid lime).
 *
 * Penghitung memakai kurva easing supaya terasa hidup, bukan linear kaku.
 * Saat reduced-motion, layar tampil sekejap lalu langsung hilang.
 */
export default function Loader({ onDone }) {
  const reduceMotion = useReducedMotion();
  const { t } = useLang();
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setPct(100);
      const done = setTimeout(() => setGone(true), 260);
      return () => clearTimeout(done);
    }

    const total = 1150; // durasi hitung mundur, ms
    const start = performance.now();
    let raf = 0;

    const tick = (now) => {
      const p = Math.min(1, (now - start) / total);
      // easeOutCubic: cepat di awal, melambat menjelang 100.
      const eased = 1 - Math.pow(1 - p, 3);
      setPct(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setGone(true), 320);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!gone && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-canvas"
          initial={false}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          {/* Cahaya aksen lembut di belakang, senada dengan hero. */}
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.14] blur-[120px]"
            style={{ background: 'radial-gradient(circle, var(--accent), transparent 68%)' }}
          />

          <div className="relative flex w-full max-w-sm flex-col items-center px-6">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <Wordmark compact />
              <span
                className="glitch text-2xl font-medium tracking-tight"
                data-text="Noisy Uspcaler"
              >
                Noisy Uspcaler
              </span>
            </motion.div>

            <div className="mt-8 flex w-full items-center justify-between font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase">
              <span>{t.loader.label}</span>
              <span className="text-accent-ink tabular-nums">{pct}%</span>
            </div>

            <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${pct}%`, transition: 'width 90ms linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
