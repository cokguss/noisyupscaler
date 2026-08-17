/**
 * Mark: kotak kecil di dalam kotak besar, membaca sebagai "kecil menjadi besar".
 * Geometri sederhana saja, bukan ilustrasi.
 */
export default function Wordmark({ compact = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" className="shrink-0">
        <rect
          x="1.1"
          y="1.1"
          width="23.8"
          height="23.8"
          rx="6"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1.4"
        />
        <rect x="5.5" y="14" width="6.5" height="6.5" rx="1.6" fill="currentColor" opacity="0.45" />
        <rect x="13" y="5.5" width="7.5" height="7.5" rx="1.8" fill="var(--accent)" />
      </svg>
      {!compact && (
        <span className="text-[15px] leading-none font-medium tracking-tight text-ink">
          Noisy Uspcaler
        </span>
      )}
    </span>
  );
}
