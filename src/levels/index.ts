export type PuzzleType = 'completion' | 'recreate' | 'freeform';

export interface LevelConstraints {
  maxChars?: number;
  requiredStrings?: string[];
  forbiddenStrings?: string[];
  minEvents?: number;
  maxEvents?: number;
}

export interface LevelDef {
  id: string;
  chapter: number;
  levelInChapter: number;
  title: string;
  description: string;
  type: PuzzleType;
  /** The reference solution code (also used for "listen to target"). */
  targetCode: string;
  /** Starting code shown in the editor. Blanks represented as ??? */
  starterCode: string;
  hints: string[];
  constraints: LevelConstraints;
  /** Number of cycles to compare (default 1). */
  cycles?: number;
}

export const chapters = [
  { id: 1, title: 'First Beats', description: 'Learn to make rhythms with code' },
  { id: 2, title: 'Finding Notes', description: 'Discover melody and pitch' },
  { id: 3, title: 'Sound Design', description: 'Add effects and compose' },
];

export const levels: LevelDef[] = [
  // ── Chapter 1: First Beats ─────────────────────────────────
  {
    id: 'beat-1',
    chapter: 1,
    levelInChapter: 1,
    title: 'Your First Sound',
    description:
      'Welcome! In Strudel, `sound()` plays a sound. Replace the `~` (silence) with `bd` to play a bass drum.',
    type: 'completion',
    targetCode: 'sound("bd")',
    starterCode: '// sound() plays an audio sample by name\n// this code loops forever — one "cycle" every 2 seconds\n// ~ means silence (a rest). replace it with: bd\nsound("~")',
    hints: ['Try typing: bd (short for bass drum)'],
    constraints: { requiredStrings: ['sound('] },
  },
  {
    id: 'beat-2',
    chapter: 1,
    levelInChapter: 2,
    title: 'A Simple Beat',
    description:
      'Put multiple sounds in a sequence by separating them with spaces. Replace the `~` rests to create: kick, hi-hat, snare, hi-hat.',
    type: 'completion',
    targetCode: 'sound("bd hh sd hh")',
    starterCode: '// spaces separate sounds — they split the cycle equally\n// 4 sounds = each gets 0.5s of a 2s cycle\n// ~ = rest (silence). replace each ~ with a sound\n// drum sounds: bd=kick, sd=snare, hh=hihat, oh=open hihat\nsound("bd ~ sd ~")',
    hints: [
      'hh is short for hi-hat',
      'Sounds inside the quotes are separated by spaces',
    ],
    constraints: { requiredStrings: ['sound('] },
  },
  {
    id: 'beat-3',
    chapter: 1,
    levelInChapter: 3,
    title: 'Speed It Up',
    description:
      'Use `*` after a sound to repeat it. Replace `???` with a number to make the hi-hat play 4 times per cycle.',
    type: 'completion',
    targetCode: 'sound("bd hh*4 sd hh*4")',
    starterCode: '// * repeats a sound within its time slot\n// hh*2 = two hihats in the space of one\n// replace each _ with a number\nsound("bd hh*_ sd hh*_")',
    hints: [
      'The * operator multiplies a sound — hh*4 plays the hi-hat 4 times',
      'Both blanks need the same number',
    ],
    constraints: { requiredStrings: ['*'] },
  },
  {
    id: 'beat-4',
    chapter: 1,
    levelInChapter: 4,
    title: 'Hear & Recreate',
    description:
      'Listen to the target pattern, then write code to recreate it. It\'s a simple four-hit drum pattern.',
    type: 'recreate',
    targetCode: 'sound("bd sd bd sd")',
    starterCode: '// listen to the target, then write your own pattern\n// type sound names between the quotes, separated by spaces\nsound("")',
    hints: [
      'The pattern has 4 sounds, alternating between two different drums',
      'bd = bass drum, sd = snare drum',
    ],
    constraints: { requiredStrings: ['sound('] },
  },
  {
    id: 'beat-5',
    chapter: 1,
    levelInChapter: 5,
    title: 'Make Your Beat',
    description:
      'Create your own drum loop! Use at least 4 sounds total, including `bd`, `sd`, and `hh`.',
    type: 'freeform',
    targetCode: 'sound("bd hh sd hh bd hh sd hh")',
    starterCode: '// make your own beat! available drums:\n// bd=kick sd=snare hh=hihat oh=open hihat\n// rim=rimshot lt=low tom mt=mid tom ht=high tom\n// cp=clap cr=crash rd=ride\nsound("")',
    hints: [
      'Try: sound("bd hh sd hh")',
      'You can use * to repeat: hh*2',
      'Experiment until it sounds good!',
    ],
    constraints: {
      requiredStrings: ['bd', 'sd', 'hh'],
      minEvents: 4,
    },
  },

  // ── Chapter 2: Finding Notes ───────────────────────────────
  {
    id: 'note-1',
    chapter: 2,
    levelInChapter: 1,
    title: 'First Notes',
    description:
      'Use `note()` to play pitched sounds. Replace the `~` rests to play C, E, G, B on piano.',
    type: 'completion',
    targetCode: 'note("c e g b").sound("piano")',
    starterCode: '// note() plays pitched notes using letter names (a through g)\n// .sound("piano") chains an instrument — this is called "method chaining"\n// replace the ~ rests with note letters\nnote("c ~ g ~").sound("piano")',
    hints: [
      'Notes go from a to g',
      'The target melody goes: C, E, G, B',
    ],
    constraints: { requiredStrings: ['note(', '.sound('] },
  },
  {
    id: 'note-2',
    chapter: 2,
    levelInChapter: 2,
    title: 'Scale Degrees',
    description:
      'Use `n()` with numbers and `.scale()` to play notes in a scale. Replace the `~` rests with scale degrees to make a rising pattern.',
    type: 'completion',
    targetCode: 'n("0 2 4 6").scale("C:minor").sound("piano")',
    starterCode: '// n() uses numbers instead of note names\n// .scale(\"C:minor\") maps those numbers to notes in C minor\n// 0=root, 1=2nd, 2=3rd... \u2014 all guaranteed to sound good together\n// replace the ~ rests with scale degree numbers\nn(\"0 ~ 4 ~\").scale(\"C:minor\").sound(\"piano\")',
    hints: [
      'Scale degrees start at 0. 0=C, 1=D, 2=Eb, ... in C minor',
      'We want an ascending pattern: 0, 2, 4, 6',
    ],
    constraints: { requiredStrings: ['.scale('] },
  },
  {
    id: 'note-3',
    chapter: 2,
    levelInChapter: 3,
    title: 'Melody by Ear',
    description:
      'Listen to the target melody and recreate it. It uses 4 notes on piano.',
    type: 'recreate',
    targetCode: 'note("e4 d4 c4 d4").sound("piano")',
    starterCode: '// numbers after note names set the octave: c4 is middle C\n// higher number = higher octave (c5 is above c4)\nnote("").sound("piano")',
    hints: [
      'The melody goes down then back up',
      'It starts on E4 and uses only nearby notes',
      'Try: e4 d4 c4 d4',
    ],
    constraints: { requiredStrings: ['note('] },
  },
  {
    id: 'note-4',
    chapter: 2,
    levelInChapter: 4,
    title: 'Rhythm Meets Melody',
    description:
      'Combine drums and melody! Use `$:` before each line to play them in parallel. Add a drum pattern below the melody.',
    type: 'completion',
    targetCode: '$: note("c4 e4 g4 e4").sound("piano")\n$: sound("bd hh sd hh")',
    starterCode: '// $: starts a parallel pattern — like separate tracks\n// each $: line plays at the same time\n$: note("c4 e4 g4 e4").sound("piano")\n// add a drum pattern below to accompany the melody\n$: sound("~")',
    hints: [
      '$: starts a new parallel pattern',
      'Fill in a drum pattern like: bd hh sd hh',
    ],
    constraints: { requiredStrings: ['$:'] },
  },
  {
    id: 'note-5',
    chapter: 2,
    levelInChapter: 5,
    title: 'Compose a Melody',
    description:
      'Write your own melody! Use `n()` with `.scale()` and `.sound()`. Use at least 6 notes in any minor scale.',
    type: 'freeform',
    targetCode: 'n("0 1 2 3 4 5 6 7").scale("A:minor").sound("piano")',
    starterCode: '// compose freely! n() + .scale() = notes that always harmonize\n// try different numbers — negative numbers go lower\nn("").scale("A:minor").sound("piano")',
    hints: [
      'Try different numbers: n("0 3 5 7 5 3")',
      'Any number works in the scale — they all sound good together!',
      'Negative numbers go lower: n("-2 0 2 4")',
    ],
    constraints: {
      requiredStrings: ['.scale(', 'minor'],
      minEvents: 6,
    },
  },

  // ── Chapter 3: Sound Design ────────────────────────────────
  {
    id: 'fx-1',
    chapter: 3,
    levelInChapter: 1,
    title: 'Low-Pass Filter',
    description:
      'Effects change how sounds feel. Add `.lpf(800)` to the pattern to muffle the hi-hats.',
    type: 'completion',
    targetCode: 'sound("bd hh*4 sd hh*4").lpf(800)',
    starterCode: '// effects are chained with .method(value)\n// .lpf(freq) = low-pass filter — removes high frequencies\n// lower number = more muffled. try .lpf(800)\nsound("bd hh*4 sd hh*4").???(???)',
    hints: [
      'lpf = low-pass filter — it cuts high frequencies',
      'Add .lpf(800) at the end',
    ],
    constraints: { requiredStrings: ['.lpf('] },
  },
  {
    id: 'fx-2',
    chapter: 3,
    levelInChapter: 2,
    title: 'Reverb Space',
    description:
      'Add `.room(0.8)` after `.gain(0.7)` to add reverb to this melody.',
    type: 'completion',
    targetCode: 'note("c4 e4 g4 e4").sound("piano").gain(0.7).room(0.8)',
    starterCode: '// .gain(0-1) = volume, .room(0-1) = reverb amount\n// chain as many effects as you want!\nnote("c4 e4 g4 e4").sound("piano").gain(0.7).???(???)',
    hints: [
      'room() adds reverb — higher values = more spacious',
      'Add .room(0.8)',
    ],
    constraints: { requiredStrings: ['.room('] },
  },
  {
    id: 'fx-3',
    chapter: 3,
    levelInChapter: 3,
    title: 'Filtered Beat',
    description:
      'Listen to the target — a drum pattern with a filter effect. Recreate both the rhythm and the effect.',
    type: 'recreate',
    targetCode: 'sound("bd hh*2 sd hh*2").lpf(600)',
    starterCode: '// recreate the rhythm AND the effect you hear\nsound("")',
    hints: [
      'The rhythm uses bd, hh, and sd with some repetition',
      'There\'s a low-pass filter making it sound muffled',
      'Try: sound("bd hh*2 sd hh*2").lpf(600)',
    ],
    constraints: { requiredStrings: ['sound(', '.lpf('] },
  },
  {
    id: 'fx-4',
    chapter: 3,
    levelInChapter: 4,
    title: 'Layer It Up',
    description:
      'Listen to the target — a bass line paired with a drum pattern. Recreate both layers.',
    type: 'recreate',
    targetCode: '$: note("c2 c2 eb2 g2").sound("sawtooth").lpf(400)\n$: sound("bd hh sd hh")',
    starterCode: '// "sawtooth" is a built-in synth (raw waveform, no samples)\n// low notes (c2, eb2...) make great bass lines\n$: note("").sound("sawtooth")\n$: sound("")',
    hints: [
      'There are two parallel patterns — bass and drums',
      'The bass is low notes on a sawtooth synth with a filter',
      'Try: $: note("c2 c2 eb2 g2").sound("sawtooth").lpf(400)',
    ],
    constraints: { requiredStrings: ['$:', '.lpf('] },
  },
  {
    id: 'fx-5',
    chapter: 3,
    levelInChapter: 5,
    title: 'The Graduation',
    description:
      'Create a 2-layer piece with drums AND melody. Use at least one effect (.lpf, .room, .gain, etc). Make it your own!',
    type: 'freeform',
    targetCode:
      '$: n("0 2 4 7 4 2").scale("C:minor").sound("piano").room(0.5)\n$: sound("bd hh*2 sd hh*2").gain(0.8)',
    starterCode: '// your final piece! combine everything you have learned:\n// $: for layers, sound() for drums, note()/n() for melody\n// .lpf() .room() .gain() for effects\n$: \n$: ',
    hints: [
      'Use $: before each pattern to play them together',
      'One idea: melody with n().scale().sound() + drums with sound()',
      'Don\'t forget an effect like .room(), .lpf(), or .gain()',
    ],
    constraints: {
      requiredStrings: ['$:'],
      minEvents: 4,
    },
  },
];
