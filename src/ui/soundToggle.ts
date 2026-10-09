import { el } from './dom';
import { setSoundEnabled, soundEnabled } from './sound';

/** The shared "Sound: on / off" pill. `onChange` runs after the setting flips. */
export function createSoundToggle(onChange?: (enabled: boolean) => void): HTMLButtonElement {
  const toggle = el('button', { className: 'sound-toggle', attrs: { type: 'button' } });
  const paint = () => {
    const on = soundEnabled();
    toggle.textContent = on ? 'Sound: on' : 'Sound: off';
    toggle.setAttribute('aria-pressed', String(on));
  };
  toggle.addEventListener('click', () => {
    setSoundEnabled(!soundEnabled());
    paint();
    onChange?.(soundEnabled());
  });
  paint();
  return toggle;
}
