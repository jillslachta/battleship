import defeatUrl from '../assets/audio/defeat.mp3';
import explosionUrl from '../assets/audio/explosion.mp3';
import launchUrl from '../assets/audio/launch.mp3';
import splashUrl from '../assets/audio/splash.mp3';
import sunkUrl from '../assets/audio/sunk.mp3';
import themeUrl from '../assets/audio/theme.mp3';
import victoryUrl from '../assets/audio/victory.mp3';

export type ShotResult = 'miss' | 'hit' | 'sunk';

/** Seconds the missile is in the air before it lands (the launch clip plays during this). */
export const FLIGHT_S = 1.1;
/** Seconds after the landing clip starts before the boom or splash actually peaks. */
export const IMPACT_OFFSET_S = 0.45;

const STORAGE_KEY = 'battleship:sound';

/**
 * Loop points for the theme, in seconds. The drum pattern repeats every
 * 81,415 samples at 44.1 kHz; the loop spans exactly two patterns inside the
 * steady part of the clip, clear of its leading silence and fade-out.
 */
export const THEME_LOOP = { start: 121_380 / 44_100, end: 284_210 / 44_100 } as const;

const CLIPS = {
  launch: launchUrl,
  splash: splashUrl,
  explosion: explosionUrl,
  sunk: sunkUrl,
  theme: themeUrl,
  victory: victoryUrl,
  defeat: defeatUrl,
} as const;

type ClipName = keyof typeof CLIPS;
type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
const buffers = new Map<ClipName, AudioBuffer>();
const loading = new Map<ClipName, Promise<AudioBuffer | null>>();
let themeSource: AudioBufferSourceNode | null = null;
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
  if (!context) return;
  if (enabled) void context.resume();
  else void context.suspend();
}

/**
 * Create (or wake) the audio system from inside a user gesture and start
 * loading every clip. Phones only allow a page to make sound once the audio
 * system has been started by a tap, so call this on the first tap.
 */
export function unlockAudio(): void {
  const ctx = ensureContext();
  if (!ctx) return;
  if (ctx.state === 'suspended' && soundEnabled()) void ctx.resume();
  (Object.keys(CLIPS) as ClipName[]).forEach((name) => void load(name));
}

/** The missile sequence: launch now, then a splash or an explosion when it lands. */
export function playShotSound(result: ShotResult, by: 'player' | 'computer'): void {
  const ctx = readyContext();
  if (!ctx) return;
  const volume = by === 'computer' ? 0.7 : 1;
  const landing: ClipName = result === 'miss' ? 'splash' : result === 'hit' ? 'explosion' : 'sunk';
  void play(ctx, 'launch', 0, volume);
  void play(ctx, landing, FLIGHT_S, volume);
}

export function playResultTune(won: boolean): void {
  const ctx = readyContext();
  if (!ctx) return;
  stopTheme();
  void play(ctx, won ? 'victory' : 'defeat', 0.2, 1);
}

/** Start the looping title/setup theme. Safe to call more than once. */
export function startTheme(): void {
  const ctx = readyContext();
  if (!ctx || themeSource) return;
  void load('theme').then((buffer) => {
    if (!buffer || themeSource || !soundEnabled()) return;
    themeGain = ctx.createGain();
    themeGain.gain.setValueAtTime(0, ctx.currentTime);
    themeGain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 1);
    themeGain.connect(ctx.destination);
    themeSource = ctx.createBufferSource();
    themeSource.buffer = buffer;
    themeSource.loop = true;
    themeSource.loopStart = THEME_LOOP.start;
    themeSource.loopEnd = THEME_LOOP.end;
    themeSource.connect(themeGain);
    themeSource.start();
  });
}

/** Fade the theme out over a moment and stop it. */
export function stopTheme(): void {
  if (!context || !themeSource || !themeGain) {
    themeSource = null;
    themeGain = null;
    return;
  }
  const source = themeSource;
  const gain = themeGain;
  const at = context.currentTime;
  gain.gain.cancelScheduledValues(at);
  gain.gain.setValueAtTime(gain.gain.value, at);
  gain.gain.linearRampToValueAtTime(0, at + 0.7);
  source.stop(at + 0.75);
  themeSource = null;
  themeGain = null;
}

export function themePlaying(): boolean {
  return themeSource !== null;
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

function load(name: ClipName): Promise<AudioBuffer | null> {
  const cached = buffers.get(name);
  if (cached) return Promise.resolve(cached);
  const pending = loading.get(name);
  if (pending) return pending;
  const ctx = ensureContext();
  if (!ctx) return Promise.resolve(null);
  const promise = fetch(CLIPS[name])
    .then((response) => response.arrayBuffer())
    .then((data) => decode(ctx, data))
    .then((buffer) => {
      buffers.set(name, buffer);
      return buffer;
    })
    .catch(() => null);
  loading.set(name, promise);
  return promise;
}

/** Older Safari only supports the callback form of decodeAudioData. */
function decode(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const maybe = ctx.decodeAudioData(data, resolve, reject);
    if (maybe && typeof (maybe as Promise<AudioBuffer>).then === 'function') {
      (maybe as Promise<AudioBuffer>).then(resolve, reject);
    }
  });
}

async function play(ctx: AudioContext, name: ClipName, delay: number, volume: number): Promise<void> {
  const at = ctx.currentTime + delay;
  const buffer = await load(name);
  if (!buffer || !soundEnabled()) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain).connect(ctx.destination);
  // If loading took longer than the delay, play now rather than skipping.
  source.start(Math.max(at, ctx.currentTime));
}
