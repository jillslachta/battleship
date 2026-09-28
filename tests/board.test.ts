import { describe, expect, it } from 'vitest';
import { Board, isSunk, shipCells } from '../src/game/board';
import { FLEET } from '../src/game/types';

describe('ship placement', () => {
  it('accepts a ship that fits on the board', () => {
    const board = new Board();
    expect(board.canPlace(0, 0, 5, 'horizontal')).toBe(true);
    const ship = board.place({ name: 'Carrier', size: 5, row: 0, col: 0, orientation: 'horizontal' });
    expect(ship.cells).toEqual(shipCells(0, 0, 5, 'horizontal'));
  });

  it('rejects a ship that runs off the edge', () => {
    const board = new Board();
    expect(board.canPlace(0, 6, 5, 'horizontal')).toBe(false);
    expect(board.canPlace(7, 0, 4, 'vertical')).toBe(false);
    expect(() => board.place({ name: 'Carrier', size: 5, row: 0, col: 6, orientation: 'horizontal' }))
      .toThrow();
  });

  it('rejects overlapping ships', () => {
    const board = new Board();
    board.place({ name: 'Carrier', size: 5, row: 2, col: 2, orientation: 'horizontal' });
    expect(board.canPlace(0, 4, 4, 'vertical')).toBe(false);
    expect(board.canPlace(0, 9, 4, 'vertical')).toBe(true);
  });

  it('places the full standard fleet of five ships', () => {
    const board = new Board();
    FLEET.forEach((spec, index) => {
      board.place({ name: spec.name, size: spec.size, row: index * 2, col: 0, orientation: 'horizontal' });
    });
    expect(board.ships).toHaveLength(5);
    expect(board.ships.map((ship) => ship.size).sort()).toEqual([2, 3, 3, 4, 5]);
  });
});

describe('firing', () => {
  it('reports a miss on empty water', () => {
    const board = new Board();
    board.place({ name: 'Destroyer', size: 2, row: 0, col: 0, orientation: 'horizontal' });
    expect(board.receiveShot({ row: 5, col: 5 }).result).toBe('miss');
  });

  it('reports a hit on a ship cell', () => {
    const board = new Board();
    board.place({ name: 'Destroyer', size: 2, row: 0, col: 0, orientation: 'horizontal' });
    const { result, ship } = board.receiveShot({ row: 0, col: 0 });
    expect(result).toBe('hit');
    expect(ship?.name).toBe('Destroyer');
  });

  it('reports sunk only when every cell of a ship is hit', () => {
    const board = new Board();
    board.place({ name: 'Cruiser', size: 3, row: 4, col: 1, orientation: 'vertical' });
    expect(board.receiveShot({ row: 4, col: 1 }).result).toBe('hit');
    expect(board.receiveShot({ row: 5, col: 1 }).result).toBe('hit');
    const final = board.receiveShot({ row: 6, col: 1 });
    expect(final.result).toBe('sunk');
    expect(isSunk(final.ship!)).toBe(true);
  });

  it('rejects firing at the same cell twice', () => {
    const board = new Board();
    board.receiveShot({ row: 1, col: 1 });
    expect(board.alreadyShot({ row: 1, col: 1 })).toBe(true);
    expect(() => board.receiveShot({ row: 1, col: 1 })).toThrow();
  });

  it('rejects shots outside the board', () => {
    const board = new Board();
    expect(() => board.receiveShot({ row: -1, col: 0 })).toThrow();
    expect(() => board.receiveShot({ row: 10, col: 0 })).toThrow();
  });
});

describe('win condition', () => {
  it('is not met while a ship survives, and is met once all are sunk', () => {
    const board = new Board();
    board.place({ name: 'Destroyer', size: 2, row: 0, col: 0, orientation: 'horizontal' });
    board.place({ name: 'Cruiser', size: 3, row: 2, col: 0, orientation: 'horizontal' });

    board.receiveShot({ row: 0, col: 0 });
    board.receiveShot({ row: 0, col: 1 });
    expect(board.allSunk).toBe(false);
    expect(board.remainingShips).toBe(1);

    board.receiveShot({ row: 2, col: 0 });
    board.receiveShot({ row: 2, col: 1 });
    board.receiveShot({ row: 2, col: 2 });
    expect(board.allSunk).toBe(true);
    expect(board.remainingShips).toBe(0);
  });
});
