import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useTransform } from 'motion/react';
import { ArrowsHorizontal, MagnifyingGlassPlus } from '@phosphor-icons/react';

import { useLang } from '../lib/i18n.jsx';

const ZOOM_STEPS = [1, 2, 4];

/**
 * Pembanding dua gambar dengan pemisah yang bisa digeser.
 * Posisi pemisah disimpan sebagai motion value supaya drag tidak
 * memicu render ulang React pada setiap frame.
 */
export default function CompareSlider({ before, after, beforeLabel, afterLabel, aspect = 4 / 3 }) {
  const { t } = useLang();
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const draggingRef = useRef(false);
  const [zoom, setZoom] = useState(1);

  const position = useMotionValue(50);
  const inset = useTransform(position, (v) => 100 - v);
  const clipPath = useMotionTemplate`inset(0 ${inset}% 0 0)`;
  const handleLeft = useMotionTemplate`${position}%`;

  // aria-valuenow diperbarui secara imperatif: nilai kontinu tidak boleh
  // memicu render ulang, tapi pembaca layar tetap butuh nilainya.
  useEffect(() => {
    const node = handleRef.current;
    if (!node) return;
    const sync = (v) => node.setAttribute('aria-valuenow', String(Math.round(v)));
    sync(position.get());
    return position.on('change', sync);
  }, [position]);

  const setFromClientX = useCallback(
    (clientX) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      position.set(Math.min(100, Math.max(0, pct)));
    },
    [position],
  );

  const onPointerDown = (event) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setFromClientX(event.clientX);
  };

  const onPointerMove = (event) => {
    if (!draggingRef.current) return;
    setFromClientX(event.clientX);
  };

  const stopDragging = (event) => {
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const onKeyDown = (event) => {
    const step = event.shiftKey ? 10 : 2;
    if (event.key === 'ArrowLeft') {
      position.set(Math.max(0, position.get() - step));
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      position.set(Math.min(100, position.get() + step));
      event.preventDefault();
    } else if (event.key === 'Home') {
      position.set(0);
      event.preventDefault();
    } else if (event.key === 'End') {
      position.set(100);
      event.preventDefault();
    }
  };

  const cycleZoom = () => setZoom((z) => ZOOM_STEPS[(ZOOM_STEPS.indexOf(z) + 1) % ZOOM_STEPS.length]);

  const imageStyle = {
    transform: `scale(${zoom})`,
    transition: 'transform 320ms var(--ease-out-expo)',
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        className="relative w-full touch-none overflow-hidden rounded-[10px] border border-line bg-surface-2 select-none"
        style={{ aspectRatio: String(aspect) }}
      >
        <img
          src={before}
          alt={t.studio.compare.beforeAlt(beforeLabel)}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={imageStyle}
        />

        <motion.div className="absolute inset-0" style={{ clipPath }}>
          <img
            src={after}
            alt={t.studio.compare.afterAlt(afterLabel)}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            style={imageStyle}
          />
        </motion.div>

        {/* Pemisah dan pegangan */}
        <motion.div
          className="absolute top-0 bottom-0 z-10 w-px bg-accent"
          style={{ left: handleLeft }}
        >
          <div
            ref={handleRef}
            role="slider"
            tabIndex={0}
            aria-label={t.studio.compare.srLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-orientation="horizontal"
            onKeyDown={onKeyDown}
            className="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-accent text-accent-fg shadow-[0_4px_16px_rgb(0_0_0/0.35)] transition-transform active:scale-95"
          >
            <ArrowsHorizontal size={18} weight="bold" />
          </div>
        </motion.div>

        {/* Penanda sisi */}
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-canvas/80 px-2.5 py-1 font-mono text-[10px] tracking-wider text-ink-2 uppercase backdrop-blur-sm">
          {afterLabel}
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-canvas/80 px-2.5 py-1 font-mono text-[10px] tracking-wider text-ink-2 uppercase backdrop-blur-sm">
          {beforeLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-3">{t.studio.compare.hint}</p>
        <button
          type="button"
          onClick={cycleZoom}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
        >
          <MagnifyingGlassPlus size={13} weight="bold" />
          {t.studio.compare.zoom(zoom)}
        </button>
      </div>
    </div>
  );
}
