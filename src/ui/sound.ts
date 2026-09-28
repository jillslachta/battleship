import { Tune, tuneFor } from '../audio/tune';

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

export function playResultTune(won: boolean): void {
  if (!soundEnabled()) return;

  const Ctor = audioContextCtor();
  if (!Ctor) return;

  context ??= new Ctor();
  if (context.state === 'suspended') void context.resume();

  play(context, tuneFor(won));
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
