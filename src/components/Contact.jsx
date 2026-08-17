import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, GithubLogo, InstagramLogo, TelegramLogo } from '@phosphor-icons/react';

import { useLang } from '../lib/i18n.jsx';

/**
 * Kontak developer. Tiga kanal sosial sebagai kartu yang bisa diklik,
 * memakai logo dari keluarga ikon yang sama (Phosphor). Tautan eksternal
 * dibuka di tab baru dengan rel aman.
 */
const CHANNELS = [
  {
    id: 'instagram',
    icon: InstagramLogo,
    label: 'Instagram',
    handle: '@fagubitch.exe',
    href: 'https://instagram.com/fagubitch.exe',
    descKey: 'instaDesc',
  },
  {
    id: 'github',
    icon: GithubLogo,
    label: 'GitHub',
    handle: 'cokguss',
    href: 'https://github.com/cokguss',
    descKey: 'githubDesc',
  },
  {
    id: 'telegram',
    icon: TelegramLogo,
    label: 'Telegram',
    handle: 'noisy05',
    href: 'https://t.me/noisy05',
    descKey: 'telegramDesc',
  },
];

export default function Contact() {
  const reduceMotion = useReducedMotion();
  const { t } = useLang();

  return (
    <section id="kontak" className="scroll-mt-24 border-t border-line py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase">
            {t.contact.kicker}
          </p>
          <h2 className="mt-4 text-3xl leading-[1.1] md:text-5xl">{t.contact.heading}</h2>
          <p className="mt-5 max-w-[52ch] leading-relaxed text-ink-2">{t.contact.sub}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {CHANNELS.map((channel, index) => {
            const Icon = channel.icon;
            return (
              <motion.a
                key={channel.id}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group panel flex flex-col gap-4 p-6 transition-colors hover:border-accent/50"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent-ink transition-transform duration-300 group-hover:-translate-y-0.5">
                    <Icon size={22} weight="fill" />
                  </span>
                  <ArrowUpRight
                    size={18}
                    weight="bold"
                    className="text-ink-3 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-ink"
                  />
                </div>
                <div>
                  <p className="text-lg text-ink">{channel.label}</p>
                  <p className="mt-0.5 font-mono text-[13px] text-accent-ink">{channel.handle}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    {t.contact[channel.descKey]}
                  </p>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
