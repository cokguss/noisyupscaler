import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/* ===========================================================
   i18n ringan tanpa dependensi.

   Bahasa dikunci di <html lang> dan disimpan di localStorage
   ('noisy-lang'). index.html menetapkannya sebelum paint pertama
   supaya tidak ada kedipan bahasa.

   Nilai kamus boleh berupa string atau fungsi (untuk interpolasi,
   mis. jumlah skala atau dimensi). Komponen memakai objek `t`
   milik bahasa aktif secara langsung — lebih jelas daripada
   jalur string ajaib.
   =========================================================== */

const DICT = {
  id: {
    nav: {
      links: [
        { href: '#studio', label: 'Studio' },
        { href: '#cara', label: 'Cara kerja' },
        { href: '#engine', label: 'Engine' },
        { href: '#tanya', label: 'Tanya jawab' },
        { href: '#kontak', label: 'Kontak' },
      ],
      cta: 'Mulai',
      toStudio: 'Lompat ke studio',
      brandToTop: 'Noisy Uspcaler, ke bagian atas',
      themeToDark: 'Ganti ke mode gelap',
      themeToLight: 'Ganti ke mode terang',
      langLabel: 'Ganti bahasa',
    },
    hero: {
      titleA: 'Resolusi naik 4x,',
      titleB: 'detail tetap',
      emphasis: 'tajam.',
      subtitle:
        'Rekonstruksi detail berbasis AI untuk foto, ilustrasi, dan aset produk. Langsung dari browser, tanpa daftar akun.',
      ctaPrimary: 'Perbesar gambar',
      ctaSecondary: 'Lihat cara kerjanya',
      imgMain: 'Foto bertekstur sebagai contoh bahan yang diperbesar',
      imgInset: 'Potongan detail dari foto yang sama',
    },
    studio: {
      heading: 'Perbesar gambarmu sekarang.',
      sub: 'Jatuhkan gambar ke area di bawah, tempel dari papan klip, atau pilih salah satu contoh. Tidak perlu daftar akun.',
      dropTitle: 'Jatuhkan gambar di sini',
      dropSub: 'atau klik untuk memilih berkas, atau tekan Ctrl+V',
      dropHint: 'PNG, JPG, WebP - maksimal 12 MB',
      levelLegend: 'Tingkat pembesaran',
      engineLegend: 'Engine',
      engineFallbackNote: 'Bila engine pilihanmu gagal, satunya dipakai otomatis.',
      samplesTitle: 'Coba dengan contoh',
      samples: { kota: 'Arsitektur', satwa: 'Satwa', potret: 'Potret', alam: 'Lanskap' },
      engines: {
        fast: { name: 'Cepat', note: 'Sekitar 7 sampai 11 detik, hasil WebP ringan' },
        quality: {
          name: 'Kualitas maksimal',
          note: 'Sekitar 30 sampai 80 detik, hasil PNG tanpa kompresi lossy',
        },
      },
      previewAlt: (name) => `Pratinjau ${name}`,
      becomes: (w, h) => `menjadi ${w} x ${h} px`,
      processingFallback: 'Memproses',
      cancel: 'Batalkan',
      upscaleN: (scale) => `Perbesar ${scale}x`,
      reprocess: 'Proses ulang',
      download: 'Unduh hasil',
      clear: 'Kosongkan',
      fellBack: (label) =>
        `Engine pilihanmu sedang tidak merespons, jadi hasil ini diproses oleh ${label}.`,
      optimized: (w, h) =>
        `Foto ini berukuran sangat besar, jadi otomatis diperkecil ke ${w} x ${h} px lebih dulu supaya proses tidak melewati batas waktu. Hasil di bawah diperbesar dari ukuran itu.`,
      stat: {
        resOrig: 'Resolusi asli',
        resOut: 'Resolusi hasil',
        sizeOut: 'Ukuran hasil',
        time: 'Waktu proses',
      },
      compare: {
        before: 'Asli',
        after: (scale) => `Hasil ${scale}x`,
        hint: 'Geser pemisah, atau fokuskan lalu pakai tombol panah.',
        zoom: (z) => `Perbesar ${z}x`,
        srLabel: 'Geser untuk membandingkan hasil sebelum dan sesudah',
        beforeAlt: (label) => `Sebelum diperbesar: ${label}`,
        afterAlt: (label) => `Sesudah diperbesar: ${label}`,
      },
      errors: {
        unsupported: 'Format belum didukung. Gunakan PNG, JPG, atau WebP.',
        tooLarge: (size) => `Berkas ${size} melewati batas 12 MB.`,
        generic: 'Proses gagal',
      },
    },
    how: {
      kicker: 'Cara kerja',
      heading: 'Tiga langkah, selesai.',
      sub: 'Tidak ada antrean berbayar, tidak ada tanda air, dan gambarmu tidak disimpan permanen di server kami.',
      steps: [
        {
          verb: 'Unggah',
          body: 'Jatuhkan berkas PNG, JPG, atau WebP sampai 12 MB. Bisa juga tempel langsung dari papan klip dengan Ctrl+V.',
        },
        {
          verb: 'Atur',
          body: 'Pilih pembesaran 2x atau 4x, lalu tentukan engine: cepat untuk hasil ringan, atau kualitas maksimal untuk PNG tanpa kompresi lossy.',
        },
        {
          verb: 'Unduh',
          body: 'Bandingkan hasil dengan aslinya lewat pemisah yang bisa digeser, perbesar sampai 4x untuk memeriksa detail, lalu simpan berkasnya.',
        },
      ],
    },
    engines: {
      heading: 'Dua engine, satu tombol.',
      sub: 'Keduanya menghasilkan resolusi 4x yang identik. Yang berbeda adalah kecepatan dan cara berkasnya dikompresi. Bila engine pilihanmu gagal, satunya langsung menggantikan.',
      recommended: 'Bawaan',
      secondsLabel: 'detik',
      factLabels: { output: 'Keluaran', size: 'Ukuran berkas', compression: 'Kompresi' },
      footnote:
        'Diukur beberapa kali pada gambar uji 400 x 300 piksel dengan pembesaran 4x. Waktu nyata berbeda menurut ukuran gambar dan beban engine, jadi angka di atas ditulis sebagai rentang.',
      items: {
        fast: {
          name: 'Cepat',
          compression: 'Lossy',
          size: '95 sampai 115 KB',
          bestFor: 'Unggahan web, media sosial, dan pratinjau cepat yang butuh berkas ringan.',
        },
        quality: {
          name: 'Kualitas maksimal',
          compression: 'Tanpa lossy',
          size: '2,8 sampai 3,9 MB',
          bestFor: 'Cetak, penyuntingan lanjutan, dan arsip yang tidak boleh kena kompresi lossy.',
        },
      },
    },
    faq: {
      heading: 'Tanya jawab.',
      items: [
        {
          q: 'Apakah gratis?',
          a: 'Ya, dan tanpa daftar akun. Situs ini memakai kuota gratis dari layanan upscaler pihak ketiga, jadi bila salah satu engine sedang penuh, engine cadangan otomatis dipakai.',
        },
        {
          q: 'Gambarku disimpan di server?',
          a: 'Tidak. Gambar hanya diteruskan ke engine untuk diproses lalu dialirkan kembali ke browsermu. Tidak ada gambar asli maupun hasil yang ditulis ke disk server kami.',
        },
        {
          q: 'Berapa batas ukuran berkasnya?',
          a: 'Sampai 12 MB per gambar, format PNG, JPG, atau WebP. Untuk hasil terbaik, gambar sumber yang kecil justru paling terasa peningkatannya.',
        },
        {
          q: 'Kenapa hasil dari engine cepat berformat WebP?',
          a: 'Karena engine tersebut mengembalikan WebP, yang jauh lebih ringan pada resolusi sama. Bila kamu butuh PNG tanpa kompresi lossy, pilih engine kualitas maksimal.',
        },
        {
          q: 'Apakah ada tanda air pada hasilnya?',
          a: 'Tidak ada. Berkas yang kamu unduh adalah keluaran mentah dari engine, tanpa tambahan apa pun dari kami.',
        },
      ],
    },
    contact: {
      kicker: 'Kontak',
      heading: 'Hubungi developer.',
      sub: 'Punya masukan, laporan bug, atau ingin kerja sama? Sapa lewat salah satu kanal di bawah.',
      instaDesc: 'Cerita di balik layar dan pembaruan',
      githubDesc: 'Kode sumber dan proyek lain',
      telegramDesc: 'Obrolan langsung dan dukungan cepat',
      cta: 'Buka',
    },
    footer: {
      ctaHeading: 'Punya gambar yang terlalu kecil? Perbesar sekarang.',
      ctaButton: 'Mulai',
      disclaimer:
        'Pemrosesan gambar dijalankan oleh layanan pihak ketiga, Live3D dan Swiftspeed. Gambar hanya diteruskan untuk diproses, tidak disimpan di server kami.',
      terms: 'Ketentuan layanan',
      privacy: 'Kebijakan privasi',
      backHome: 'Kembali ke beranda',
      rights: 'Dibuat untuk memperbesar gambar tanpa ribet.',
    },
    loader: { label: 'MEMUAT' },
    progress: {
      preparing: 'Menyiapkan permintaan',
      fetchingSample: 'Mengambil gambar contoh',
      received: 'Gambar diterima',
      sending: 'Mengirim gambar ke engine',
      queue: 'Membuat antrean proses',
      reconstruct: 'Merekonstruksi detail',
      fetching: 'Mengambil hasil',
      switching: (label) => `Beralih ke engine cadangan ${label}`,
      done: 'Selesai',
    },
    apiErrors: {
      noImage: 'Tidak ada gambar yang dikirim',
      empty: 'Berkas kosong',
      tooLarge: 'Ukuran berkas melewati 12 MB',
      unsupported: 'Format tidak didukung. Pakai PNG, JPG, atau WebP',
      allFailed: 'Semua engine gagal memproses gambar ini. Coba lagi sebentar.',
      timedOut: 'Gambar ini terlalu besar hingga proses melebihi batas waktu. Coba pakai faktor 2x atau perkecil resolusinya dulu.',
      badSample: 'URL contoh tidak valid',
      sampleNotAllowed: 'Sumber contoh tidak diizinkan',
      disconnected: 'Koneksi terputus sebelum hasil selesai',
      rejected: (status) => `Server menolak permintaan (${status})`,
    },
    legal: {
      updated: 'Diperbarui 18 Agustus 2026',
      backHome: 'Kembali ke beranda',
      terms: {
        title: 'Ketentuan Layanan',
        intro:
          'Dengan memakai Noisy Uspcaler, kamu menyetujui ketentuan berikut. Layanan ini disediakan apa adanya untuk memperbesar resolusi gambar.',
        sections: [
          {
            h: 'Penggunaan layanan',
            p: 'Noisy Uspcaler memperbesar gambar yang kamu unggah memakai layanan AI pihak ketiga. Kamu boleh memakainya untuk keperluan pribadi maupun komersial, selama kamu memiliki hak atas gambar yang diproses.',
          },
          {
            h: 'Konten yang kamu unggah',
            p: 'Kamu bertanggung jawab penuh atas gambar yang kamu proses. Dilarang mengunggah konten ilegal, melanggar hak cipta, atau yang melanggar hak orang lain. Kami dapat memblokir penyalahgunaan.',
          },
          {
            h: 'Ketersediaan',
            p: 'Layanan bergantung pada kuota gratis dari engine pihak ketiga (Live3D dan Swiftspeed). Karena itu ketersediaan tidak dijamin, dan proses bisa gagal atau tertunda bila engine sedang penuh.',
          },
          {
            h: 'Batasan tanggung jawab',
            p: 'Layanan disediakan tanpa jaminan apa pun. Kami tidak bertanggung jawab atas kehilangan data, hasil yang tidak sesuai harapan, atau kerugian yang timbul dari pemakaian situs ini.',
          },
          {
            h: 'Perubahan',
            p: 'Ketentuan ini dapat berubah sewaktu-waktu. Perubahan berlaku sejak dipublikasikan di halaman ini.',
          },
        ],
      },
      privacy: {
        title: 'Kebijakan Privasi',
        intro:
          'Privasimu penting. Halaman ini menjelaskan data apa yang diproses saat kamu memakai Noisy Uspcaler dan bagaimana perlakuannya.',
        sections: [
          {
            h: 'Gambar yang kamu proses',
            p: 'Gambar yang kamu unggah diteruskan ke engine pihak ketiga (Live3D atau Swiftspeed) untuk diperbesar, lalu hasilnya dialirkan kembali ke browsermu. Server kami tidak menyimpan gambar asli maupun hasil ke disk.',
          },
          {
            h: 'Data yang kami simpan',
            p: 'Kami tidak meminta akun, nama, atau email. Kami tidak memasang pelacak iklan. Preferensi seperti bahasa dan tema hanya disimpan di peramban kamu sendiri (localStorage), tidak dikirim ke mana pun.',
          },
          {
            h: 'Layanan pihak ketiga',
            p: 'Karena pemrosesan dilakukan oleh Live3D dan Swiftspeed, gambar yang kamu kirim tunduk pada kebijakan privasi masing-masing layanan tersebut saat berada di sistem mereka.',
          },
          {
            h: 'Hosting',
            p: 'Situs ini dihosting di Vercel. Seperti umumnya hosting, Vercel dapat mencatat metadata permintaan (mis. alamat IP) untuk keperluan operasional dan keamanan.',
          },
          {
            h: 'Kontak',
            p: 'Ada pertanyaan soal privasi? Hubungi developer lewat kanal di bagian Kontak pada halaman utama.',
          },
        ],
      },
    },
  },

  en: {
    nav: {
      links: [
        { href: '#studio', label: 'Studio' },
        { href: '#cara', label: 'How it works' },
        { href: '#engine', label: 'Engines' },
        { href: '#tanya', label: 'FAQ' },
        { href: '#kontak', label: 'Contact' },
      ],
      cta: 'Get started',
      toStudio: 'Skip to studio',
      brandToTop: 'Noisy Uspcaler, back to top',
      themeToDark: 'Switch to dark mode',
      themeToLight: 'Switch to light mode',
      langLabel: 'Change language',
    },
    hero: {
      titleA: 'Resolution up 4x,',
      titleB: 'detail stays',
      emphasis: 'sharp.',
      subtitle:
        'AI-based detail reconstruction for photos, illustrations, and product assets. Straight from your browser, no sign-up.',
      ctaPrimary: 'Upscale an image',
      ctaSecondary: 'See how it works',
      imgMain: 'Textured photo as an example of upscalable material',
      imgInset: 'A detail crop from the same photo',
    },
    studio: {
      heading: 'Upscale your image now.',
      sub: 'Drop an image into the area below, paste from your clipboard, or pick one of the samples. No account needed.',
      dropTitle: 'Drop your image here',
      dropSub: 'or click to choose a file, or press Ctrl+V',
      dropHint: 'PNG, JPG, WebP - up to 12 MB',
      levelLegend: 'Upscale factor',
      engineLegend: 'Engine',
      engineFallbackNote: 'If your chosen engine fails, the other one is used automatically.',
      samplesTitle: 'Try a sample',
      samples: { kota: 'Architecture', satwa: 'Wildlife', potret: 'Portrait', alam: 'Landscape' },
      engines: {
        fast: { name: 'Fast', note: 'About 7 to 11 seconds, lightweight WebP output' },
        quality: {
          name: 'Max quality',
          note: 'About 30 to 80 seconds, lossless PNG output',
        },
      },
      previewAlt: (name) => `Preview of ${name}`,
      becomes: (w, h) => `becomes ${w} x ${h} px`,
      processingFallback: 'Processing',
      cancel: 'Cancel',
      upscaleN: (scale) => `Upscale ${scale}x`,
      reprocess: 'Process again',
      download: 'Download result',
      clear: 'Clear',
      fellBack: (label) =>
        `Your chosen engine wasn't responding, so this result was processed by ${label}.`,
      optimized: (w, h) =>
        `This photo was very large, so it was automatically resized to ${w} x ${h} px first to keep the process within the time limit. The result below is upscaled from that size.`,
      stat: {
        resOrig: 'Original resolution',
        resOut: 'Output resolution',
        sizeOut: 'Output size',
        time: 'Processing time',
      },
      compare: {
        before: 'Original',
        after: (scale) => `${scale}x result`,
        hint: 'Drag the divider, or focus it and use the arrow keys.',
        zoom: (z) => `Zoom ${z}x`,
        srLabel: 'Drag to compare the before and after result',
        beforeAlt: (label) => `Before upscaling: ${label}`,
        afterAlt: (label) => `After upscaling: ${label}`,
      },
      errors: {
        unsupported: 'That format isn’t supported yet. Use PNG, JPG, or WebP.',
        tooLarge: (size) => `The ${size} file exceeds the 12 MB limit.`,
        generic: 'Processing failed',
      },
    },
    how: {
      kicker: 'How it works',
      heading: 'Three steps, done.',
      sub: 'No paywalled queue, no watermarks, and your image is never stored permanently on our server.',
      steps: [
        {
          verb: 'Upload',
          body: 'Drop a PNG, JPG, or WebP file up to 12 MB. You can also paste directly from your clipboard with Ctrl+V.',
        },
        {
          verb: 'Adjust',
          body: 'Pick 2x or 4x, then choose the engine: fast for a lightweight file, or max quality for lossless PNG.',
        },
        {
          verb: 'Download',
          body: 'Compare the result against the original with a draggable divider, zoom up to 4x to inspect detail, then save the file.',
        },
      ],
    },
    engines: {
      heading: 'Two engines, one button.',
      sub: 'Both produce identical 4x resolution. What differs is speed and how the file is compressed. If your chosen engine fails, the other takes over instantly.',
      recommended: 'Default',
      secondsLabel: 'seconds',
      factLabels: { output: 'Output', size: 'File size', compression: 'Compression' },
      footnote:
        'Measured several times on a 400 x 300 pixel test image at 4x. Real timing varies with image size and engine load, so the numbers above are written as ranges.',
      items: {
        fast: {
          name: 'Fast',
          compression: 'Lossy',
          size: '95 to 115 KB',
          bestFor: 'Web uploads, social media, and quick previews that need a light file.',
        },
        quality: {
          name: 'Max quality',
          compression: 'Lossless',
          size: '2.8 to 3.9 MB',
          bestFor: 'Print, further editing, and archives that must avoid lossy compression.',
        },
      },
    },
    faq: {
      heading: 'FAQ.',
      items: [
        {
          q: 'Is it free?',
          a: 'Yes, and no account required. This site uses the free quota of third-party upscaler services, so if one engine is busy, the backup engine is used automatically.',
        },
        {
          q: 'Are my images stored on the server?',
          a: 'No. Images are only forwarded to the engine for processing and then streamed back to your browser. Neither the original nor the result is written to our server disk.',
        },
        {
          q: 'What is the file size limit?',
          a: 'Up to 12 MB per image, in PNG, JPG, or WebP. For best results, small source images actually show the biggest improvement.',
        },
        {
          q: 'Why is the fast engine output in WebP?',
          a: 'Because that engine returns WebP, which is far lighter at the same resolution. If you need lossless PNG, pick the max quality engine.',
        },
        {
          q: 'Is there a watermark on the result?',
          a: 'None. The file you download is the raw output from the engine, with nothing added by us.',
        },
      ],
    },
    contact: {
      kicker: 'Contact',
      heading: 'Contact the developer.',
      sub: 'Have feedback, a bug report, or want to collaborate? Say hi through any of the channels below.',
      instaDesc: 'Behind-the-scenes and updates',
      githubDesc: 'Source code and other projects',
      telegramDesc: 'Direct chat and fast support',
      cta: 'Open',
    },
    footer: {
      ctaHeading: 'Got an image that’s too small? Upscale it now.',
      ctaButton: 'Get started',
      disclaimer:
        'Image processing is handled by third-party services, Live3D and Swiftspeed. Images are only forwarded for processing, not stored on our server.',
      terms: 'Terms of service',
      privacy: 'Privacy policy',
      backHome: 'Back to home',
      rights: 'Built to upscale images without the hassle.',
    },
    loader: { label: 'LOADING' },
    progress: {
      preparing: 'Preparing request',
      fetchingSample: 'Fetching sample image',
      received: 'Image received',
      sending: 'Sending image to engine',
      queue: 'Queuing the job',
      reconstruct: 'Reconstructing detail',
      fetching: 'Fetching result',
      switching: (label) => `Switching to backup engine ${label}`,
      done: 'Done',
    },
    apiErrors: {
      noImage: 'No image was sent',
      empty: 'The file is empty',
      tooLarge: 'File size exceeds 12 MB',
      unsupported: 'Unsupported format. Use PNG, JPG, or WebP',
      allFailed: 'All engines failed to process this image. Please try again shortly.',
      timedOut: 'This image is so large the process ran past the time limit. Try the 2x factor or reduce its resolution first.',
      badSample: 'Invalid sample URL',
      sampleNotAllowed: 'Sample source not allowed',
      disconnected: 'The connection dropped before the result finished',
      rejected: (status) => `The server rejected the request (${status})`,
    },
    legal: {
      updated: 'Updated 18 August 2026',
      backHome: 'Back to home',
      terms: {
        title: 'Terms of Service',
        intro:
          'By using Noisy Uspcaler, you agree to the terms below. This service is provided as-is to upscale image resolution.',
        sections: [
          {
            h: 'Use of the service',
            p: 'Noisy Uspcaler upscales the images you upload using third-party AI services. You may use it for personal or commercial purposes, as long as you own the rights to the images you process.',
          },
          {
            h: 'Content you upload',
            p: 'You are fully responsible for the images you process. Uploading illegal content, copyright-infringing material, or anything that violates the rights of others is prohibited. We may block abuse.',
          },
          {
            h: 'Availability',
            p: 'The service relies on the free quota of third-party engines (Live3D and Swiftspeed). Availability is therefore not guaranteed, and processing may fail or be delayed when an engine is busy.',
          },
          {
            h: 'Limitation of liability',
            p: 'The service is provided without any warranty. We are not liable for data loss, results that fall short of expectations, or any damages arising from use of this site.',
          },
          {
            h: 'Changes',
            p: 'These terms may change at any time. Changes take effect once published on this page.',
          },
        ],
      },
      privacy: {
        title: 'Privacy Policy',
        intro:
          'Your privacy matters. This page explains what data is processed when you use Noisy Uspcaler and how it is handled.',
        sections: [
          {
            h: 'Images you process',
            p: 'The images you upload are forwarded to a third-party engine (Live3D or Swiftspeed) to be upscaled, then the result is streamed back to your browser. Our server does not store the original or the result to disk.',
          },
          {
            h: 'Data we keep',
            p: 'We do not ask for an account, name, or email. We do not run advertising trackers. Preferences like language and theme are stored only in your own browser (localStorage) and are never sent anywhere.',
          },
          {
            h: 'Third-party services',
            p: 'Because processing is done by Live3D and Swiftspeed, the images you send are subject to each service’s own privacy policy while in their systems.',
          },
          {
            h: 'Hosting',
            p: 'This site is hosted on Vercel. As with most hosting, Vercel may log request metadata (e.g. IP address) for operational and security purposes.',
          },
          {
            h: 'Contact',
            p: 'Questions about privacy? Reach the developer through the channels in the Contact section on the home page.',
          },
        ],
      },
    },
  },
};

const LangContext = createContext(null);

function readInitialLang() {
  if (typeof document !== 'undefined') {
    const fromHtml = document.documentElement.lang;
    if (fromHtml === 'id' || fromHtml === 'en') return fromHtml;
  }
  return 'id';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('noisy-lang', lang);
    } catch {
      /* penyimpanan diblokir, bahasa tetap berlaku untuk sesi ini */
    }
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggle: () => setLang((prev) => (prev === 'id' ? 'en' : 'id')),
      t: DICT[lang],
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang harus dipakai di dalam LanguageProvider');
  return ctx;
}
