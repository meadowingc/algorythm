import { initStrudel, evaluate, hush, getAudioContext, samples, getSound, getSampleBuffer, getTime } from '@strudel/web';

let initPromise: Promise<unknown> | null = null;
let activePattern: unknown = null;

export { getTime };

/** Get the currently playing pattern (if any). */
export function getActivePattern(): unknown {
  return activePattern;
}

/** Types of inline visualizations supported in the editor. */
export type VizWidgetKind = 'pianoroll' | 'punchcard';

/** Info about an inline visualization widget found in the code. */
export interface VizWidgetInfo {
  kind: VizWidgetKind;
  /** Character offset of end-of-line where the widget should appear (in original code). */
  pos: number;
  /** Character range [from, to) of the $: track in the *cleaned* code (for per-track viz filtering). */
  trackRange?: [number, number];
}

/** Entry recording a stripped region: position in cleaned code and how many chars were removed. */
export interface OffsetMapEntry {
  /** Position in the cleaned code where the removal happened. */
  cleanPos: number;
  /** Number of characters that were removed from the original code at this point. */
  removed: number;
}

/** Remap a character offset from cleaned-code space back to original-code space. */
export function remapCleanToOriginal(pos: number, offsetMap: OffsetMapEntry[]): number {
  let shift = 0;
  for (const entry of offsetMap) {
    if (entry.cleanPos > pos) break;
    shift += entry.removed;
  }
  return pos + shift;
}

/**
 * Detect `._pianoroll()` / `._punchcard()` calls in code.
 * Returns cleaned code (with those calls removed), widget positions in the original code,
 * and an offsetMap for remapping cleaned-code offsets back to original-code offsets.
 */
export function processWidgetCalls(code: string): { cleanCode: string; widgets: VizWidgetInfo[]; offsetMap: OffsetMapEntry[] } {
  const widgets: VizWidgetInfo[] = [];
  const widgetRe = /\._(?:(pianoroll|punchcard))\([^)]*\)/g;
  let match;
  while ((match = widgetRe.exec(code)) !== null) {
    const kind = match[1] as VizWidgetKind;
    // Widget decoration goes at end of the line containing the call
    const lineEnd = code.indexOf('\n', match.index);
    widgets.push({ kind, pos: lineEnd === -1 ? code.length : lineEnd });
  }
  // Build offset map: find each stripped region and record its cleaned position and size
  const offsetMap: OffsetMapEntry[] = [];
  const stripRe = /\n?[ \t]*\._(?:pianoroll|punchcard)\([^)]*\)/g;
  let stripMatch;
  let totalRemoved = 0;
  while ((stripMatch = stripRe.exec(code)) !== null) {
    const cleanPos = stripMatch.index - totalRemoved;
    const removed = stripMatch[0].length;
    offsetMap.push({ cleanPos, removed });
    totalRemoved += removed;
  }
  // Strip the widget calls (including optional leading whitespace/newline for own-line calls)
  const cleanCode = code.replace(/\n?[ \t]*\._(?:pianoroll|punchcard)\([^)]*\)/g, '');

  // Compute per-track $: block ranges so each widget only shows its own track
  const origDollarRe = /^\$:/gm;
  const origDollarPositions: number[] = [];
  let odm;
  while ((odm = origDollarRe.exec(code)) !== null) origDollarPositions.push(odm.index);

  if (origDollarPositions.length > 1) {
    // Find $: positions in cleaned code
    const cleanDollarRe = /^\$:/gm;
    const cleanDollarPositions: number[] = [];
    let cdm;
    while ((cdm = cleanDollarRe.exec(cleanCode)) !== null) cleanDollarPositions.push(cdm.index);

    // Compute character ranges for each $: block in cleaned code
    const cleanRanges: [number, number][] = cleanDollarPositions.map((pos, i) => [
      pos,
      i + 1 < cleanDollarPositions.length ? cleanDollarPositions[i + 1] : cleanCode.length,
    ]);

    // Assign each widget to the $: block it sits inside (in original code)
    for (const w of widgets) {
      let blockIdx = -1;
      for (let i = origDollarPositions.length - 1; i >= 0; i--) {
        if (origDollarPositions[i] <= w.pos) { blockIdx = i; break; }
      }
      if (blockIdx >= 0 && blockIdx < cleanRanges.length) {
        w.trackRange = cleanRanges[blockIdx];
      }
    }
  }

  return { cleanCode, widgets, offsetMap };
}

