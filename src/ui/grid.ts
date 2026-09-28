import { BOARD_SIZE } from '../game/types';
import { el } from './dom';

export interface GridRefs {
  root: HTMLElement;
  cells: HTMLButtonElement[][];
}

const COLUMN_LABELS = 'ABCDEFGHIJ'.split('');

export function coordLabel(row: number, col: number): string {
  return `${COLUMN_LABELS[col]}${row + 1}`;
}

export function createGrid(onCell?: (row: number, col: number) => void): GridRefs {
  const cells: HTMLButtonElement[][] = [];
  const root = el('div', { className: 'grid', attrs: { role: 'grid' } });

  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowCells: HTMLButtonElement[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = el('button', {
        className: 'cell',
        attrs: { type: 'button', 'data-row': String(row), 'data-col': String(col), 'aria-label': coordLabel(row, col) },
      });
      if (onCell) cell.addEventListener('click', () => onCell(row, col));
      root.append(cell);
      rowCells.push(cell);
    }
    cells.push(rowCells);
  }

  return { root, cells };
}

export function clearGridState(grid: GridRefs, className: string): void {
  grid.cells.flat().forEach((cell) => cell.classList.remove(className));
}
