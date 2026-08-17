import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowClockwise,
  CloudArrowUp,
  DownloadSimple,
  Image as ImageIcon,
  Lightning,
  Sparkle,
  Trash,
  WarningCircle,
  X,
} from '@phosphor-icons/react';

import CompareSlider from './CompareSlider.jsx';
import { formatBytes, formatDimensions, formatSeconds, upscale } from '../lib/api.js';
import { useLang } from '../lib/i18n.jsx';

const MAX_BYTES = 12 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

// URL & id netral bahasa; label diambil dari kamus lewat id.
const SAMPLES = [
  { id: 'kota', url: 'https://picsum.photos/seed/noisy-arsitektur/420/315' },
  { id: 'satwa', url: 'https://picsum.photos/seed/noisy-satwa-detail/420/315' },
  { id: 'potret', url: 'https://picsum.photos/seed/noisy-potret-studio/420/315' },
  { id: 'alam', url: 'https://picsum.photos/seed/noisy-lanskap-kabut/420/315' },
];

const ENGINE_ICONS = { fast: Lightning, quality: Sparkle };

/** Terjemahkan kode progres dari server ke kalimat bahasa aktif. */
function translateProgress(t, code, engineLabel) {
  if (!code) return t.studio.processingFallback;
  const entry = t.progress[code];
  if (typeof entry === 'function') return entry(engineLabel);
  return entry || t.studio.processingFallback;
}

/** Terjemahkan galat (lokal maupun dari server) berbasis kode, saat render. */
function renderError(t, error) {
  if (!error) return '';
  const local = t.studio.errors[error.code];
  if (typeof local === 'function') return local(error.size);
  if (local) return local;
  const api = t.apiErrors[error.code];
  if (typeof api === 'function') return api(error.status);
  return api || t.studio.errors.generic;
}

