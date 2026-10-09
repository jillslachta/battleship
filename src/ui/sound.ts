import { Effect, missileEffect, ShotResult } from '../audio/effects';
import { menuTheme, Theme, Tune, tuneFor } from '../audio/tune';

const STORAGE_KEY = 'battleship:sound';

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let themeTimer = 0;
let themeGain: GainNode | null = null;

function audioContextCtor(): AudioContextCtor | undefined {
  const scope = globalThis as typeof globalThis & { webkitAudioContext?: AudioContextCtor };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

export function soundEnabled(): boolean {
  return window.localStorage.getItem(STORAGE_KEY) !== 'off';
}

export function setSoundEnabled(enabled: boolean): void {
  window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  if (!enabled && context) void context.suspend();
  if (enabled && context) void context.resume();
}

/**
 * Create (or wake) the audio system from inside a user gesture.
 * Phones, iPhone in particular, only allow a page to make sound once the
 * audio system has been started by a tap, so call this on the first tap.
 */
export function unlockAudio(): void {
  if (!soundEnabled()) return;
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

export function playResultTune(won: boolean): void {
  const ctx = readyContext();
  if (!ctx) return;
  playTune(ctx, tuneFor(won), ctx.destination);
}

/** The full missile sequence: launch whoosh, then a splash or an explosion on landing. */
export function playShotSound(result: ShotResult, by: 'player' | 'computer'): void {
  const ctx = readyContext();
  if (!ctx) return;
  playEffect(ctx, missileEffect(result), by === 'computer' ? 0.75 : 1);
}

/** Start the looping title/setup theme. Safe to call more than once. */
export function startTheme(): void {
  const ctx = readyContext();
  if (!ctx || themeTimer) return;
  themeGain = ctx.createGain();
  themeGain.gain.setValueAtTime(0, ctx.currentTime);
  themeGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.8);
  themeGain.connect(ctx.destination);
  const theme = menuTheme();
  let next = ctx.currentTime + 0.05;
  const loop = () => {
    if (!themeGain) return;
    scheduleTheme(ctx, theme, themeGain, next);
    next += theme.length;
    themeTimer = window.setTimeout(loop, (next - ctx.currentTime - 0.5) * 1000);
  };
  loop();
}

/** Fade the theme out over a moment and stop scheduling it. */
export function stopTheme(): void {
  window.clearTimeout(themeTimer);
  themeTimer = 0;
  if (context && themeGain) {
    const gain = themeGain;
    const at = context.currentTime;
    gain.gain.cancelScheduledValues(at);
    gain.gain.setValueAtTime(gain.gain.value, at);
    gain.gain.linearRampToValueAtTime(0, at + 0.6);
    window.setTimeout(() => gain.disconnect(), 800);
  }
  themeGain = null;
}

export function themePlaying(): boolean {
  return themeTimer !== 0;
}

/* ---------- internals ---------- */

function ensureContext(): AudioContext | null {
  if (context) return context;
  const Ctor = audioContextCtor();
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

function readyContext(): AudioContext | null {
  if (!soundEnabled()) return null;
  const ctx = ensureContext();
  if (!ctx) return null;
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function scheduleTheme(ctx: AudioContext, theme: Theme, out: AudioNode, at: number): void {
  theme.parts.forEach((part) => playTune(ctx, part, out, at));
}

function playTune(ctx: AudioContext, tune: Tune, out: AudioNode, from = ctx.currentTime + 0.05): void {
  tune.notes.forEach((note) => {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    const at = from + note.start;

    oscillator.type = tune.wave;
    oscillator.frequency.setValueAtTime(note.freq, at);

    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(tune.gain, at + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + note.length);

    oscillator.connect(envelope).connect(out);
    oscillator.start(at);
    oscillator.stop(at + note.length + 0.05);
  });
}

function playEffect(ctx: AudioContext, effect: Effect, volume: number): void {
  const from = ctx.currentTime + 0.02;

  effect.layers.forEach((layer) => {
    const at = from + layer.start;
    const end = at + layer.length;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(layer.gain * volume, at + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    envelope.connect(ctx.destination);

    if (layer.kind === 'tone') {
      const oscillator = ctx.createOscillator();
      oscillator.type = layer.wave;
      oscillator.frequency.setValueAtTime(layer.from, at);
      oscillator.frequency.exponentialRampToValueAtTime(layer.to, end);
      oscillator.connect(envelope);
      oscillator.start(at);
      oscillator.stop(end + 0.05);
    } else {
      const source = ctx.createBufferSource();
      source.buffer = noise(ctx);
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = layer.filter;
      filter.Q.value = layer.filter === 'bandpass' ? 1.2 : 0.8;
      filter.frequency.setValueAtTime(layer.from, at);
      filter.frequency.exponentialRampToValueAtTime(layer.to, end);
      source.connect(filter).connect(envelope);
      source.start(at);
      source.stop(end + 0.05);
    }
  });
}

/** Two seconds of white noise, generated once and reused. */
function noise(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const length = ctx.sampleRate * 2;
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}
