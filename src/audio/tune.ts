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

const VICTORY_NOTES = [523.25, 659.25, 783.99, 1046.5];
const DEFEAT_NOTES = [392.0, 311.13, 261.63, 196.0];

export function victoryTune(): Tune {
  return {
    wave: 'triangle',
    gain: 0.18,
    notes: VICTORY_NOTES.map((freq, index) => ({
      freq,
      start: index * 0.14,
      length: index === VICTORY_NOTES.length - 1 ? 0.7 : 0.18,
    })),
  };
}

export function defeatTune(): Tune {
  return {
    wave: 'sine',
    gain: 0.22,
    notes: DEFEAT_NOTES.map((freq, index) => ({
      freq,
      start: index * 0.32,
      length: index === DEFEAT_NOTES.length - 1 ? 1.1 : 0.36,
    })),
  };
}

export function tuneFor(won: boolean): Tune {
  return won ? victoryTune() : defeatTune();
}

export function tuneDuration(tune: Tune): number {
  return Math.max(...tune.notes.map((note) => note.start + note.length));
}

export type ShotResult = 'miss' | 'hit' | 'sunk';

/** A short effect for a single shot. Kept well under a second so turns stay snappy. */
export function shotTune(result: ShotResult): Tune {
  switch (result) {
    case 'miss':
      // A low, soft "plunk" into the water.
      return {
        wave: 'sine',
        gain: 0.14,
        notes: [{ freq: 170, start: 0, length: 0.16 }],
      };
    case 'hit':
      // Two sharp, bright blips.
      return {
        wave: 'square',
        gain: 0.08,
        notes: [
          { freq: 660, start: 0, length: 0.07 },
          { freq: 880, start: 0.08, length: 0.1 },
        ],
      };
    case 'sunk':
      // A three-note descending "going down" phrase.
      return {
        wave: 'sawtooth',
        gain: 0.1,
        notes: [
          { freq: 523.25, start: 0, length: 0.12 },
          { freq: 392.0, start: 0.13, length: 0.12 },
          { freq: 261.63, start: 0.26, length: 0.32 },
        ],
      };
  }
}
