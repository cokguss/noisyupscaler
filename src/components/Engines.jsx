import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle, Lightning, Sparkle } from '@phosphor-icons/react';

import { useLang } from '../lib/i18n.jsx';

/**
 * Angka di bawah berasal dari pengukuran nyata, bukan klaim pemasaran.
 * Diukur lewat `npm run benchmark` dan `scripts/e2e.js` pada gambar uji
 * 400 x 300 piksel dengan pembesaran 4x, beberapa kali jalan.
 *   Live3D     : 7,4 detik dan 10,7 detik  -> WebP, sekitar 95 sampai 115 KB
 *   Swiftspeed : 32,9 detik dan 77,7 detik -> PNG, sekitar 2,8 sampai 3,9 MB
 *   ImgUpscaler: gagal, waktu tunggu habis pada 115 detik. Tidak dipakai.
 * Angka & satuan yang netral bahasa tetap di sini; label & prosa dari kamus.
 */
const ENGINE_META = [
  {
    id: 'fast',
    vendor: 'Live3D',
    icon: Lightning,
    seconds: '7-11',
    recommended: true,
    output: '1600 x 1200 WebP',
  },
  {
    id: 'quality',
    vendor: 'Swiftspeed',
    icon: Sparkle,
    seconds: '30-80',
    recommended: false,
    output: '1600 x 1200 PNG',
  },
];

export default function Engines() {
  const reduceMotion = useReducedMotion();
  const { t } = useLang();

  return (
    <section id="engine" className="scroll-mt-24 border-t border-line bg-canvas-2 py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl leading-[1.1] md:text-5xl">{t.engines.heading}</h2>
          <p className="mt-5 max-w-[58ch] leading-relaxed text-ink-2">{t.engines.sub}</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-5">
          {ENGINE_META.map((engine, index) => {
            const Icon = engine.icon;
            const copy = t.engines.items[engine.id];
            const facts = [
              [t.engines.factLabels.output, engine.output],
              [t.engines.factLabels.size, copy.size],
              [t.engines.factLabels.compression, copy.compression],
            ];
            return (
              <motion.article
                key={engine.id}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`panel flex flex-col p-6 md:p-8 ${
                  engine.recommended ? 'border-accent/45' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent-ink">
                      <Icon size={18} weight="bold" />
                    </span>
                    <div>
                      <h3 className="text-lg leading-tight">{copy.name}</h3>
                      <p className="mt-0.5 font-mono text-[11px] text-ink-3">{engine.vendor}</p>
                    </div>
                  </div>
                  {engine.recommended && (
                    <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-fg">
                      {t.engines.recommended}
                    </span>
                  )}
                </div>

                {/* Waktu proses sebagai angka besar: pembanding utama antar engine. */}
                <p className="mt-7 font-mono text-4xl tracking-tight text-ink md:text-5xl">
                  {engine.seconds}
                  <span className="ml-1.5 text-base text-ink-3">{t.engines.secondsLabel}</span>
                </p>

                <dl className="mt-6 space-y-2.5 border-t border-line pt-5">
                  {facts.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm text-ink-2">{label}</dt>
                      <dd className="font-mono text-sm text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-ink-2">
                  <CheckCircle size={16} weight="bold" className="mt-0.5 shrink-0 text-accent-ink" />
                  {copy.bestFor}
                </p>
              </motion.article>
            );
          })}
        </div>

        <p className="mt-6 max-w-[70ch] font-mono text-[11px] leading-relaxed text-ink-3">
          {t.engines.footnote}
        </p>
      </div>
    </section>
  );
}
