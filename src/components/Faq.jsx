import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Plus } from '@phosphor-icons/react';

import { useLang } from '../lib/i18n.jsx';

export default function Faq() {
  const [open, setOpen] = useState(0);
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const { t } = useLang();

  return (
    <section id="tanya" className="scroll-mt-24 border-t border-line py-20 md:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 md:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <h2 className="text-3xl leading-[1.1] md:text-5xl lg:sticky lg:top-32 lg:self-start">
          {t.faq.heading}
        </h2>

        <ul className="divide-y divide-line">
          {t.faq.items.map((item, index) => {
            const isOpen = open === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;

            return (
              <li key={item.q}>
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-accent-ink"
                  >
                    <span className="text-base md:text-lg">{item.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-ink-2"
                    >
                      <Plus size={14} weight="bold" />
                    </motion.span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={reduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={reduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[62ch] pb-6 leading-relaxed text-ink-2">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
