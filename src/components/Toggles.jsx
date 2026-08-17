import { useEffect, useState } from 'react';
import { Moon, Sun } from '@phosphor-icons/react';

import { useLang } from '../lib/i18n.jsx';

/** Pengalih tema gelap/terang. Menulis ke localStorage 'noisy-theme'. */
export function ThemeToggle() {
  const { t } = useLang();
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('noisy-theme', theme);
    } catch {
      /* penyimpanan diblokir, tema tetap berlaku untuk sesi ini */
    }
  }, [theme]);

  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === 'dark' ? t.nav.themeToDark : t.nav.themeToLight}
      className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
    >
      {theme === 'dark' ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
    </button>
  );
}

/** Pengalih bahasa ID / EN sebagai pil bersegmen. */
export function LangToggle() {
  const { lang, setLang, t } = useLang();

  return (
    <div
      role="group"
      aria-label={t.nav.langLabel}
      className="flex items-center rounded-full border border-line p-0.5 font-mono text-[11px]"
    >
      {['id', 'en'].map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
              active ? 'bg-accent text-accent-fg' : 'text-ink-3 hover:text-ink'
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
