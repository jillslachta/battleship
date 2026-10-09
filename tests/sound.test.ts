import { describe, expect, it } from 'vitest';
import { FLIGHT_S, IMPACT_OFFSET_S } from '../src/ui/sound';

describe('shot timing', () => {
  it('keeps a whole turn under three seconds of waiting', () => {
    const landing = FLIGHT_S + IMPACT_OFFSET_S;
    expect(FLIGHT_S).toBeGreaterThan(0.5);
    expect(landing).toBeLessThan(2);
  });
});
