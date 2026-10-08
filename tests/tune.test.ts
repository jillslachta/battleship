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

import { shotTune } from '../src/audio/tune';

describe('per-shot sound effects', () => {
  it('stays short so turns keep moving', () => {
    (['miss', 'hit', 'sunk'] as const).forEach((result) => {
      const tune = shotTune(result);
      expect(tune.notes.length).toBeGreaterThan(0);
      expect(tuneDuration(tune)).toBeLessThan(0.7);
      tune.notes.forEach((note) => expect(note.length).toBeGreaterThan(0));
    });
  });

  it('gets bigger as the outcome gets bigger', () => {
    const miss = shotTune('miss');
    const hit = shotTune('hit');
    const sunk = shotTune('sunk');
    expect(hit.notes.length).toBeGreaterThan(miss.notes.length);
    expect(sunk.notes.length).toBeGreaterThan(hit.notes.length);
    expect(tuneDuration(sunk)).toBeGreaterThan(tuneDuration(hit));
  });

  it('sounds different from the end-of-game tunes', () => {
    const endings = [victoryTune(), defeatTune()].map((tune) => tune.notes.map((n) => n.freq).join(','));
    (['miss', 'hit', 'sunk'] as const).forEach((result) => {
      expect(endings).not.toContain(shotTune(result).notes.map((n) => n.freq).join(','));
    });
  });
});
