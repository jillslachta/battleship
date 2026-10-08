import { ShotResult, Tune, shotTune, tuneFor } from '../audio/tune';

const STORAGE_KEY = 'battleship:sound';

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;

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
}

/**
 * Create (or wake) the audio system from inside a user gesture.
 * Phones, iPhone in particular, only allow a page to make sound once the
 * audio system has been started by a tap, so call this on the first shot.
 */
export function unlockAudio(): void {
  if (!soundEnabled()) return;
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

export function playResultTune(won: boolean): void {
  if (!soundEnabled()) return;
  const ctx = ensureContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  play(ctx, tuneFor(won));
}

export function playShotSound(result: ShotResult, by: 'player' | 'computer'): void {
  if (!soundEnabled()) return;
  const ctx = ensureContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const tune = shotTune(result);
  // The computer's shots are a touch quieter so your own feel like the main event.
  play(ctx, by === 'computer' ? { ...tune, gain: tune.gain * 0.7 } : tune);
}

function ensureContext(): AudioContext | null {
  if (context) return context;
  const Ctor = audioContextCtor();
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

function play(ctx: AudioContext, tune: Tune): void {
  const start = ctx.currentTime + 0.05;

  tune.notes.forEach((note) => {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    const at = start + note.start;

    oscillator.type = tune.wave;
    oscillator.frequency.setValueAtTime(note.freq, at);

    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(tune.gain, at + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + note.length);

    oscillator.connect(envelope).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + note.length + 0.05);
  });
}
