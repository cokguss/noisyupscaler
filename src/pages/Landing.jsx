import { useState } from 'react';

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
 * Layar-muat hanya sekali per pemuatan halaman. Bendera modul ini bertahan
 * selama SPA hidup, jadi kembali dari /terms atau /privacy tidak memicunya lagi.
 */
let introShown = false;

export default function Landing() {
  const { t } = useLang();
  const [loading, setLoading] = useState(!introShown);

  return (
    <>
      {loading && (
        <Loader
          onDone={() => {
            introShown = true;
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
