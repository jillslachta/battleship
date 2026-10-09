/**
 * Sound effects described as data, so they can be unit-tested without a browser.
 * A layer is either a pitched tone that sweeps between two frequencies, or a
 * burst of filtered noise whose filter sweeps between two cutoffs.
 */
export type Layer =
  | { kind: 'tone'; wave: OscillatorType; from: number; to: number; start: number; length: number; gain: number }
  | { kind: 'noise'; filter: BiquadFilterType; from: number; to: number; start: number; length: number; gain: number };

export interface Effect {
  layers: Layer[];
}

export type ShotResult = 'miss' | 'hit' | 'sunk';

/** How long the missile is in the air before it lands, in seconds. */
export const FLIGHT_S = 0.45;

/** Rising whoosh with a thin rising whistle underneath it. */
export function launchEffect(): Effect {
  return {
    layers: [
      { kind: 'noise', filter: 'highpass', from: 300, to: 3200, start: 0, length: FLIGHT_S, gain: 0.22 },
      { kind: 'tone', wave: 'sawtooth', from: 140, to: 1100, start: 0.02, length: FLIGHT_S - 0.05, gain: 0.05 },
    ],
  };
}

/** A splash: a bright hiss that darkens quickly, over a soft low plop. */
export function splashEffect(): Effect {
  return {
    layers: [
      { kind: 'noise', filter: 'bandpass', from: 1800, to: 350, start: 0, length: 0.4, gain: 0.28 },
      { kind: 'tone', wave: 'sine', from: 220, to: 70, start: 0, length: 0.22, gain: 0.12 },
    ],
  };
}

/** An explosion: a loud low rumble that decays, with a sub-bass thump. */
export function explosionEffect(): Effect {
  return {
    layers: [
      { kind: 'noise', filter: 'lowpass', from: 4000, to: 120, start: 0, length: 0.7, gain: 0.5 },
      { kind: 'tone', wave: 'sine', from: 95, to: 32, start: 0, length: 0.55, gain: 0.3 },
    ],
  };
}

/** A sinking: the explosion, a second deeper blast, and a slow descending groan. */
export function sinkEffect(): Effect {
  const boom = explosionEffect().layers;
  return {
    layers: [
      ...boom,
      { kind: 'noise', filter: 'lowpass', from: 2500, to: 80, start: 0.35, length: 0.9, gain: 0.45 },
      { kind: 'tone', wave: 'sine', from: 70, to: 28, start: 0.35, length: 0.8, gain: 0.3 },
      { kind: 'tone', wave: 'triangle', from: 330, to: 110, start: 0.5, length: 1.0, gain: 0.07 },
    ],
  };
}

/** What a shot sounds like from launch to impact, for the given result. */
export function missileEffect(result: ShotResult): Effect {
  const landing = result === 'miss' ? splashEffect() : result === 'hit' ? explosionEffect() : sinkEffect();
  return {
    layers: [
      ...launchEffect().layers,
      ...landing.layers.map((layer) => ({ ...layer, start: layer.start + FLIGHT_S })),
    ],
  };
}

export function effectDuration(effect: Effect): number {
  return Math.max(...effect.layers.map((layer) => layer.start + layer.length));
}
