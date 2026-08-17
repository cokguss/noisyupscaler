import { motion, useReducedMotion } from 'motion/react';
import { CursorClick, DownloadSimple, UploadSimple } from '@phosphor-icons/react';

import { useLang } from '../lib/i18n.jsx';

const ICONS = [UploadSimple, CursorClick, DownloadSimple];

export default function HowItWorks() {
  const reduceMotion = useReducedMotion();
  const { t } = useLang();

  return (
    <section id="cara" className="scroll-mt-24 border-t border-line py-20 md:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 md:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase">
            {t.how.kicker}
          </p>
          <h2 className="mt-4 text-3xl leading-[1.1] md:text-5xl">{t.how.heading}</h2>
          <p className="mt-5 max-w-[42ch] leading-relaxed text-ink-2">{t.how.sub}</p>
        </div>

        <ol className="divide-y divide-line">
          {t.how.steps.map((step, index) => {
            const Icon = ICONS[index];
            return (
              <motion.li
                key={step.verb}
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-5 py-8 first:pt-0 last:pb-0 sm:gap-7"
              >
                <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
                  <Icon size={19} weight="bold" />
                </span>
                <div>
                  <h3 className="text-xl md:text-2xl">{step.verb}</h3>
                  <p className="mt-2.5 max-w-[52ch] leading-relaxed text-ink-2">{step.body}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
