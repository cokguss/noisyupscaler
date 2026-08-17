import { useEffect, useState } from 'react';

import Nav from '../components/Nav.jsx';
import Hero from '../components/Hero.jsx';
import Studio from '../components/Studio.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Engines from '../components/Engines.jsx';
import Faq from '../components/Faq.jsx';
import Contact from '../components/Contact.jsx';
import Footer from '../components/Footer.jsx';
import Loader from '../components/Loader.jsx';
import { useLang } from '../lib/i18n.jsx';

/**
 * Layar-muat hanya tampil sekali per sesi tab, disimpan di sessionStorage:
 *   - refresh berkali-kali di tab yang sama TIDAK memicunya lagi,
 *   - tab baru / jendela baru / browser baru tetap menampilkannya
 *     (sessionStorage bersih untuk tiap konteks tab/jendela),
 *   - kembali dari /terms atau /privacy juga tidak memicunya.
 * Try/catch mengamankan mode privat / iframe yang memblokir storage —
 * bila storage tak tersedia, loader tampil tiap muat (fallback aman).
 */
const INTRO_KEY = 'noisy-intro-shown';

function introAlreadyShown() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroShown() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    /* abaikan: storage diblokir, biarkan loader tampil lagi lain kali */
  }
}

export default function Landing() {
  const { t } = useLang();
  const [loading, setLoading] = useState(() => !introAlreadyShown());

  // Tandai segera begitu loader diputuskan tampil, jadi refresh di TENGAH
  // intro pun langsung melewatinya, bukan hanya setelah animasi selesai.
  useEffect(() => {
    if (loading) markIntroShown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {loading && (
        <Loader
          onDone={() => {
            markIntroShown();
            setLoading(false);
          }}
        />
      )}

      <a
        href="#studio"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-fg"
      >
        {t.nav.toStudio}
      </a>

      <Nav />
      <main id="atas">
        <Hero />
        <Studio />
        <HowItWorks />
        <Engines />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
