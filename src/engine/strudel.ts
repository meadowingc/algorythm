import { initStrudel, evaluate, hush, getAudioContext, samples, getSound, getSampleBuffer } from '@strudel/web';

let initPromise: Promise<unknown> | null = null;

export function ensureInit(): Promise<unknown> {
  if (!initPromise) {
    initPromise = initStrudel({
      prebake: () =>
        Promise.all([
          samples('github:tidalcycles/dirt-samples'),
          samples('https://raw.githubusercontent.com/felixroos/dough-samples/main/piano.json'),
        ]),
    });
  }
  return initPromise!;
}

/** Resume the AudioContext (required before first playback due to browser autoplay policy). */
async function ensureAudioRunning(): Promise<void> {
  await ensureInit();
  const ctx = getAudioContext();
  if (ctx.state !== 'running') {
    await ctx.resume();
  }
}

export interface HapEvent {
  value: Record<string, unknown>;
  begin: number;
  end: number;
}

/** Evaluate Strudel code and return the resulting pattern (without playing). */
export async function evaluateCode(code: string): Promise<unknown> {
  await ensureInit();
  // repl.evaluate() returns the pattern directly (or undefined on error)
  const pattern = await evaluate(code, false);
  if (!pattern) {
    throw new Error('Could not evaluate code');
  }
  return pattern;
}

/** Evaluate code, play the pattern, and return it. */
export async function playCode(code: string): Promise<unknown> {
  await ensureAudioRunning();
  const pattern = await evaluate(code, true);
  if (!pattern) {
    throw new Error('Could not evaluate code');
  }
  return pattern;
}

/** Stop all playback. */
export function stopPlayback(): void {
  hush();
}

/**
 * Preload all sample buffers that a piece of Strudel code will need.
 * Evaluates the code silently, extracts the sound names from the events,
 * then fetches + decodes the audio files into superdough's buffer cache.
 */
export async function preloadSounds(code: string): Promise<void> {
  try {
    const pattern = await evaluateCode(code);
    const events = extractEvents(pattern);
    const seen = new Set<string>();

    const loads: Promise<unknown>[] = [];
    for (const ev of events) {
      const s = String(ev.value.s ?? ev.value.sound ?? '');
      if (!s) continue;
      const n = Number(ev.value.n ?? 0);
      const key = `${s}:${n}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const sound = getSound(s);
      if (sound?.data?.samples) {
        loads.push(
          getSampleBuffer({ s, n, speed: 1 }, sound.data.samples).catch(() => {}),
        );
      }
    }
    await Promise.all(loads);
  } catch {
    // Preloading is best-effort; don't block or error the UI
  }
}

/**
 * Extract the list of hap events from a Strudel pattern for the given
 * number of cycles. Each hap has { value, whole: { begin, end } }.
 */
export function extractEvents(pattern: unknown, cycles = 1): HapEvent[] {
  const pat = pattern as {
    queryArc: (begin: number, end: number) => Array<{
      value: Record<string, unknown>;
      whole?: { begin: { valueOf(): number }; end: { valueOf(): number } };
      part: { begin: { valueOf(): number }; end: { valueOf(): number } };
    }>;
  };
  const haps = pat.queryArc(0, cycles);
  return haps
    .filter((h) => {
      // Only keep onset haps (where part.begin == whole.begin)
      if (!h.whole) return false;
      return Number(h.whole.begin.valueOf()) === Number(h.part.begin.valueOf());
    })
    .map((h) => ({
      value: typeof h.value === 'object' && h.value !== null ? h.value : { s: String(h.value) },
      begin: Number(h.whole!.begin.valueOf()),
      end: Number(h.whole!.end.valueOf()),
    }))
    .sort((a, b) => a.begin - b.begin || a.end - b.end);
}