/**
 * Get source code highlight ranges for currently active events.
 * Returns an array of [from, to] character offsets into the code string.
 */
export function getActiveLocations(): [number, number][] {
  if (!activePattern) return [];
  try {
    const pat = activePattern as {
      queryArc: (begin: number, end: number) => Array<{
        whole?: { begin: { valueOf(): number }; end: { valueOf(): number } };
        part: { begin: { valueOf(): number }; end: { valueOf(): number } };
        context: { locations?: Array<{ start: number; end: number }> };
      }>;
    };
    const time = getTime();
    const haps = pat.queryArc(time, time + 0.1);
    const locs: [number, number][] = [];
    const seen = new Set<string>();
    for (const hap of haps) {
      // Only active haps (currently sounding)
      if (!hap.whole) continue;
      const begin = Number(hap.whole.begin.valueOf());
      const end = Number(hap.whole.end.valueOf());
      if (time < begin || time >= end) continue;
      const hapLocs = hap.context?.locations;
      if (!hapLocs) continue;
      for (const loc of hapLocs) {
        const from = loc.start;
        const to = loc.end;
        const key = `${from}:${to}`;
        if (seen.has(key)) continue;
        seen.add(key);
        locs.push([from, to]);
      }
    }
    return locs;
  } catch {
    return [];
  }
}

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
  // Check for unknown sounds and warn (Strudel only logs to console)
  const warnings = validateSounds(pattern);
  if (warnings.length > 0) {
    hush();
    throw new Error(warnings.join('; '));
  }
  activePattern = pattern;
  return pattern;
}

/**
 * Try to hot-swap the playing pattern with new code.
 * If evaluation fails, silently keep the old pattern playing.
 * Returns true if the swap succeeded.
 */
export async function tryLiveReload(code: string): Promise<boolean> {
  try {
    const pattern = await evaluate(code, true);
    if (!pattern) return false;
    const warnings = validateSounds(pattern);
    if (warnings.length > 0) return false;
    activePattern = pattern;
    return true;
  } catch {
    return false;
  }
}

/** Stop all playback. */
export function stopPlayback(): void {
  if (initPromise) {
    try { hush(); } catch { /* repl not ready yet */ }
  }
  activePattern = null;
}

/**
 * Check a pattern's events for unknown sample names.
 * Returns a list of human-readable warning strings (empty if all sounds are valid).
 * Built-in synths (sine, square, sawtooth, triangle) are always valid.
 */
const BUILTIN_SYNTHS = new Set(['sine', 'square', 'sawtooth', 'triangle']);

// Common Strudel aliases that getSound() may not resolve directly
const KNOWN_ALIASES = new Set(['oh', 'rim', 'rd']);

function validateSounds(pattern: unknown): string[] {
  try {
    const events = extractEvents(pattern);
    const unknown: string[] = [];
    const checked = new Set<string>();
    for (const ev of events) {
      const s = String(ev.value.s ?? ev.value.sound ?? '');
      if (!s || checked.has(s)) continue;
      checked.add(s);
      if (BUILTIN_SYNTHS.has(s)) continue;
      if (KNOWN_ALIASES.has(s)) continue;
      if (!getSound(s)) {
        unknown.push(s);
      }
    }
    if (unknown.length === 0) return [];
    if (unknown.length === 1) return [`sound "${unknown[0]}" not found — check for typos`];
    return [`sounds not found: ${unknown.map((n) => `"${n}"`).join(', ')} — check for typos`];
  } catch {
    return [];
  }
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
