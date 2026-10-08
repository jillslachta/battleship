import { isSunk } from '../game/board';
import { Game, TurnOutcome } from '../game/game';
import { layoutGenerator } from '../game/game';
import { Coord, FLEET, Placement } from '../game/types';
import { el, mount } from './dom';
import { clearGridState, coordLabel, createGrid } from './grid';
import { FLIGHT_S } from '../audio/effects';
import { playResultTune, playShotSound, stopTheme, unlockAudio } from './sound';
import { createSoundToggle } from './soundToggle';

const COMPUTER_DELAY_MS = 1100;
const TOAST_MS = 1800;
const FLIGHT_MS = FLIGHT_S * 1000;
/** How long the explosion or splash plays before the square settles into its final mark. */
const IMPACT_MS = 650;

export function renderBattle(playerPlacements: Placement[], onPlayAgain: () => void): void {
  const game = new Game(playerPlacements, layoutGenerator.next());

  const enemyGrid = createGrid((row, col) => handlePlayerShot({ row, col }));
  const ownGrid = createGrid();
  const turnBanner = el('p', { className: 'turn' });
  const log = el('ul', { className: 'log' });
  const enemyCount = el('span', { className: 'board__count' });
  const ownCount = el('span', { className: 'board__count' });
  const overlay = el('div', { className: 'overlay overlay--hidden' });
  const soundToggle = createSoundToggle();
  const toast = el('div', { className: 'toast toast--hidden', attrs: { role: 'status', 'aria-live': 'polite' } });
  let lastComputerShot = '';
  let lastPlayerShot = '';
  let toastTimer = 0;

  stopTheme();

  playerPlacements.forEach((placement) => {
    for (let i = 0; i < placement.size; i++) {
      const row = placement.orientation === 'vertical' ? placement.row + i : placement.row;
      const col = placement.orientation === 'horizontal' ? placement.col + i : placement.col;
      ownGrid.cells[row][col].classList.add('cell--ship');
    }
  });
  ownGrid.cells.flat().forEach((cell) => (cell.disabled = true));

  const view = el('section', { className: 'screen' }, [
    el('header', { className: 'screen__header' }, [
      el('h1', { className: 'screen__title', text: 'Battle stations' }),
      turnBanner,
      soundToggle,
    ]),
    el('div', { className: 'battle' }, [
      el('div', { className: 'board' }, [
        el('h2', { className: 'board__label' }, ['Enemy waters ', enemyCount]),
        enemyGrid.root,
      ]),
      el('div', { className: 'board' }, [
        el('h2', { className: 'board__label' }, ['Your waters ', ownCount]),
        ownGrid.root,
      ]),
    ]),
    el('div', { className: 'log-panel' }, [el('h2', { className: 'log__title', text: 'Battle log' }), log]),
    toast,
    overlay,
  ]);

  update();
  mount(view);

  function handlePlayerShot(coord: Coord) {
    if (game.isOver || game.turn !== 'player' || game.computerBoard.alreadyShot(coord)) return;

    // A tap is the only moment a phone lets a page start making sound.
    unlockAudio();

    clearGridState(ownGrid, 'cell--latest');
    const outcome = game.playerFire(coord);
    const cell = enemyGrid.cells[coord.row][coord.col];
    cell.disabled = true;
    cell.classList.add('cell--target');
    enemyGrid.root.classList.add('grid--locked');
    turnBanner.textContent = `Missile away to ${coordLabel(coord.row, coord.col)}…`;
    turnBanner.className = 'turn turn--flight';
    playShotSound(outcome.result, 'player');

    window.setTimeout(() => {
      cell.classList.remove('cell--target');
      paint(cell, outcome);
      if (outcome.result === 'sunk') markSunk(enemyGrid.cells, outcome);
      lastPlayerShot = describe(outcome);
      addLog(outcome);
      if (outcome.result === 'sunk') showToast(`You sunk the ${outcome.shipName}!`, 'toast--player');
      update();
      if (!game.isOver) window.setTimeout(computerTurn, COMPUTER_DELAY_MS);
    }, FLIGHT_MS);
  }

  function computerTurn() {
    if (game.isOver || game.turn !== 'computer') return;
    const outcome = game.computerFire();
    const cell = ownGrid.cells[outcome.coord.row][outcome.coord.col];
    cell.classList.add('cell--target');
    turnBanner.textContent = 'Incoming…';
    turnBanner.className = 'turn turn--computer';
    playShotSound(outcome.result, 'computer');

    window.setTimeout(() => {
      cell.classList.remove('cell--target');
      paint(cell, outcome);
      cell.classList.add('cell--latest');
      lastComputerShot = describe(outcome);
      if (outcome.result === 'sunk') markSunk(ownGrid.cells, outcome);
      addLog(outcome);
      if (outcome.result === 'sunk') showToast(`Computer sunk your ${outcome.shipName}!`, 'toast--computer');
      update();
    }, FLIGHT_MS);
  }

  function showToast(message: string, variant: string) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast ${variant}`;
    toastTimer = window.setTimeout(() => toast.classList.add('toast--hidden'), TOAST_MS);
  }

  function markSunk(cells: HTMLButtonElement[][], outcome: TurnOutcome) {
    const board = outcome.by === 'player' ? game.computerBoard : game.playerBoard;
    const ship = board.ships.find((candidate) => candidate.name === outcome.shipName);
    if (!ship || !isSunk(ship)) return;
    ship.cells.forEach(({ row, col }) => cells[row][col].classList.add('cell--sunk'));
  }

  function paint(cell: HTMLButtonElement, outcome: TurnOutcome) {
    const impact = outcome.result === 'miss' ? 'cell--splash' : 'cell--boom';
    cell.classList.add(outcome.result === 'miss' ? 'cell--miss' : 'cell--hit', impact);
    cell.disabled = true;
    window.setTimeout(() => cell.classList.remove(impact), IMPACT_MS);
  }

  function describe(outcome: TurnOutcome) {
    const who = outcome.by === 'player' ? 'You' : 'Computer';
    const where = coordLabel(outcome.coord.row, outcome.coord.col);
    return outcome.result === 'miss'
      ? `${who} fired at ${where} — miss.`
      : outcome.result === 'hit'
        ? `${who} fired at ${where} — HIT!`
        : `${who} fired at ${where} — SUNK the ${outcome.shipName}!`;
  }

  function addLog(outcome: TurnOutcome) {
    log.prepend(el('li', { className: `log__item log__item--${outcome.result}`, text: describe(outcome) }));
  }

  function update() {
    enemyCount.textContent = `${game.computerBoard.remainingShips}/${FLEET.length} afloat`;
    ownCount.textContent = `${game.playerBoard.remainingShips}/${FLEET.length} afloat`;

    if (game.isOver) {
      window.clearTimeout(toastTimer);
      toast.classList.add('toast--hidden');
      const summary = game.winner === 'player' ? 'Enemy fleet destroyed.' : 'Your fleet is lost.';
      const finalShot = game.winner === 'computer' ? lastComputerShot : '';
      turnBanner.textContent = finalShot ? `${finalShot} ${summary}` : summary;
      turnBanner.className = 'turn turn--over';
      showResult(game.winner === 'player');
      return;
    }

    const playerTurn = game.turn === 'player';
    turnBanner.textContent = !playerTurn
      ? `${lastPlayerShot} Computer is taking aim…`
      : lastComputerShot
        ? `${lastComputerShot} Your turn — pick a target square.`
        : 'Your turn — pick a target square.';
    turnBanner.className = `turn ${playerTurn ? 'turn--player' : 'turn--computer'}`;
    enemyGrid.root.classList.toggle('grid--locked', !playerTurn);
  }

  function showResult(won: boolean) {
    playResultTune(won);

    const again = el('button', { className: 'primary-button', text: 'Play again', attrs: { type: 'button' } });
    again.addEventListener('click', onPlayAgain);
    overlay.classList.remove('overlay--hidden');
    overlay.replaceChildren(
      el('div', { className: `result result--${won ? 'win' : 'lose'}` }, [
        el('h2', { className: 'result__title', text: won ? 'Victory!' : 'Defeated' }),
        ...(won || !lastComputerShot ? [] : [el('p', { className: 'result__shot', text: lastComputerShot })]),
        el('p', {
          className: 'result__text',
          text: won
            ? 'You sank every enemy ship. The seas are yours.'
            : 'Your fleet is on the bottom. The computer holds the waters.',
        }),
        again,
      ]),
    );
  }
}
