import { useState, useCallback, useRef, useEffect } from 'react';
import { playCode, stopPlayback, ensureInit, tryLiveReload, getActiveLocations } from '../engine/strudel';
import Editor, { type EditorHandle } from './Editor';
import Visualizer from './Visualizer';

const STORAGE_KEY = 'algorythm_jam';

/** Encode code as URL-safe base64 (handles Unicode). */
function encodeShareCode(code: string): string {
  const bytes = new TextEncoder().encode(code);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** Decode shared base64 back to code. */
function decodeShareCode(encoded: string): string | null {
  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Read shared code from URL hash (e.g. /jam#c=...). */
function getSharedCode(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#c=')) return null;
  return decodeShareCode(hash.slice(3));
}
const DEFAULT_CODE = `// jam mode — experiment freely!
// drums: bd sd hh ho cp cr rm lt mt ht
// synths: sawtooth square triangle sine
// try: sound("bd hh*4 sd hh*4")
// or: note("c4 e4 g4 e4").sound("piano")
sound("")`;

interface Sample {
  name: string;
  code: string;
}

const SAMPLES: Sample[] = [
  {
    name: 'mondo synth',
    code: `// mondo synth — evolving bass + drums
// adapted from https://strudel.cc/learn/mondo-notation/
$: note("c2")
  .euclid("<3 6 3>", "<8 16>")
  .fast(2).s("sine")
  .add(note("[0 <12 24>]*2"))
  .dec(sine.range(.2, 2))
  .room(.5)
  .lpf(sine.slow(3).range(120, 400))
  .lpenv(rand.range(.5, 4))
  .lpq(perlin.range(5, 12).fast(2))
  .dist(1).fm(4).fmh(5.01)
  .fmdecay("<.1 .2>")
  .postgain(.6).delay(.1).clip(5)
$: s("[bd bd bd bd]")
  .clip(.5).ply("<1 [1 [2 4]]>")
$: s("ho*4").press()
  .speed(.8).decay("<.02 .05>*2")`,
  },
  {
    name: 'dub tune',
    code: `// dub tune — plucks, pads & bass
// adapted from https://strudel.cc/workshop/first-effects/
$: note("[~ [<[d3,a3,f4]!2 [d3,bb3,g4]!2> ~]]*2")
.sound("gm_electric_guitar_muted").delay(.5)

$: sound("bd rim").bank("RolandTR707").delay(.5)

$: n("<4 [3@3 4] [<2 0> ~@16] ~>")
.scale("D4:minor").sound("gm_accordion:2")
.room(2).gain(.4)

$: n("[0 [~ 0] 4 [3 2] [0 ~] [0 ~] <0 2> ~]/2")
.scale("D2:minor")
.sound("sawtooth,triangle").lpf(800)`,
  },
  {
    name: 'xylophone stack',
    code: `// stacked patterns — bells, bass & drums
// adapted from https://strudel.cc/workshop/pattern-effects/
$: n("0 [2 4] <3 5> [~ <4 1>]".add("<0 [0,2,4]>"))
.scale("C5:minor")
.sound("gm_xylophone")
.room(.4).delay(.125)
$: note("c2 [eb3,g3]".add("<0 <1 -1>>"))
.adsr("[.1 0]:.2:[1 0]")
.sound("gm_acoustic_bass")
.room(.5)
$: n("0 1 [2 3] 2").sound("jazz").jux(rev)`,
  },
  {
    name: 'tetris',
    code: `// tetris — classic melody
// adapted from https://strudel.cc/learn/mini-notation/
note("<[e5 [b4 c5] d5 [c5 b4]] [a4 [a4 c5] e5 [d5 c5]] [b4 [~ c5] d5 e5] [c5 a4 a4 ~] [[~ d5] [~ f5] a5 [g5 f5]] [e5 [~ c5] e5 [d5 c5]] [b4 [b4 c5] d5 e5] [c5 a4 a4 ~]>")
  .sound("square")
  .lpf(1200)
  .delay(.2)`,
  },
];

interface JamData {
  slots: Record<string, string>;
  active: string;
}

function loadJam(): JamData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as JamData;
  } catch { /* ignore */ }
  return { slots: { '1': DEFAULT_CODE }, active: '1' };
}

function saveJam(data: JamData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface SandboxProps {
  onBack: () => void;
}

export default function Sandbox({ onBack }: SandboxProps) {
  const [jam, setJam] = useState<JamData>(() => {
    const data = loadJam();
    // If URL has shared code, load it into the active slot
    const shared = getSharedCode();
    if (shared) {
      data.slots = { ...data.slots, [data.active]: shared };
      // Clear the hash so it doesn't reload on re-render
      window.history.replaceState(null, '', '/jam');
    }
    return data;
  });
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showViz, setShowViz] = useState(false);
  const [initDone, setInitDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const codeRef = useRef(jam.slots[jam.active] ?? DEFAULT_CODE);
  const editorRef = useRef<EditorHandle>(null);

  useEffect(() => {
    return () => stopPlayback();
  }, []);

  // Active code highlighting RAF loop
  const highlightRafRef = useRef(0);
  useEffect(() => {
    if (!playing) {
      editorRef.current?.setHighlights([]);
      return;
    }
    const tick = () => {
      editorRef.current?.setHighlights(getActiveLocations());
      highlightRafRef.current = requestAnimationFrame(tick);
    };
    highlightRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(highlightRafRef.current);
  }, [playing]);

  // Persist on every jam state change
  useEffect(() => {
    saveJam(jam);
  }, [jam]);

  const handleInit = useCallback(async () => {
    if (initDone) return;
    await ensureInit();
    setInitDone(true);
  }, [initDone]);

  const handleCodeChange = useCallback((newCode: string) => {
    codeRef.current = newCode;
    setJam((prev) => ({
      ...prev,
      slots: { ...prev.slots, [prev.active]: newCode },
    }));
  }, []);

  // Live-reload: debounce re-evaluation while playing
  const liveTimerRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  useEffect(() => {
    if (!playingRef.current) return;
    clearTimeout(liveTimerRef.current);
    liveTimerRef.current = setTimeout(async () => {
      if (playingRef.current) {
        const ok = await tryLiveReload(codeRef.current);
        if (ok) setError(null);
      }
    }, 300);
    return () => clearTimeout(liveTimerRef.current);
  });

  const handlePlay = useCallback(async () => {
    await handleInit();
    try {
      stopPlayback();
      setError(null);
      await playCode(codeRef.current);
      setPlaying(true);
    } catch (e: unknown) {
      setPlaying(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [handleInit]);

  const handleStop = useCallback(() => {
    stopPlayback();
    setPlaying(false);
  }, []);

  const handleRun = useCallback(
    (runCode: string) => {
      codeRef.current = runCode;
      setJam((prev) => ({
        ...prev,
        slots: { ...prev.slots, [prev.active]: runCode },
      }));
      handlePlay();
    },
    [handlePlay],
  );

  const switchSlot = useCallback((slotId: string) => {
    stopPlayback();
    setPlaying(false);
    setError(null);
    setJam((prev) => {
      const updated = { ...prev, active: slotId };
      if (!updated.slots[slotId]) {
        updated.slots = { ...updated.slots, [slotId]: DEFAULT_CODE };
      }
      return updated;
    });
  }, []);

  // Sync codeRef when slot changes
  useEffect(() => {
    codeRef.current = jam.slots[jam.active] ?? DEFAULT_CODE;
  }, [jam.active, jam.slots]);

  const loadSample = useCallback((code: string) => {
    stopPlayback();
    setPlaying(false);
    setError(null);
    codeRef.current = code;
    setJam((prev) => ({
      ...prev,
      slots: { ...prev.slots, [prev.active]: code },
    }));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleShare = useCallback(() => {
    const code = codeRef.current;
    const encoded = encodeShareCode(code);
    const url = `${window.location.origin}/jam#c=${encoded}`;
    navigator.clipboard.writeText(url).then(
      () => showToast('link copied!'),
      () => showToast('could not copy'),
    );
  }, [showToast]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(codeRef.current).then(
      () => showToast('code copied!'),
      () => showToast('could not copy'),
    );
  }, [showToast]);

  const slotIds = ['1', '2', '3'];

  return (
    <div className="sandbox-view">
      <header className="puzzle-header">
        <button className="btn btn-ghost" onClick={onBack}>
          &lt;- back
        </button>
        <div className="puzzle-title-area">
          <h2>jam mode</h2>
        </div>
        <div className="sandbox-header-right">
          <select
            className="sample-picker"
            value=""
            onChange={(e) => {
              const idx = Number(e.target.value);
              if (!isNaN(idx)) loadSample(SAMPLES[idx].code);
            }}
          >
            <option value="" disabled>load sample...</option>
            {SAMPLES.map((s, i) => (
              <option key={i} value={i}>{s.name}</option>
            ))}
          </select>
          <div className="sandbox-slots">
            {slotIds.map((id) => (
              <button
                key={id}
                className={`btn btn-ghost slot-btn ${jam.active === id ? 'slot-active' : ''}`}
                onClick={() => switchSlot(id)}
              >
                slot {id}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="sandbox-editor-area">
        <Editor
          ref={editorRef}
          key={jam.active}
          initialCode={jam.slots[jam.active] ?? DEFAULT_CODE}
          onChange={handleCodeChange}
          onRun={handleRun}
        />

        <Visualizer active={showViz && playing} />

        {error && (
          <div className="sandbox-error">{error}</div>
        )}

        <div className="editor-controls">
          <button
            className={`btn btn-primary ${playing ? 'active' : ''}`}
            onClick={playing ? handleStop : handlePlay}
          >
            {playing ? '[] stop' : '> play'}
          </button>
          <button
            className={`btn btn-ghost viz-toggle ${showViz ? 'viz-active' : ''}`}
            onClick={() => setShowViz((v) => !v)}
          >
            {showViz ? '~ viz' : '> viz'}
          </button>
          <div className="share-controls">
            <button className="btn btn-ghost" onClick={handleShare}>
              share link
            </button>
            <button className="btn btn-ghost" onClick={handleCopyCode}>
              copy code
            </button>
          </div>
          <span className="editor-hint">
            <kbd>Ctrl+Enter</kbd> play · <kbd>Ctrl+.</kbd> stop
          </span>
        </div>
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
