import { Board, shipCells } from '../game/board';
import { layoutGenerator } from '../game/game';
import { FLEET, Orientation, Placement } from '../game/types';
import { el, mount } from './dom';
import { clearGridState, createGrid } from './grid';

export function renderSetup(onReady: (placements: Placement[]) => void): void {
  let placements: Placement[] = [];
  let orientation: Orientation = 'horizontal';
  let mode: 'choose' | 'manual' = 'choose';

  const grid = createGrid(handleCellClick);
  const status = el('p', { className: 'status' });
  const fleetList = el('ul', { className: 'fleet' });

  const manualButton = button('Place manually', () => {
    mode = 'manual';
    placements = [];
    update();
  });
  const randomButton = button('Randomize', () => {
    try {
      placements = layoutGenerator.next();
      mode = 'choose';
      update();
    } catch {
      warn('Could not lay out a random fleet — press Randomize again, or place your ships manually.');
    }
  });
  const rotateButton = button(`Rotate`, () => {
    orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
    update();
  });
  const resetButton = button('Clear board', () => {
    placements = [];
    update();
  });
  const startButton = button(
    'Start battle',
    () => {
      try {
        onReady(placements);
      } catch {
        warn('Could not lay out the enemy fleet — press Start battle again.');
      }
    },
    'primary-button',
  );

  grid.root.addEventListener('mouseover', (event) => previewFrom(event));
  grid.root.addEventListener('mouseleave', () => clearGridState(grid, 'cell--preview'));

  const view = el('section', { className: 'screen' }, [
    el('header', { className: 'screen__header' }, [
      el('h1', { className: 'screen__title', text: 'Deploy your fleet' }),
      status,
    ]),
    el('div', { className: 'setup' }, [
      el('div', { className: 'board' }, [el('h2', { className: 'board__label', text: 'Your waters' }), grid.root]),
      el('div', { className: 'setup__side' }, [
        el('div', { className: 'button-row' }, [manualButton, randomButton]),
        el('div', { className: 'button-row' }, [rotateButton, resetButton]),
        fleetList,
        startButton,
      ]),
    ]),
  ]);

  update();
  mount(view);

  function nextShip() {
    return FLEET[placements.length];
  }

  function handleCellClick(row: number, col: number) {
    if (mode !== 'manual') return;
    const spec = nextShip();
    if (!spec) return;
    const board = boardFrom(placements);
    if (!board.canPlace(row, col, spec.size, orientation)) {
      warn(`${spec.name} does not fit there — try another square.`);
      return;
    }
    placements = [...placements, { name: spec.name, size: spec.size, row, col, orientation }];
    update();
  }

  function previewFrom(event: Event) {
    const target = event.target as HTMLElement;
    if (mode !== 'manual' || !target.classList.contains('cell')) return;
    const spec = nextShip();
    clearGridState(grid, 'cell--preview');
    clearGridState(grid, 'cell--invalid');
    if (!spec) return;

    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    const board = boardFrom(placements);
    const valid = board.canPlace(row, col, spec.size, orientation);
    shipCells(row, col, spec.size, orientation).forEach((cell) => {
      const node = grid.cells[cell.row]?.[cell.col];
      node?.classList.add(valid ? 'cell--preview' : 'cell--invalid');
    });
  }

  function update() {
    grid.cells.flat().forEach((cell) => cell.classList.remove('cell--ship', 'cell--preview', 'cell--invalid'));
    placements.forEach((placement) => {
      shipCells(placement.row, placement.col, placement.size, placement.orientation).forEach(({ row, col }) => {
        grid.cells[row][col].classList.add('cell--ship');
      });
    });

    fleetList.replaceChildren(
      ...FLEET.map((spec, index) =>
        el('li', {
          className: `fleet__item${index < placements.length ? ' fleet__item--placed' : ''}${
            mode === 'manual' && index === placements.length ? ' fleet__item--active' : ''
          }`,
          text: `${spec.name} (${spec.size})`,
        }),
      ),
    );

    rotateButton.textContent = `Rotate: ${orientation === 'horizontal' ? 'across' : 'down'}`;
    rotateButton.disabled = mode !== 'manual';
    resetButton.disabled = placements.length === 0;
    startButton.disabled = placements.length !== FLEET.length;
    status.classList.remove('status--warn');

    if (placements.length === FLEET.length) {
      status.textContent = 'Fleet ready. Start the battle when you are.';
    } else if (mode === 'manual') {
      const spec = nextShip();
      status.textContent = `Tap a square to place your ${spec.name} (${spec.size} cells), ${
        orientation === 'horizontal' ? 'across' : 'down'
      }.`;
    } else {
      status.textContent = 'Place your ships yourself, or let the computer randomize a fresh layout.';
    }
  }

  function warn(message: string) {
    status.textContent = message;
    status.classList.add('status--warn');
  }
}

function boardFrom(placements: Placement[]): Board {
  const board = new Board();
  placements.forEach((placement) => board.place(placement));
  return board;
}

function button(label: string, onClick: () => void, className = 'button'): HTMLButtonElement {
  const node = el('button', { className, text: label, attrs: { type: 'button' } });
  node.addEventListener('click', onClick);
  return node;
}
