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
  { id: 2, title: 'Acid Techno', description: 'Build an acid techno track, one layer at a time' },
  { id: 3, title: 'Stacking Patterns', description: 'Melody, bass, and drums — the full stack' },
  { id: 4, title: 'Anthem House', description: 'Build an original house anthem with drums, stabs, bass, and a hook' },
];

export const levels: LevelDef[] = [
  // ── Chapter 1: First Beats ─────────────────────────────────
  {
    id: 'beat-1',
    chapter: 1,
    levelInChapter: 1,
    title: 'Your First Sound',
    description:
      'Welcome! In Strudel, `sound()` plays a sound. Replace the `~` (silence) with `bd` to play a bass drum. In this chapter we\'ll work with drum sounds only.',
    type: 'completion',
    targetCode: 'sound("bd")',
    starterCode: '// sound() plays an audio sample by name\n// this code loops forever \u2014 one "cycle" every 2 seconds\n// ~ means silence (a rest). replace it with: bd\n// drum sounds: https://strudel.cc/workshop/first-sounds/#drum-sounds\n// cheat sheet: https://strudel.cc/workshop/recap/\nsound("~")\n  ._punchcard()',
    hints: ['Try typing: bd (short for bass drum)'],
    constraints: { requiredStrings: ['sound('] },
  },
  {
    id: 'beat-2',
    chapter: 1,
    levelInChapter: 2,
    title: 'A Simple Beat',
    description:
      'Put multiple sounds in a sequence by separating them with spaces. More sounds = each one plays faster to fit evenly in the same 2-second cycle. Replace the `~` rests using these sounds: `bd` (kick), `hh` (hi-hat), `sd` (snare).',
    type: 'completion',
    targetCode: 'sound("bd hh sd hh")',
    starterCode: '// spaces separate sounds \u2014 they split the cycle equally\n// 4 sounds = each gets 0.5s of a 2s cycle\n// ~ = rest (silence). replace each ~ with a sound\n// you need: bd (kick), hh (hihat), sd (snare)\nsound("bd ~ sd ~")\n  ._punchcard()',
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
    starterCode: '// * repeats a sound within its time slot\n// hh*2 = two hihats in the space of one\n// replace each _ with a number\nsound("bd hh*_ sd hh*_")\n  ._punchcard()',
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
    title: 'Stack the Layers',
    description:
      'A comma `,` inside `sound()` stacks patterns so they play at the same time. Fill in the second layer to add `hh*4` on top of the kick and snare.',
    type: 'completion',
    targetCode: 'sound("bd sd bd sd, hh*4")',
    starterCode: '// , stacks patterns \u2014 they play simultaneously\n// left of the comma: kick and snare backbone\n// right of the comma: hi-hat groove on top\n// replace the ~ with a hi-hat pattern\nsound("bd sd bd sd, ~")\n  ._punchcard()',
    hints: [
      'The comma separates two layers inside one sound() call',
      'hh*4 plays four hi-hats per cycle',
    ],
    constraints: { requiredStrings: ['sound(', ','] },
  },

  // ── Chapter 2: Acid Techno ─────────────────────────────────
  // Each puzzle adds one layer, building toward the acid techno jam sample.
  // Concepts are introduced one at a time: [] → [~ x] → $: → .gain() → note() → <> → sine
  {
    id: 'acid-1',
    chapter: 2,
    levelInChapter: 1,
    title: 'Four on the Floor',
    description:
      'The foundation of all dance music: a kick drum on every beat. This is called "four on the floor." Make the kick hit 4 times per cycle using `*`.',
    type: 'completion',
    targetCode: 'sound("bd*4")',
    starterCode: '// the foundation of all electronic dance music\n// * repeats a sound — you learned this in chapter 1\n// make the kick drum hit 4 times per cycle\nsound("bd*~")\n  ._punchcard()',
    hints: [
      'Replace ~ with a number — bd*4 means 4 kicks per cycle',
    ],
    constraints: { requiredStrings: ['sound(', '*'] },
  },
  {
    id: 'acid-2',
    chapter: 2,
    levelInChapter: 2,
    title: 'Double Time',
    description:
      'Square brackets `[]` squeeze as many sounds as you want into one time slot. `[hh hh]` fits two hi-hats where one sound normally goes — `[hh hh hh]` would fit three, and so on. The more sounds you add, the faster they play to fit. Watch the punchcard to see how brackets subdivide.',
    type: 'completion',
    targetCode: 'sound("bd [hh hh] sd [hh hh]")',
    starterCode: '// [a b] = two sounds squeezed into one beat\n// the punchcard shows how [hh hh] takes the same space as bd\n// replace the rests to double up the hi-hats\nsound("bd [~ ~] sd [~ ~]")\n  ._punchcard()',
    hints: [
      'Each bracket pair needs two hi-hats: [hh hh]',
      'The punchcard shows how brackets subdivide the beat',
    ],
    constraints: { requiredStrings: ['sound(', '['] },
  },
  {
    id: 'acid-3',
    chapter: 2,
    levelInChapter: 3,
    title: 'Offbeat Snare',
    description:
      'Brackets + silence = offbeat rhythms! `[~ sd]` means "silence then snare" in one beat — the snare lands *between* the kicks. Combined with `,` (from chapter 1) and `*2`, this gives us the classic dance drum pattern.',
    type: 'completion',
    targetCode: 'sound("bd*4, [~ sd]*2")',
    starterCode: '// [~ sd] = a rest then snare, squeezed into one beat\n// this puts the snare between the kicks (offbeat!)\n// , stacks two patterns together (from chapter 1)\n// *2 after brackets repeats the whole group twice\nsound("bd*4, [~ ~]*2")\n  ._punchcard()',
    hints: [
      'The snare (sd) goes in the second position: [~ sd]',
      'The rest (~) creates the offbeat feel',
    ],
    constraints: { requiredStrings: ['sound(', '[', ','] },
  },
  {
    id: 'acid-4',
    chapter: 2,
    levelInChapter: 4,
    title: 'Parallel Tracks',
    description:
      '`$:` starts a new parallel track — like layers in a DAW. Each `$:` line plays independently at the same time. Split the drums and hi-hats onto separate lines so we can process them differently later.',
    type: 'completion',
    targetCode: '$: sound("bd*4, [~ sd]*2")\n$: sound("hh*8")',
    starterCode: '// $: starts a parallel track — each line is independent\n// line 1: kick and snare pattern\n// line 2: fast hi-hats on their own track\n$: sound("bd*4, [~ sd]*2")\n  ._punchcard()\n$: sound("hh*~")\n  ._punchcard()',
    hints: [
      'The hi-hats should play 8 times per cycle',
      'Each $: line is a separate track playing simultaneously',
    ],
    constraints: { requiredStrings: ['$:'] },
  },
  {
    id: 'acid-5',
    chapter: 2,
    levelInChapter: 5,
    title: 'Hat Dynamics',
    description:
      '`.gain()` controls volume per hit — `0` (or `~`) silences it, `1` is full volume. `[.25 1]*4` alternates quiet (0.25) and loud (1) hits, repeated 4 times across 8 hi-hats — that\'s the classic pumping EDM groove.',
    type: 'completion',
    targetCode: '$: sound("bd*4, [~ sd]*2")\n$: sound("hh*8").gain("[.25 1]*4")',
    starterCode: '// .gain() sets volume: 0 = silent, 1 = full\n// [.25 1]*4 = quiet-loud pattern repeated 4 times\n// this creates a pumping groove on the hi-hats\n$: sound("bd*4, [~ sd]*2")\n  ._punchcard()\n$: sound("hh*8").gain("[~ ~]*4")',
    hints: [
      '.25 is quiet, 1 is loud — they alternate',
      'The pattern repeats 4 times to cover all 8 hi-hat hits',
    ],
    constraints: { requiredStrings: ['.gain('] },
  },
  {
    id: 'acid-6',
    chapter: 2,
    levelInChapter: 6,
    title: 'Enter the Bass',
    description:
      'Time for pitch! `n()` picks notes from a scale using numbers, which is easier than memorizing note names. `.scale("C2:minor")` sets the key, `0` is the root, and `7` is that same root one octave higher. `[0 7]*4` makes the classic "octave bass" riff. `.sound("sawtooth")` gives us the raw synth tone, and `.lpf(800)` cuts harsh high frequencies.',
    type: 'completion',
    targetCode: '$: n("[0 7]*4").scale("C2:minor").sound("sawtooth").lpf(800)\n$: sound("hh*8").gain("[.25 1]*4")\n$: sound("bd*4, [~ sd]*2")',
    starterCode: '// n() picks scale degrees instead of note names\n// .scale("C2:minor") sets the key: 0 = root, 7 = same note one octave higher\n// .sound("sawtooth") = raw synth waveform\n$: n("[~ ~]*4").scale("C2:minor").sound("sawtooth").lpf(800)\n  ._pianoroll()\n$: sound("hh*8").gain("[.25 1]*4")\n$: sound("bd*4, [~ sd]*2")',
    hints: [
      'In C minor, 0 is the root and 7 is that same root one octave up',
      'Replace the ~ rests with 0 and 7',
    ],
    constraints: { requiredStrings: ['n(', '.scale("C2:minor")', '.lpf('] },
  },
  {
    id: 'acid-7',
    chapter: 2,
    levelInChapter: 7,
    title: 'The Progression',
    description:
      'Angle brackets `<>` cycle through values — one per cycle. Instead of memorizing note names, we can shift the whole bass riff by scale degrees with `.add()`. In `C minor`, adding `6` moves the riff to B-flat, `3` moves it to F, and `2` moves it to E-flat. Fill in the missing scale steps to complete the 4-bar progression.',
    type: 'completion',
    targetCode: '$: n("[0 7]*4".add("<0 6 3 2>"))\n  .scale("C2:minor").sound("sawtooth").lpf(800).room(.3)\n$: sound("hh*8").gain("[.25 1]*4")\n$: sound("bd*4, [~ sd]*2")',
    starterCode: '// .add() shifts the whole riff by scale degrees\n// <0 6 3 2> means: stay on C, move to Bb, move to F, move to Eb\n// .room() adds reverb (0 to 1)\n$: n("[0 7]*4".add("<0 _ 3 _>"))\n  .scale("C2:minor").sound("sawtooth").lpf(800).room(.3)\n  ._pianoroll()\n$: sound("hh*8").gain("[.25 1]*4")\n$: sound("bd*4, [~ sd]*2")',
    hints: [
      'The second bar shifts the riff by 6 scale steps, which lands on B-flat',
      'The last bar shifts by 2 scale steps, which lands on E-flat',
    ],
    constraints: { requiredStrings: ['.add(', '.scale("C2:minor")'] },
    cycles: 4,
  },
  {
    id: 'acid-8',
    chapter: 2,
    levelInChapter: 8,
    title: 'Acid Sweep',
    description:
      'The final secret: a *moving* filter! Instead of a fixed `.lpf()` value, use `sine.range(100, 2000)` — a wave that smoothly sweeps between 100 and 2000 Hz. `.slow(4)` makes the sweep take 4 cycles. This is the iconic acid sound! You\'re building the "acid techno" jam sample — find it in jam mode after this!',
    type: 'completion',
    targetCode: '$: n("[0 7]*4".add("<0 6 3 2>"))\n  .scale("C2:minor").sound("sawtooth")\n  .lpf(sine.range(100, 2000).slow(4))\n  .room(.3)\n$: sound("hh*8").gain("[.25 1]*4")\n$: sound("bd*4, [~ sd]*2")',
    starterCode: '// sine.range(lo, hi) = smooth wave between lo and hi\n// .slow(n) = take n cycles to complete one sweep\n// the riff still uses scale degrees, not note names\n$: n("[0 7]*4".add("<0 6 3 2>"))\n  .scale("C2:minor").sound("sawtooth")\n  .lpf(sine.range(_, _).slow(_))\n  .room(.3)\n  ._pianoroll()\n$: sound("hh*8").gain("[.25 1]*4")\n$: sound("bd*4, [~ sd]*2")',
    hints: [
      'The filter sweeps from 100 Hz (muffled) to 2000 Hz (bright)',
      'slow(4) means one full sweep every 4 cycles',
    ],
    constraints: { requiredStrings: ['sine.range(', '.slow('] },
    cycles: 4,
  },

  // ── Chapter 3: Stacking Patterns ───────────────────────────
  // Each puzzle adds one layer, building toward the "xylophone stack" jam sample.
  {
    id: 'stack-1',
    chapter: 3,
    levelInChapter: 1,
    title: 'Play by Numbers',
    description:
      'Forget note names! `n()` picks notes from a scale using numbers. `.scale("C5:minor")` sets the key — every number sounds good. `0` is the root, higher numbers go up. See the [notes workshop](https://strudel.cc/workshop/first-notes/) for more.',
    type: 'completion',
    targetCode: 'n("0 2 4 7").scale("C5:minor").sound("triangle")',
    starterCode: '// n() picks notes from a scale using numbers\n// .scale("C5:minor") sets the key — all numbers harmonize\n// 0 = root, 1 = next step, 2 = the one after...\n// fill in a rising pattern of 4 numbers\nn("~ ~ ~ ~").scale("C5:minor").sound("triangle")',
    hints: [
      '0 is the root, higher numbers go up the scale',
      'Try a rising pattern: 0 2 4 7',
    ],
    constraints: { requiredStrings: ['n(', '.scale('] },
  },
  {
    id: 'stack-2',
    chapter: 3,
    levelInChapter: 2,
    title: 'Quick Notes',
    description:
      '`[2 4]` squeezes two notes into one beat — quick runs! `<3 5>` alternates between 3 and 5 each cycle (you learned `<>` in chapter 2). `[~ 4]` is silence then a note — a rhythmic gap. `.delay(.125)` adds a short echo.',
    type: 'completion',
    targetCode: 'n("0 [2 4] <3 5> [~ <4 1>]").scale("C5:minor").sound("triangle").room(.4).delay(.125)',
    starterCode: '// [a b] = two notes squeezed into one beat\n// <a b> = alternates between a and b each cycle\n// [~ x] = silence then note (syncopation!)\n// .delay() adds echo\nn("0 [~ ~] <3 5> [~ <~ 1>]")\n  .scale("C5:minor").sound("triangle")\n  .room(.4).delay(_)',
    hints: [
      'The quick run uses scale degrees 2 and 4',
      'The alternating gap note starts with 4',
      'A short delay of .125 adds subtle echo',
    ],
    constraints: { requiredStrings: ['.delay(', 'n('] },
    cycles: 2,
  },
  {
    id: 'stack-3',
    chapter: 3,
    levelInChapter: 3,
    title: 'Jazz Brushes',
    description:
      '`n()` with `sound()` also selects different samples from a kit — `sound("jazz")` has various jazz drum hits. `.jux(rev)` is a stereo effect: it plays the pattern forward in the left ear and reversed in the right — instant width! More on [pattern effects](https://strudel.cc/workshop/pattern-effects/).',
    type: 'completion',
    targetCode: 'n("0 1 [2 3] 2").sound("jazz").jux(rev)',
    starterCode: '// n() + sound() picks different samples from a kit\n// [2 3] = two hits in one beat\n// .jux(rev) = left ear forward, right ear reversed\nn("0 ~ [2 3] ~").sound("jazz").jux(rev)',
    hints: [
      'The second hit is sample 1',
      'The last hit is sample 2 again',
    ],
    constraints: { requiredStrings: ['sound("jazz")', '.jux('] },
  },
  {
    id: 'stack-4',
    chapter: 3,
    levelInChapter: 4,
    title: 'Walk the Bass',
    description:
      '`.add()` shifts all notes in a pattern — here it moves by scale step, not by note name. `1` goes up one note in the scale, `-1` goes down one. `<0 <1 -1>>` cycles: unchanged, up one step, unchanged, down one step. `[9,11]` plays two higher scale tones at once — a chord. `.adsr()` shapes the envelope.',
    type: 'completion',
    targetCode: 'n("0 [9,11]".add("<0 <1 -1>>"))\n  .scale("C2:minor")\n  .adsr("[.1 0]:.2:[1 0]")\n  .sound("sawtooth").lpf(400).room(.5)',
    starterCode: '// .add() shifts all scale degrees: 1=up one scale step, -1=down one\n// <0 <1 -1>> cycles: same, up, same, down\n// [9,11] is a higher chord built from the same C minor scale\n// .adsr("attack:decay:sustain:release")\nn("0 [9,11]".add("<0 <~ ~>>"))\n  .scale("C2:minor")\n  .adsr("[.1 0]:.2:[1 0]")\n  .sound("sawtooth").lpf(400).room(.5)',
    hints: [
      '.add(1) moves the whole pattern up one note in the scale; .add(-1) moves it down',
      'The bass walks: unchanged, up 1, unchanged, down 1',
    ],
    constraints: { requiredStrings: ['.add('] },
    cycles: 4,
  },
  {
    id: 'stack-5',
    chapter: 3,
    levelInChapter: 5,
    title: 'The Full Stack',
    description:
      'The grand finale! `.add("<0 [0,2,4]>")` on the melody means: first cycle single notes, second cycle chords — `[0,2,4]` adds root + 3rd + 5th on top of each note, forming a triad. This is the "xylophone stack" jam sample — find it in jam mode to keep experimenting!',
    type: 'completion',
    targetCode: '$: n("0 [2 4] <3 5> [~ <4 1>]".add("<0 [0,2,4]>"))\n  .scale("C5:minor").sound("triangle")\n  .room(.4).delay(.125)\n$: n("0 [9,11]".add("<0 <1 -1>>"))\n  .scale("C2:minor")\n  .adsr("[.1 0]:.2:[1 0]")\n  .sound("sawtooth").lpf(400).room(.5)\n$: n("0 1 [2 3] 2").sound("jazz").jux(rev)',
    starterCode: '// .add("<0 [0,2,4]>") = single notes, then chords!\n// [0,2,4] adds root + 3rd + 5th = instant triad\n$: n("0 [2 4] <3 5> [~ <4 1>]".add("<0 [0,~,~]>"))\n  .scale("C5:minor").sound("triangle")\n  .room(.4).delay(.125)\n$: n("0 [9,11]".add("<0 <1 -1>>"))\n  .scale("C2:minor")\n  .adsr("[.1 0]:.2:[1 0]")\n  .sound("sawtooth").lpf(400).room(.5)\n$: n("0 1 [2 3] 2").sound("jazz").jux(rev)',
    hints: [
      '[0,2,4] adds the root (0), third (2), and fifth (4)',
      'These three numbers form a triad — the building block of chords',
    ],
    constraints: { requiredStrings: ['$:', '.add('] },
    cycles: 4,
  },

  // ── Chapter 4: Anthem House ──────────────────────────────
  // Build an original 8-bar house anthem with drums, stabs, bass, and a hook.
  {
    id: 'anthem-1',
    chapter: 4,
    levelInChapter: 1,
    title: 'The Groove',
    description:
      'Start with a groove that already feels like a real record. Set the tempo to `124` BPM and build a classic house backbone: kick on every beat, claps on 2 and 4, and offbeat hi-hats in between.',
    type: 'completion',
    targetCode: 'setcpm(124/4)\nsound("bd*4, [~ cp]*2, [~ hh]*4").bank("RolandTR909")',
    starterCode: '// setcpm(bpm/4) is a nice way to think in dance-music tempo\n// use the TR-909 bank for a classic house sound\n// fill in the tempo, clap, and hi-hat pattern\nsetcpm(_/_)\nsound("bd*4, [~ ~]*2, [~ ~]*4").bank("RolandTR909")\n  ._punchcard()',
    hints: [
      'House often sits around 124 BPM — in Strudel that is setcpm(124/4)',
      'cp is the clap, hh is the hi-hat',
    ],
    constraints: { requiredStrings: ['setcpm(124/4)', '.bank("RolandTR909")'] },
  },
  {
    id: 'anthem-2',
    chapter: 4,
    levelInChapter: 2,
    title: 'The Bass Motif',
    description:
      'A song needs a bass line people can remember. Add a syncopated 2-bar bass motif using scale degrees in `C minor`. Rests matter here — they give the riff its bounce.',
    type: 'completion',
    targetCode: 'setcpm(124/4)\n$: n("<[0 ~ 0 3] [0 ~ 5 3]>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n$: sound("bd*4, [~ cp]*2, [~ hh]*4").bank("RolandTR909")',
    starterCode: '// n() picks notes from the scale by number\n// this riff breathes because some slots are rests (~)\n// keep the first bar on 0 ... 3 and let the second bar answer with 5\nsetcpm(124/4)\n$: n("<[0 ~ 0 ~] [0 ~ ~ 3]>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n  ._pianoroll()\n$: sound("bd*4, [~ cp]*2, [~ hh]*4").bank("RolandTR909")\n  ._punchcard()',
    hints: [
      'The first bar ends on 3',
      'The second bar answers with 5 before returning to 3',
    ],
    constraints: { requiredStrings: ['n(', '.scale("C2:minor")', '.sound("sawtooth")'] },
    cycles: 2,
  },
  {
    id: 'anthem-3',
    chapter: 4,
    levelInChapter: 3,
    title: 'Stab Chords',
    description:
      'Now make it feel like a song. Add offbeat chord stabs above the bass. These short chord hits are what give a house groove lift and make the rhythm feel physical.',
    type: 'completion',
    targetCode: 'setcpm(124/4)\n$: n("<[~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [3,5,7]]>")\n  .scale("C4:minor").sound("triangle").room(.2).gain(.35)\n$: n("<[0 ~ 0 3] [0 ~ 5 3]>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n$: sound("bd*4, [~ cp]*2, [~ hh]*4").bank("RolandTR909")',
    starterCode: '// [0,2,4] is a triad: root, third, fifth\n// house stabs usually hit off the beat, not on the kick\n// fill in the second bar with a brighter answer chord\nsetcpm(124/4)\n$: n("<[~ [0,2,4] ~ [0,2,4]] [~ [~,~,~] ~ [~,~,~]]>")\n  .scale("C4:minor").sound("triangle").room(.2).gain(.35)\n  ._pianoroll()\n$: n("<[0 ~ 0 3] [0 ~ 5 3]>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n$: sound("bd*4, [~ cp]*2, [~ hh]*4").bank("RolandTR909")',
    hints: [
      'The second bar starts with [5,7,9]',
      'The last chord in bar 2 answers with [3,5,7]',
    ],
    constraints: { requiredStrings: ['[0,2,4]', '.room(', '.gain('] },
    cycles: 2,
  },
  {
    id: 'anthem-4',
    chapter: 4,
    levelInChapter: 4,
    title: 'Hear the Hook',
    description:
      'Listen to the target and recreate the hook. It is just two bars long, but it should sound like the part people would sing back after one listen.',
    type: 'recreate',
    targetCode: 'setcpm(124/4)\n$: n("<[~ 7 ~ 6] [4 ~ 3 ~]>")\n  .scale("C5:minor").sound("square").delay(.125).gain(.3)\n$: n("<[~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [3,5,7]]>")\n  .scale("C4:minor").sound("triangle").room(.2).gain(.35)\n$: n("<[0 ~ 0 3] [0 ~ 5 3]>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n$: sound("bd*4, [~ cp]*2, [~ hh]*4").bank("RolandTR909")',
    starterCode: '// listen to the target, then write the hook on this top line\n// keep the backing tracks as they are — only the melody is missing\nsetcpm(124/4)\n$: n("")\n  .scale("C5:minor").sound("square").delay(.125).gain(.3)\n$: n("<[~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [3,5,7]]>")\n  .scale("C4:minor").sound("triangle").room(.2).gain(.35)\n$: n("<[0 ~ 0 3] [0 ~ 5 3]>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n$: sound("bd*4, [~ cp]*2, [~ hh]*4").bank("RolandTR909")',
    hints: [
      'The hook starts high on 7, then steps down to 6',
      'The second bar answers with 4, then 3',
    ],
    constraints: { requiredStrings: ['n(', '.sound("square")'] },
    cycles: 2,
  },
  {
    id: 'anthem-5',
    chapter: 4,
    levelInChapter: 5,
    title: 'Answer Phrase',
    description:
      'Great hooks do not just repeat; they answer themselves. Extend the track into a 4-bar chorus by giving the melody a second half and letting the chords and bass follow it forward.',
    type: 'completion',
    targetCode: 'setcpm(124/4)\n$: n("<[~ 7 ~ 6] [4 ~ 3 ~] [~ 7 ~ 8] [7 ~ 4 ~]>")\n  .scale("C5:minor").sound("square").delay(.125).gain(.3)\n$: n("<[~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [3,5,7]] [~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [4,6,8]]>")\n  .scale("C4:minor").sound("triangle").room(.2).gain(.35)\n$: n("<[0 ~ 0 3] [0 ~ 5 3] [0 ~ 0 3] [0 ~ 6 5]>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n$: sound("<bd*4 bd*4 bd*4 bd*4>").bank("RolandTR909")\n$: sound("<[~ cp]*2 [~ cp]*2 [~ cp]*2 [~ cp]*2>").bank("RolandTR909")\n$: sound("<[~ hh]*4 [~ hh]*4 [~ hh]*4 [~ oh ~ hh]>").bank("RolandTR909")',
    starterCode: '// bar 3 answers bar 1, bar 4 answers bar 2\n// let the hook rise a little before landing back on 4\nsetcpm(124/4)\n$: n("<[~ 7 ~ 6] [4 ~ 3 ~] [~ ~ ~ ~] [~ ~ ~ ~]>")\n  .scale("C5:minor").sound("square").delay(.125).gain(.3)\n  ._pianoroll()\n$: n("<[~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [3,5,7]] [~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [4,6,8]]>")\n  .scale("C4:minor").sound("triangle").room(.2).gain(.35)\n$: n("<[0 ~ 0 3] [0 ~ 5 3] [0 ~ 0 3] [0 ~ 6 5]>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n$: sound("<bd*4 bd*4 bd*4 bd*4>").bank("RolandTR909")\n$: sound("<[~ cp]*2 [~ cp]*2 [~ cp]*2 [~ cp]*2>").bank("RolandTR909")\n$: sound("<[~ hh]*4 [~ hh]*4 [~ hh]*4 [~ oh ~ hh]>").bank("RolandTR909")\n  ._punchcard()',
    hints: [
      'The third bar rises to 8 before the final answer lands back on 4',
      'The last bar begins on 7',
    ],
    constraints: { requiredStrings: ['<', '>', '.delay(.125)'] },
    cycles: 4,
  },
  {
    id: 'anthem-6',
    chapter: 4,
    levelInChapter: 6,
    title: 'Breakdown and Fill',
    description:
      'Now give the track a real section change. In bars 5 and 6, drop out the kick and bass, thin the chords, and add a tom fill to pull us toward the return.',
    type: 'completion',
    targetCode: 'setcpm(124/4)\n$: n("<[~ 7 ~ 6] [4 ~ 3 ~] [~ 7 ~ 8] [7 ~ 4 ~] [~ 7 ~ ~] [8 ~ ~ ~] ~ ~>")\n  .scale("C5:minor").sound("square").delay(.125).gain(.3)\n$: n("<[~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [3,5,7]] [~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [4,6,8]] [~ [0,2,4] ~ ~] [~ [3,5,7] ~ ~] ~ ~>")\n  .scale("C4:minor").sound("triangle").room(.2).gain(.35)\n$: n("<[0 ~ 0 3] [0 ~ 5 3] [0 ~ 0 3] [0 ~ 6 5] ~ ~ ~ ~>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n$: sound("<~ ~ ~ ~ ~ [lt mt ht ht] ~ ~>").bank("RolandTR909")\n$: sound("<bd*4 bd*4 bd*4 bd*4 ~ ~ ~ ~>").bank("RolandTR909")\n$: sound("<[~ cp]*2 [~ cp]*2 [~ cp]*2 [~ cp]*2 ~ ~ ~ ~>").bank("RolandTR909")\n$: sound("<[~ hh]*4 [~ hh]*4 [~ hh]*4 [~ oh ~ hh] [~ hh]*4 [~ hh]*4 ~ ~>").bank("RolandTR909")',
    starterCode: '// a breakdown works because some layers disappear completely\n// bars 5 and 6 should clear space, then the toms should pull us forward\nsetcpm(124/4)\n$: n("<[~ 7 ~ 6] [4 ~ 3 ~] [~ 7 ~ 8] [7 ~ 4 ~] [~ 7 ~ ~] [8 ~ ~ ~] ~ ~>")\n  .scale("C5:minor").sound("square").delay(.125).gain(.3)\n$: n("<[~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [3,5,7]] [~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [4,6,8]] [~ [0,2,4] ~ ~] [~ [3,5,7] ~ ~] ~ ~>")\n  .scale("C4:minor").sound("triangle").room(.2).gain(.35)\n$: n("<[0 ~ 0 3] [0 ~ 5 3] [0 ~ 0 3] [0 ~ 6 5] _ _ ~ ~>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n  ._pianoroll()\n$: sound("<~ ~ ~ ~ ~ [~ ~ ~ ~] ~ ~>").bank("RolandTR909")\n  ._punchcard()\n$: sound("<bd*4 bd*4 bd*4 bd*4 ~ ~ ~ ~>").bank("RolandTR909")\n$: sound("<[~ cp]*2 [~ cp]*2 [~ cp]*2 [~ cp]*2 ~ ~ ~ ~>").bank("RolandTR909")\n$: sound("<[~ hh]*4 [~ hh]*4 [~ hh]*4 [~ oh ~ hh] [~ hh]*4 [~ hh]*4 ~ ~>").bank("RolandTR909")',
    hints: [
      'The bass should disappear entirely in bars 5 and 6',
      'The fill happens in bar 6: lt, mt, ht, ht',
    ],
    constraints: { requiredStrings: ['lt', 'ht', '~ ~'] },
    cycles: 8,
  },
  {
    id: 'anthem-7',
    chapter: 4,
    levelInChapter: 7,
    title: 'Hands in the Air',
    description:
      'Finish the anthem. Bring the groove back for bars 7 and 8, push the hook higher, vary the last bass bar, and drop a crash cymbal so the loop resets with confidence.',
    type: 'completion',
    targetCode: 'setcpm(124/4)\n$: n("<[~ 7 ~ 6] [4 ~ 3 ~] [~ 7 ~ 8] [7 ~ 4 ~] [~ 7 ~ ~] [8 ~ ~ ~] [~ 10 ~ 8] [7 ~ 6 ~]>")\n  .scale("C5:minor").sound("square").delay(.125).gain(.3)\n$: n("<[~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [3,5,7]] [~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [4,6,8]] [~ [0,2,4] ~ ~] [~ [3,5,7] ~ ~] [~ [5,7,9] ~ [3,5,7]] [~ [0,2,4] ~ [4,6,8]]>")\n  .scale("C4:minor").sound("triangle").room(.2).gain(.35)\n$: n("<[0 ~ 0 3] [0 ~ 5 3] [0 ~ 0 3] [0 ~ 6 5] ~ ~ [0 ~ 5 3] [0 7 6 3]>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n$: sound("<~ ~ ~ ~ ~ [lt mt ht ht] ~ ~>").bank("RolandTR909")\n$: sound("<bd*4 bd*4 bd*4 bd*4 ~ ~ bd*4 bd*4>").bank("RolandTR909")\n$: sound("<[~ cp]*2 [~ cp]*2 [~ cp]*2 [~ cp]*2 ~ ~ [~ cp]*2 [~ cp]*2>").bank("RolandTR909")\n$: sound("<[~ hh]*4 [~ hh]*4 [~ hh]*4 [~ oh ~ hh] [~ hh]*4 [~ hh]*4 [~ hh]*4 [cr ~ oh hh]>").bank("RolandTR909")',
    starterCode: '// bring the anthem home: bars 7 and 8 return full and reach higher\n// the last two bars need a stronger melody, a returning bass, and a crash\nsetcpm(124/4)\n$: n("<[~ 7 ~ 6] [4 ~ 3 ~] [~ 7 ~ 8] [7 ~ 4 ~] [~ 7 ~ ~] [8 ~ ~ ~] [~ ~ ~ ~] [~ ~ ~ ~]>")\n  .scale("C5:minor").sound("square").delay(.125).gain(.3)\n  ._pianoroll()\n$: n("<[~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [3,5,7]] [~ [0,2,4] ~ [0,2,4]] [~ [5,7,9] ~ [4,6,8]] [~ [0,2,4] ~ ~] [~ [3,5,7] ~ ~] [~ [5,7,9] ~ [3,5,7]] [~ [0,2,4] ~ [4,6,8]]>")\n  .scale("C4:minor").sound("triangle").room(.2).gain(.35)\n$: n("<[0 ~ 0 3] [0 ~ 5 3] [0 ~ 0 3] [0 ~ 6 5] ~ ~ [~ ~ ~ ~] [~ ~ ~ ~]>")\n  .scale("C2:minor").sound("sawtooth").lpf(700)\n  ._pianoroll()\n$: sound("<~ ~ ~ ~ ~ [lt mt ht ht] ~ ~>").bank("RolandTR909")\n  ._punchcard()\n$: sound("<bd*4 bd*4 bd*4 bd*4 ~ ~ bd*4 bd*4>").bank("RolandTR909")\n$: sound("<[~ cp]*2 [~ cp]*2 [~ cp]*2 [~ cp]*2 ~ ~ [~ cp]*2 [~ cp]*2>").bank("RolandTR909")\n$: sound("<[~ hh]*4 [~ hh]*4 [~ hh]*4 [~ oh ~ hh] [~ hh]*4 [~ hh]*4 [~ hh]*4 [~ ~ oh hh]>").bank("RolandTR909")\n  ._punchcard()',
    hints: [
      'The return starts higher on 10 before falling back to 8 and 6',
      'The last bass bar is fuller: 0 7 6 3',
      'Use cr for the final crash cymbal',
    ],
    constraints: { requiredStrings: ['cr', '.delay(.125)', '.sound("square")'] },
    cycles: 8,
  },
];
