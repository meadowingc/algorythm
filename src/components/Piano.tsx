import { useState, useCallback, useRef, useEffect } from 'react';
import { evaluate, hush } from '@strudel/web';
import { ensureInit } from '../engine/strudel';

const STORAGE_KEY = 'algorythm_piano_expr';
const DEFAULT_EXPR = 'note(":note:").sound("triangle").dec(.4).sustain(0)';

/** Note names using sharps, indexed by semitone offset from C. */
const NOTE_NAMES = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b'] as const;
const DISPLAY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** Which semitones are black keys. */
const BLACK_KEY_SET = new Set([1, 3, 6, 8, 10]);

/** Convert MIDI number to Strudel note name (e.g. 60 → "c4"). */
function midiToNote(midi: number): string {
  const semitone = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[semitone]}${octave}`;
}

/** Convert MIDI number to display name (e.g. 60 → "C4"). */
function midiToDisplay(midi: number): string {
  const semitone = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${DISPLAY_NAMES[semitone]}${octave}`;
}

function isBlackKey(midi: number): boolean {
  return BLACK_KEY_SET.has(((midi % 12) + 12) % 12);
}

/** Build the range of MIDI notes spanning `count` octaves starting from C of `startOctave`. */
function buildKeys(startOctave: number, count: number): number[] {
  const lo = (startOctave + 1) * 12; // C of startOctave in MIDI
  const hi = lo + count * 12 - 1;
  const keys: number[] = [];
  for (let m = lo; m <= hi; m++) keys.push(m);
  return keys;
}

const OCTAVE_COUNT = 3;
const MIN_OCTAVE = 1;
const MAX_OCTAVE = 7; // highest start octave so we don't exceed MIDI 127
const DEFAULT_OCTAVE = 3; // starts at C3

interface PianoProps {
  active: boolean;
  /** Called when a key is pressed — parent should stop any running pattern. */
  onNotePlay?: () => void;
}

export default function Piano({ active, onNotePlay }: PianoProps) {
  const [expression, setExpression] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_EXPR,
  );
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startOctave, setStartOctave] = useState(DEFAULT_OCTAVE);
  const initRef = useRef(false);
  const playingRef = useRef(false);

  const allKeys = buildKeys(startOctave, OCTAVE_COUNT);
  const whiteKeys = allKeys.filter((m) => !isBlackKey(m));
  const blackKeys = allKeys.filter((m) => isBlackKey(m));

  // Persist expression
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, expression);
  }, [expression]);

  const handlePointerDown = useCallback(
    async (midi: number) => {
      // Ensure audio is initialized
      if (!initRef.current) {
        await ensureInit();
        initRef.current = true;
      }

      // Notify parent to stop current playback
      onNotePlay?.();

      const noteName = midiToNote(midi);
      const code = expression.replace(/:note:/g, noteName);

      try {
        await evaluate(code, true);
        playingRef.current = true;
        setActiveKey(midi);
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
        setActiveKey(null);
      }
    },
    [expression, onNotePlay],
  );

  // Global pointer-up listener so releasing outside a key still stops
  useEffect(() => {
    const up = () => {
      if (playingRef.current) {
        hush();
        playingRef.current = false;
      }
      setActiveKey(null);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="piano-panel">
      <div className="piano-expression-row">
        <input
          className="piano-expression"
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          spellCheck={false}
          placeholder='note(":note:").sound("triangle").dec(.4).sustain(0)'
        />
        {expression !== DEFAULT_EXPR && (
          <button
            className="btn btn-ghost piano-reset-btn"
            onClick={() => setExpression(DEFAULT_EXPR)}
            title="reset expression"
          >
            reset
          </button>
        )}
      </div>
      {error && <div className="piano-error">{error}</div>}
      {!expression.includes(':note:') && (
        <div className="piano-error">expression must contain :note: placeholder</div>
      )}
      <div className="piano-octave-row">
        <button
          className="btn btn-ghost piano-octave-btn"
          disabled={startOctave <= MIN_OCTAVE}
          onClick={() => setStartOctave((o) => Math.max(MIN_OCTAVE, o - 1))}
        >
          &lt;
        </button>
        <span className="piano-octave-label">C{startOctave}–B{startOctave + OCTAVE_COUNT - 1}</span>
        <button
          className="btn btn-ghost piano-octave-btn"
          disabled={startOctave >= MAX_OCTAVE}
          onClick={() => setStartOctave((o) => Math.min(MAX_OCTAVE, o + 1))}
        >
          &gt;
        </button>
      </div>
      <div className="piano-keys">
        {/* White keys */}
        {whiteKeys.map((midi) => {
          const semitone = ((midi % 12) + 12) % 12;
          return (
            <div
              key={midi}
              className={`piano-key piano-key-white${activeKey === midi ? ' piano-key-active' : ''}${semitone === 0 ? ' piano-key-c' : ''}`}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePointerDown(midi);
              }}
              data-note={midiToDisplay(midi)}
            >
              <span className="piano-key-label">{midiToDisplay(midi)}</span>
            </div>
          );
        })}
        {/* Black keys — absolutely positioned over the white keys */}
        {blackKeys.map((midi) => {
          // Find which white key index this black key sits after
          const whiteIndex = whiteKeys.filter((w) => w < midi).length;
          return (
            <div
              key={midi}
              className={`piano-key piano-key-black${activeKey === midi ? ' piano-key-active' : ''}`}
              style={{ left: `calc(${whiteIndex} * var(--piano-white-w, 40px) - 14px)` }}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePointerDown(midi);
              }}
              data-note={midiToDisplay(midi)}
            >
              <span className="piano-key-label">{midiToDisplay(midi)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