export default function Studio() {
  const reduceMotion = useReducedMotion();
  const { t, lang } = useLang();
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [source, setSource] = useState(null); // { file?, sampleUrl?, previewUrl, name, bytes }
  const [sourceDims, setSourceDims] = useState(null);
  const [scale, setScale] = useState(4);
  const [engine, setEngine] = useState('fast');
  const [status, setStatus] = useState('idle'); // idle | working | done | error
  const [progress, setProgress] = useState({ pct: 0, code: '', engineLabel: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null); // { code, size?, status? }
  const [dragging, setDragging] = useState(false);

  const releaseObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(
    () => () => {
      releaseObjectUrl();
      abortRef.current?.abort();
    },
    [],
  );

  const resetOutput = () => {
    setResult(null);
    setError(null);
    setStatus('idle');
    setProgress({ pct: 0, code: '', engineLabel: '' });
  };

  const acceptFile = useCallback((file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError({ code: 'unsupported' });
      setStatus('error');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError({ code: 'tooLarge', size: formatBytes(file.size, lang) });
      setStatus('error');
      return;
    }
    releaseObjectUrl();
    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;
    setSource({ file, previewUrl, name: file.name, bytes: file.size });
    setSourceDims(null);
    resetOutput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const acceptSample = (sample) => {
    releaseObjectUrl();
    setSource({
      sampleUrl: sample.url,
      previewUrl: sample.url,
      name: `contoh-${sample.id}.jpg`,
      bytes: null,
    });
    setSourceDims(null);
    resetOutput();
  };

  // Tempel gambar langsung dari papan klip.
  useEffect(() => {
    const onPaste = (event) => {
      const item = [...(event.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
      if (!item) return;
      const file = item.getAsFile();
      if (file) acceptFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [acceptFile]);

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer?.files?.[0]);
  };

  const clearAll = () => {
    abortRef.current?.abort();
    releaseObjectUrl();
    setSource(null);
    setSourceDims(null);
    resetOutput();
    if (inputRef.current) inputRef.current.value = '';
  };

  const run = async () => {
    if (!source) return;
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('working');
    setError(null);
    setResult(null);
    setProgress({ pct: 4, code: 'preparing', engineLabel: '' });

    try {
      const done = await upscale({
        file: source.file,
        sampleUrl: source.sampleUrl,
        scale,
        engine,
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === 'progress') {
            setProgress({ pct: event.pct, code: event.code, engineLabel: event.engineLabel });
          }
          if (event.type === 'input') setSourceDims(event.input);
        },
      });
      setResult(done);
      setStatus('done');
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('idle');
        setProgress({ pct: 0, code: '', engineLabel: '' });
        return;
      }
      setError({ code: err.code || 'generic', status: err.meta?.status });
      setStatus('error');
    } finally {
      abortRef.current = null;
    }
  };

  const working = status === 'working';

  return (
    <section id="studio" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl leading-[1.1] md:text-5xl">{t.studio.heading}</h2>
          <p className="mt-4 max-w-[60ch] leading-relaxed text-ink-2">{t.studio.sub}</p>
        </div>

        <div className="panel overflow-hidden shadow-[var(--shadow-panel)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* ---------- Area kerja ---------- */}
            <div className="flex min-w-0 flex-col p-4 md:p-7">
              <AnimatePresence mode="wait" initial={false}>
                {/* Keadaan kosong */}
                {!source && (
                  <motion.div
                    key="empty"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-1"
                  >
                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      className={`flex min-h-[340px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-[10px] border border-dashed p-8 text-center transition-colors ${
                        dragging
                          ? 'border-accent bg-accent-soft'
                          : 'border-line-strong hover:border-accent hover:bg-surface-2'
                      }`}
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPTED.join(',')}
                        className="sr-only"
                        onChange={(e) => acceptFile(e.target.files?.[0])}
                      />
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent-ink">
                        <CloudArrowUp size={26} weight="bold" />
                      </span>
                      <span className="space-y-1.5">
                        <span className="block text-lg text-ink">{t.studio.dropTitle}</span>
                        <span className="block text-sm text-ink-2">{t.studio.dropSub}</span>
                      </span>
                      <span className="font-mono text-[11px] text-ink-3">{t.studio.dropHint}</span>
                    </label>
                  </motion.div>
                )}

                {/* Sudah ada gambar, belum ada hasil */}
                {source && status !== 'done' && (
                  <motion.div
                    key="preview"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-1 flex-col justify-center space-y-4"
                  >
                    <div className="relative overflow-hidden rounded-[10px] border border-line bg-surface-2">
                      <img
                        src={source.previewUrl}
                        alt={t.studio.previewAlt(source.name)}
                        onLoad={(e) =>
                          setSourceDims((prev) =>
                            prev ?? {
                              width: e.currentTarget.naturalWidth,
                              height: e.currentTarget.naturalHeight,
                            },
                          )
                        }
                        className="mx-auto max-h-[420px] w-auto max-w-full object-contain"
                      />

                      {/* Sapuan pemindai hanya saat proses berjalan, dan mati bila reduced motion. */}
                      {working && !reduceMotion && (
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                          <div
                            className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-accent/25 to-transparent"
                            style={{ animation: 'noisy-sweep 1.9s linear infinite' }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-ink-3">
                      <span className="max-w-[240px] truncate text-ink-2">{source.name}</span>
                      {sourceDims?.width && <span>{formatDimensions(sourceDims, lang)} px</span>}
                      {source.bytes && <span>{formatBytes(source.bytes, lang)}</span>}
                      {sourceDims?.width && (
                        <span className="text-accent-ink">
                          {t.studio.becomes(sourceDims.width * scale, sourceDims.height * scale)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Hasil */}
                {status === 'done' && result && source && (
                  <motion.div
                    key="result"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                  >
                    <CompareSlider
                      before={source.previewUrl}
                      after={result.url}
                      beforeLabel={t.studio.compare.before}
                      afterLabel={t.studio.compare.after(result.scale)}
                      aspect={
                        result.output?.width && result.output?.height
                          ? result.output.width / result.output.height
                          : 4 / 3
                      }
                    />

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 md:grid-cols-4">
                      <Stat
                        label={t.studio.stat.resOrig}
                        value={`${formatDimensions(result.input, lang)} px`}
                      />
                      <Stat
                        label={t.studio.stat.resOut}
                        value={`${formatDimensions(result.output, lang)} px`}
                        highlight
                      />
                      <Stat label={t.studio.stat.sizeOut} value={formatBytes(result.output?.bytes, lang)} />
                      <Stat label={t.studio.stat.time} value={formatSeconds(result.ms, lang)} />
                    </dl>

                    {result.fellBack && (
                      <p className="flex items-start gap-2 rounded-[10px] bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">
                        <WarningCircle size={15} className="mt-0.5 shrink-0 text-accent-ink" />
                        {t.studio.fellBack(result.engineLabel)}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ---------- Panel kontrol ---------- */}
            <div className="border-t border-line bg-surface-2/60 p-4 md:p-7 lg:border-t-0 lg:border-l">
              <div className="space-y-7">
                <fieldset disabled={working} className="space-y-2.5 disabled:opacity-50">
                  <legend className="mb-2.5 text-sm text-ink">{t.studio.levelLegend}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {[2, 4].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setScale(value);
                          if (status === 'done') resetOutput();
                        }}
                        aria-pressed={scale === value}
                        className={`rounded-[10px] border px-3 py-3 text-sm transition-colors ${
                          scale === value
                            ? 'border-accent bg-accent-soft text-ink'
                            : 'border-line text-ink-2 hover:border-line-strong hover:text-ink'
                        }`}
                      >
                        {value}x
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset disabled={working} className="space-y-2.5 disabled:opacity-50">
                  <legend className="mb-2.5 text-sm text-ink">{t.studio.engineLegend}</legend>
                  <div className="space-y-2">
                    {['fast', 'quality'].map((id) => {
                      const Icon = ENGINE_ICONS[id];
                      const copy = t.studio.engines[id];
                      const active = engine === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setEngine(id);
                            if (status === 'done') resetOutput();
                          }}
                          aria-pressed={active}
                          className={`flex w-full items-start gap-3 rounded-[10px] border p-3 text-left transition-colors ${
                            active ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
                          }`}
                        >
                          <Icon
                            size={17}
                            weight="bold"
                            className={`mt-0.5 shrink-0 ${active ? 'text-accent-ink' : 'text-ink-3'}`}
                          />
                          <span>
                            <span className="block text-sm text-ink">{copy.name}</span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">
                              {copy.note}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="pt-1 text-xs leading-relaxed text-ink-3">
                    {t.studio.engineFallbackNote}
                  </p>
                </fieldset>

                <div className="space-y-2.5">
                  <p className="text-sm text-ink">{t.studio.samplesTitle}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {SAMPLES.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        disabled={working}
                        onClick={() => acceptSample(sample)}
                        data-sample-id={sample.id}
                        title={t.studio.samples[sample.id]}
                        className="group relative aspect-square overflow-hidden rounded-[10px] border border-line transition-colors hover:border-accent disabled:opacity-50"
                      >
                        <img
                          src={sample.url}
                          alt={t.studio.samples[sample.id]}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-line pt-5">
                  {/* Keadaan proses */}
                  {working ? (
                    <>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm text-ink-2">
                          {translateProgress(t, progress.code, progress.engineLabel)}
                        </span>
                        <span className="font-mono text-sm text-accent-ink">{progress.pct}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={progress.pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={translateProgress(t, progress.code, progress.engineLabel)}
                        className="h-1.5 overflow-hidden rounded-full bg-surface"
                      >
                        <motion.div
                          className="h-full rounded-full bg-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.pct}%` }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => abortRef.current?.abort()}
                        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                      >
                        <X size={15} weight="bold" />
                        {t.studio.cancel}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={run}
                      disabled={!source}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium whitespace-nowrap text-accent-fg transition-transform hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {status === 'done' ? (
                        <>
                          <ArrowClockwise size={16} weight="bold" />
                          {t.studio.reprocess}
                        </>
                      ) : (
                        <>
                          <ImageIcon size={16} weight="bold" />
                          {t.studio.upscaleN(scale)}
                        </>
                      )}
                    </button>
                  )}

                  {status === 'done' && result && (
                    <a
                      href={result.url}
                      download={result.downloadName}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent px-5 py-3 text-sm whitespace-nowrap text-accent-ink transition-colors hover:bg-accent-soft"
                    >
                      <DownloadSimple size={16} weight="bold" />
                      {t.studio.download}
                    </a>
                  )}

                  {source && !working && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs text-ink-3 transition-colors hover:text-ink"
                    >
                      <Trash size={14} />
                      {t.studio.clear}
                    </button>
                  )}

                  {/* Keadaan galat */}
                  {status === 'error' && error && (
                    <p className="flex items-start gap-2 rounded-[10px] border border-danger/30 bg-danger/10 p-3 text-xs leading-relaxed text-danger">
                      <WarningCircle size={15} weight="bold" className="mt-0.5 shrink-0" />
                      {renderError(t, error)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight = false }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-wider text-ink-3 uppercase">{label}</dt>
      <dd className={`mt-1 font-mono text-sm ${highlight ? 'text-accent-ink' : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  );
}
