import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { evaluate, hush, getSound } from '@strudel/web';
import { ensureInit } from '../engine/strudel';

const STORAGE_KEY = 'algorythm_drum_expr';
const DEFAULT_EXPR = 'sound(":sound:").bank("RolandTR909")';

/** Default drum sounds shown as pads (per https://strudel.cc/workshop/first-sounds/#drum-sounds). */
const DRUM_SOUNDS = [
  { id: 'bd', label: 'bd', desc: 'bass drum' },
  { id: 'sd', label: 'sd', desc: 'snare' },
  { id: 'rim', label: 'rim', desc: 'rimshot' },
  { id: 'hh', label: 'hh', desc: 'hihat' },
  { id: 'oh', label: 'oh', desc: 'open hihat' },
  { id: 'lt', label: 'lt', desc: 'low tom' },
  { id: 'mt', label: 'mt', desc: 'mid tom' },
  { id: 'ht', label: 'ht', desc: 'high tom' },
  { id: 'rd', label: 'rd', desc: 'ride' },
  { id: 'cr', label: 'cr', desc: 'crash' },
] as const;

/** Extract bank name from expression like `.bank("RolandTR909")`. Returns empty string if none. */
function extractBank(expr: string): string {
  const m = expr.match(/\.bank\(["']([^"']+)["']\)/);
  return m ? m[1] : '';
}

/** Check if a sound (with optional bank prefix) is loaded. */
function isSoundAvailable(soundId: string, bank: string): boolean {
  const key = bank ? `${bank}_${soundId}` : soundId;
  try {
    return !!getSound(key);
  } catch {
    return false;
  }
}

interface DrumPadsProps {
  active: boolean;
  /** Called when a pad is pressed — parent should stop any running pattern. */
  onNotePlay?: () => void;
}

export default function DrumPads({ active, onNotePlay }: DrumPadsProps) {
  const [expression, setExpression] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_EXPR,
  );
  const [activePad, setActivePad] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);
  const playingRef = useRef(false);

  // Determine which pads are available based on the current bank in the expression
  const bank = useMemo(() => extractBank(expression), [expression]);
  const [available, setAvailable] = useState<Set<string>>(new Set(DRUM_SOUNDS.map((s) => s.id)));

  // Re-check availability when bank or init state changes
  useEffect(() => {
    if (!initRef.current) return;
    const avail = new Set<string>();
    for (const s of DRUM_SOUNDS) {
      if (isSoundAvailable(s.id, bank)) avail.add(s.id);
    }
    setAvailable(avail);
  }, [bank]);

  // Also check after first init
  const checkAvailability = useCallback(() => {
    const avail = new Set<string>();
    for (const s of DRUM_SOUNDS) {
      if (isSoundAvailable(s.id, bank)) avail.add(s.id);
    }
    setAvailable(avail);
  }, [bank]);

  // Persist expression
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, expression);
  }, [expression]);

  const handlePointerDown = useCallback(
    async (soundId: string) => {
      if (!initRef.current) {
        await ensureInit();
        initRef.current = true;
        checkAvailability();
      }

      onNotePlay?.();

      const code = expression.replace(/:sound:/g, soundId);

      try {
        await evaluate(code, true);
        playingRef.current = true;
        setActivePad(soundId);
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
        setActivePad(null);
      }
    },
    [expression, onNotePlay, checkAvailability],
  );

  // Global pointer-up listener so releasing outside a pad still stops
  useEffect(() => {
    const up = () => {
      if (playingRef.current) {
        hush();
        playingRef.current = false;
      }
      setActivePad(null);
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
    <div className="drum-panel">
      <div className="drum-expression-row">
        <input
          className="drum-expression"
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          spellCheck={false}
          placeholder='sound(":sound:").bank("RolandTR909")'
        />
        {expression !== DEFAULT_EXPR && (
          <button
            className="btn btn-ghost drum-reset-btn"
            onClick={() => setExpression(DEFAULT_EXPR)}
            title="reset expression"
          >
            reset
          </button>
        )}
      </div>
      {error && <div className="drum-error">{error}</div>}
      {!expression.includes(':sound:') && (
        <div className="drum-error">expression must contain :sound: placeholder</div>
      )}
      <div className="drum-pads-grid">
        {DRUM_SOUNDS.map((sound) => {
          const isAvailable = available.has(sound.id);
          return (
            <div
              key={sound.id}
              className={`drum-pad${activePad === sound.id ? ' drum-pad-active' : ''}${!isAvailable ? ' drum-pad-unavailable' : ''}`}
              onPointerDown={(e) => {
                if (!isAvailable) return;
                e.preventDefault();
                handlePointerDown(sound.id);
              }}
            >
              <span className="drum-pad-label">{sound.label}</span>
              <span className="drum-pad-desc">{sound.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
