import heroUrl from '../assets/battleship-hero.jpg';
import { el, mount } from './dom';

export function renderLanding(onBegin: () => void): void {
  const button = el('button', { className: 'primary-button', text: 'Begin Game', attrs: { type: 'button' } });
  button.addEventListener('click', onBegin);

  const view = el('section', { className: 'landing' }, [
    el('img', {
      className: 'landing__photo',
      attrs: { src: heroUrl, alt: 'A battleship steaming through heavy seas under a storm sky' },
    }),
    el('div', { className: 'landing__scrim' }),
    el('h1', { className: 'landing__title', text: 'BATTLESHIP' }),
    el('div', { className: 'landing__actions' }, [
      button,
      el('p', { className: 'landing__tagline', text: 'One captain. One smart opponent. Ten by ten.' }),
    ]),
  ]);

  mount(view);
}
