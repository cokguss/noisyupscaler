import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Landing from './pages/Landing.jsx';
import Legal from './pages/Legal.jsx';

/** Setiap pindah rute, mulai dari atas halaman (kecuali ada anchor #). */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      {/* Grain: lapisan fixed, pointer-events-none, tidak ikut menggulir. */}
      <div className="grain" aria-hidden="true" />

      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/terms" element={<Legal doc="terms" />} />
        <Route path="/privacy" element={<Legal doc="privacy" />} />
        {/* Rute tak dikenal jatuh ke beranda. */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </>
  );
}
