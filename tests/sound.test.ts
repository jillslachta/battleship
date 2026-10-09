import { describe, expect, it } from 'vitest';
import { FLIGHT_S, IMPACT_OFFSET_S, THEME_LOOP } from '../src/ui/sound';

describe('shot timing', () => {
  it('keeps a whole turn under three seconds of waiting', () => {
    const landing = FLIGHT_S + IMPACT_OFFSET_S;
    expect(FLIGHT_S).toBeGreaterThan(0.5);
    expect(landing).toBeLessThan(2);
  });
});

describe('theme loop', () => {
  const PATTERN_S = 81_415 / 44_100;
  const CLIP_S = 7.08;
  const FADE_OUT_S = 0.3;

  it('spans a whole number of drum patterns', () => {
    const patterns = (THEME_LOOP.end - THEME_LOOP.start) / PATTERN_S;
    expect(patterns).toBeCloseTo(Math.round(patterns), 6);
  });

  it('stays clear of the leading silence and the fade-out', () => {
    expect(THEME_LOOP.start).toBeGreaterThan(0.1);
    expect(THEME_LOOP.end).toBeLessThan(CLIP_S - FADE_OUT_S);
  });
});
