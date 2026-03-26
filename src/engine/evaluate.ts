import type { LevelDef } from '../levels';
import { evaluateCode, extractEvents, type HapEvent } from './strudel';

export interface EvalResult {
  pass: boolean;
  score: number;
  feedback: string;
  playerEvents?: HapEvent[];
  targetEvents?: HapEvent[];
}

/** Compare two string representations of an event value for the key fields. */
function valueKey(v: Record<string, unknown>): string {
  // For sounds: s key. For notes: note key. Fallback: JSON
  const s = v.s ?? v.sound ?? '';
  const n = v.note ?? v.n ?? '';
  const parts: string[] = [];
  if (s) parts.push(`s:${s}`);
  if (n) parts.push(`n:${n}`);
  if (parts.length === 0) return JSON.stringify(v);
  return parts.join('|');
}

/** Compare event lists for approximate match. */
function compareEvents(
  target: HapEvent[],
  player: HapEvent[],
  timeTolerance = 0.05,
): { matched: number; total: number; feedback: string } {
  let matched = 0;
  const used = new Set<number>();

  for (const te of target) {
    const tKey = valueKey(te.value);
    for (let i = 0; i < player.length; i++) {
      if (used.has(i)) continue;
      const pe = player[i];
      const pKey = valueKey(pe.value);
      if (
        tKey === pKey &&
        Math.abs(te.begin - pe.begin) <= timeTolerance &&
        Math.abs(te.end - pe.end) <= timeTolerance
      ) {
        matched++;
        used.add(i);
        break;
      }
    }
  }

  const total = Math.max(target.length, player.length);
  if (total === 0) return { matched: 0, total: 0, feedback: 'no events found' };

  const pct = Math.round((matched / total) * 100);
  let feedback = '';
  if (matched === total && target.length === player.length) {
    feedback = 'perfect match.';
  } else if (pct >= 80) {
    feedback = `close — ${matched}/${target.length} events matched (${pct}%)`;
  } else {
    feedback = `${matched}/${target.length} events matched. yours: ${player.length}, target: ${target.length}`;
  }
  return { matched, total, feedback };
}

/** Check constraints against the player code. */
function checkConstraints(
  code: string,
  constraints: LevelDef['constraints'],
  playerEvents: HapEvent[],
): { pass: boolean; feedback: string } {
  const issues: string[] = [];

  if (constraints.requiredStrings) {
    for (const s of constraints.requiredStrings) {
      if (!code.includes(s)) {
        issues.push(`code must include "${s}"`);;
      }
    }
  }

  if (constraints.forbiddenStrings) {
    for (const s of constraints.forbiddenStrings) {
      if (code.includes(s)) {
        issues.push(`code must not include "${s}"`);;
      }
    }
  }

  if (constraints.maxChars && code.length > constraints.maxChars) {
    issues.push(`code must be ${constraints.maxChars} chars or fewer (${code.length})`);
  }

  if (constraints.minEvents && playerEvents.length < constraints.minEvents) {
    issues.push(`need at least ${constraints.minEvents} events (have ${playerEvents.length})`);
  }

  if (constraints.maxEvents && playerEvents.length > constraints.maxEvents) {
    issues.push(`max ${constraints.maxEvents} events allowed (have ${playerEvents.length})`);
  }

  return {
    pass: issues.length === 0,
    feedback: issues.join('. '),
  };
}

/** Main evaluation function: score a player's code against a level definition. */
export async function evaluatePuzzle(
  playerCode: string,
  level: LevelDef,
): Promise<EvalResult> {
  const trimmed = playerCode.trim();
  if (!trimmed) {
    return { pass: false, score: 0, feedback: 'write some code first' };
  }

  // Evaluate player code
  let playerPattern: unknown;
  try {
    playerPattern = await evaluateCode(trimmed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { pass: false, score: 0, feedback: `error: ${msg}` };
  }

  const cycles = level.cycles ?? 1;

  // Extract player events
  let playerEvents: HapEvent[];
  try {
    playerEvents = extractEvents(playerPattern, cycles);
  } catch {
    return { pass: false, score: 0, feedback: 'could not extract events from pattern' };
  }

  // Check constraints
  const constraintResult = checkConstraints(trimmed, level.constraints, playerEvents);
  if (!constraintResult.pass) {
    return { pass: false, score: 0, feedback: constraintResult.feedback, playerEvents };
  }

  // For freeform puzzles, constraints are enough
  if (level.type === 'freeform') {
    if (playerEvents.length === 0) {
      return { pass: false, score: 0, feedback: 'pattern produces no sounds — add notes or sounds' };
    }
    return {
      pass: true,
      score: 100,
      feedback: 'your creation passes all constraints.',
      playerEvents,
    };
  }

  // For completion and recreate: compare with target
  let targetPattern: unknown;
  try {
    targetPattern = await evaluateCode(level.targetCode);
  } catch {
    return { pass: false, score: 0, feedback: 'internal error evaluating target' };
  }

  let targetEvents: HapEvent[];
  try {
    targetEvents = extractEvents(targetPattern, cycles);
  } catch {
    return { pass: false, score: 0, feedback: 'internal error extracting target events' };
  }

  const comparison = compareEvents(targetEvents, playerEvents);
  const score = Math.round((comparison.matched / Math.max(comparison.total, 1)) * 100);
  const pass = score >= 90;

  return {
    pass,
    score,
    feedback: pass ? comparison.feedback : comparison.feedback,
    playerEvents,
    targetEvents,
  };
}
