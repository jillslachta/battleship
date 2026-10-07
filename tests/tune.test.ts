import { describe, expect, it } from 'vitest';
import { defeatTune, tuneDuration, tuneFor, victoryTune } from '../src/audio/tune';

describe('end-of-game tunes', () => {
  it('rises for a victory and falls for a defeat', () => {
    const rising = victoryTune().notes.map((note) => note.freq);
    const falling = defeatTune().notes.map((note) => note.freq);

    expect(rising).toEqual([...rising].sort((a, b) => a - b));
    expect(falling).toEqual([...falling].sort((a, b) => b - a));
  });

  it('picks the tune from the outcome', () => {
    expect(tuneFor(true)).toEqual(victoryTune());
    expect(tuneFor(false)).toEqual(defeatTune());
  });

  it('lays notes out in order without silence or overlap gaps', () => {
    [victoryTune(), defeatTune()].forEach((tune) => {
      tune.notes.forEach((note, index) => {
        expect(note.length).toBeGreaterThan(0);
        if (index > 0) expect(note.start).toBeGreaterThan(tune.notes[index - 1].start);
      });
      expect(tuneDuration(tune)).toBeLessThan(3);
    });
  });
});
