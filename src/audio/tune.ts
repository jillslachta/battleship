export interface Note {
  /** Frequency in hertz. */
  freq: number;
  /** Offset from the start of the tune, in seconds. */
  start: number;
  /** Duration in seconds. */
  length: number;
}

export interface Tune {
  notes: Note[];
  wave: OscillatorType;
  gain: number;
}

// Victory: a rising brass-style fanfare up two octaves, ending on a held high note.
const VICTORY_NOTES = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5, 1318.5];
// Defeat: a slow minor descent to a low, held final note.
const DEFEAT_NOTES = [440.0, 349.23, 293.66, 261.63, 220.0, 174.61, 130.81];

export function victoryTune(): Tune {
  return {
    wave: 'triangle',
    gain: 0.2,
    notes: VICTORY_NOTES.map((freq, index) => ({
      freq,
      // Quick triplet pickup, then broader strides up to the top.
      start: index < 3 ? index * 0.11 : 0.33 + (index - 3) * 0.2,
      length: index === VICTORY_NOTES.length - 1 ? 1.4 : index < 3 ? 0.12 : 0.24,
    })),
  };
}

export function defeatTune(): Tune {
  return {
    wave: 'sine',
    gain: 0.24,
    notes: DEFEAT_NOTES.map((freq, index) => ({
      freq,
      start: index * 0.3,
      length: index === DEFEAT_NOTES.length - 1 ? 1.1 : 0.34,
    })),
  };
}

export function tuneFor(won: boolean): Tune {
  return won ? victoryTune() : defeatTune();
}

export function tuneDuration(tune: Tune): number {
  return Math.max(...tune.notes.map((note) => note.start + note.length));
}

/* ---------- Title and setup theme ---------- */

export interface Theme {
  /** Pitched parts, all starting at time 0 and looping together. */
  parts: Tune[];
  /** Length of one loop in seconds. */
  length: number;
}

const BPM = 112;
const BEAT = 60 / BPM;

// Pitches in hertz, equal temperament.
const P = {
  D2: 73.42, E2: 82.41, G2: 98.0, A2: 110.0, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.0,
  D4: 293.66, E4: 329.63, F4s: 369.99, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

/** [pitch, start beat, length in beats] */
type Step = [number, number, number];

function toTune(wave: OscillatorType, gain: number, steps: Step[]): Tune {
  return {
    wave,
    gain,
    notes: steps.map(([freq, start, length]) => ({ freq, start: start * BEAT, length: length * BEAT * 0.9 })),
  };
}

/**
 * An original eight-bar naval march for the title and setup screens.
 * Dotted "left-right" rhythm, a walking bass on the strong beats, loops cleanly.
 */
export function menuTheme(): Theme {
  const melody: Step[] = [
    // Bar 1-2: call
    [P.G4, 0, 0.75], [P.G4, 0.75, 0.25], [P.B4, 1, 1], [P.D5, 2, 1], [P.G5, 3, 1],
    [P.D5, 4, 1.5], [P.B4, 5.5, 0.5], [P.D5, 6, 2],
    // Bar 3-4: answer
    [P.C5, 8, 0.75], [P.C5, 8.75, 0.25], [P.B4, 9, 1], [P.A4, 10, 1], [P.G4, 11, 1],
    [P.A4, 12, 2], [P.D4, 14, 2],
    // Bar 5-6: call again, higher
    [P.G4, 16, 0.75], [P.G4, 16.75, 0.25], [P.B4, 17, 1], [P.D5, 18, 1], [P.G5, 19, 1],
    [P.E5, 20, 1.5], [P.D5, 21.5, 0.5], [P.B4, 22, 1], [P.C5, 23, 1],
    // Bar 7-8: cadence
    [P.A4, 24, 0.75], [P.A4, 24.75, 0.25], [P.B4, 25, 1], [P.A4, 26, 1], [P.F4s, 27, 1],
    [P.G4, 28, 3],
  ];
  const bass: Step[] = [
    [P.G2, 0, 1], [P.D3, 2, 1], [P.G2, 4, 1], [P.D3, 6, 1],
    [P.C3, 8, 1], [P.G2, 10, 1], [P.D3, 12, 1], [P.A2, 14, 1],
    [P.G2, 16, 1], [P.D3, 18, 1], [P.E3, 20, 1], [P.C3, 22, 1],
    [P.D3, 24, 1], [P.D2, 26, 1], [P.G2, 28, 1], [P.D3, 30, 1],
  ];
  const chords: Step[] = [
    [P.B2, 1, 0.5], [P.B2, 3, 0.5], [P.B2, 5, 0.5], [P.B2, 7, 0.5],
    [P.E3, 9, 0.5], [P.B2, 11, 0.5], [P.F4s / 2, 13, 0.5], [P.E3, 15, 0.5],
    [P.B2, 17, 0.5], [P.B2, 19, 0.5], [P.G3, 21, 0.5], [P.E3, 23, 0.5],
    [P.F4s / 2, 25, 0.5], [P.F4s / 2, 27, 0.5], [P.B2, 29, 0.5], [P.B2, 31, 0.5],
  ];
  return {
    length: 32 * BEAT,
    parts: [toTune('square', 0.045, melody), toTune('triangle', 0.16, bass), toTune('triangle', 0.06, chords)],
  };
}
