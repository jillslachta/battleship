import { describe, expect, it } from 'vitest';
import { defeatTune, menuTheme, tuneDuration, tuneFor, victoryTune } from '../src/audio/tune';
import { FLIGHT_S, effectDuration, launchEffect, missileEffect, splashEffect, explosionEffect, sinkEffect } from '../src/audio/effects';

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
      expect(tuneDuration(tune)).toBeLessThan(3.5);
    });
  });
});

describe('missile sound effects', () => {
  it('always launches first, then lands after the flight time', () => {
    (['miss', 'hit', 'sunk'] as const).forEach((result) => {
      const effect = missileEffect(result);
      const launch = launchEffect();
      expect(effect.layers.slice(0, launch.layers.length)).toEqual(launch.layers);
      const landing = effect.layers.slice(launch.layers.length);
      expect(landing.length).toBeGreaterThan(0);
      landing.forEach((layer) => expect(layer.start).toBeGreaterThanOrEqual(FLIGHT_S));
    });
  });

  it('launch is a rising whoosh', () => {
    launchEffect().layers.forEach((layer) => expect(layer.to).toBeGreaterThan(layer.from));
    expect(effectDuration(launchEffect())).toBeLessThanOrEqual(FLIGHT_S);
  });

  it('splash and explosion both fall in pitch, explosion is lower and louder', () => {
    [splashEffect(), explosionEffect()].forEach((effect) =>
      effect.layers.forEach((layer) => expect(layer.to).toBeLessThan(layer.from)),
    );
    const splash = splashEffect().layers.find((l) => l.kind === 'noise')!;
    const boom = explosionEffect().layers.find((l) => l.kind === 'noise')!;
    expect(boom.to).toBeLessThan(splash.to);
    expect(boom.gain).toBeGreaterThan(splash.gain);
  });

  it('a sinking is bigger and longer than a hit', () => {
    expect(sinkEffect().layers.length).toBeGreaterThan(explosionEffect().layers.length);
    expect(effectDuration(sinkEffect())).toBeGreaterThan(effectDuration(explosionEffect()));
    expect(effectDuration(missileEffect('sunk'))).toBeLessThan(2.5);
  });
});

describe('title theme', () => {
  it('loops cleanly: every note ends inside the loop', () => {
    const theme = menuTheme();
    expect(theme.parts.length).toBeGreaterThan(1);
    theme.parts.forEach((part) => {
      part.notes.forEach((note) => {
        expect(note.start).toBeGreaterThanOrEqual(0);
        expect(note.start + note.length).toBeLessThanOrEqual(theme.length);
      });
    });
  });

  it('keeps the melody quieter than the end-of-game tunes', () => {
    const [melody] = menuTheme().parts;
    expect(melody.gain).toBeLessThan(victoryTune().gain);
  });
});
