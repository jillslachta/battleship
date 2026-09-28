import { BOARD_SIZE, Coord, Orientation, Placement, Ship, ShotResult } from './types';

export function inBounds({ row, col }: Coord): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function shipCells(row: number, col: number, size: number, orientation: Orientation): Coord[] {
  const cells: Coord[] = [];
  for (let i = 0; i < size; i++) {
    cells.push(
      orientation === 'horizontal' ? { row, col: col + i } : { row: row + i, col },
    );
  }
  return cells;
}

export function key({ row, col }: Coord): string {
  return `${row},${col}`;
}

export class Board {
  readonly ships: Ship[] = [];
  private readonly occupied = new Map<string, Ship>();
  private readonly shotsTaken = new Map<string, ShotResult>();

  canPlace(row: number, col: number, size: number, orientation: Orientation): boolean {
    const cells = shipCells(row, col, size, orientation);
    return cells.every((cell) => inBounds(cell) && !this.occupied.has(key(cell)));
  }

  place(placement: Placement): Ship {
    const { name, size, row, col, orientation } = placement;
    if (!this.canPlace(row, col, size, orientation)) {
      throw new Error(`Invalid placement for ${name} at ${row},${col}`);
    }
    const cells = shipCells(row, col, size, orientation);
    const ship: Ship = { name, size, cells, hits: new Array(size).fill(false) };
    this.ships.push(ship);
    cells.forEach((cell) => this.occupied.set(key(cell), ship));
    return ship;
  }

  shipAt(coord: Coord): Ship | undefined {
    return this.occupied.get(key(coord));
  }

  alreadyShot(coord: Coord): boolean {
    return this.shotsTaken.has(key(coord));
  }

  resultAt(coord: Coord): ShotResult | undefined {
    return this.shotsTaken.get(key(coord));
  }

  receiveShot(coord: Coord): { result: ShotResult; ship?: Ship } {
    if (!inBounds(coord)) throw new Error('Shot out of bounds');
    if (this.alreadyShot(coord)) throw new Error('Cell already targeted');

    const ship = this.shipAt(coord);
    if (!ship) {
      this.shotsTaken.set(key(coord), 'miss');
      return { result: 'miss' };
    }

    const index = ship.cells.findIndex((cell) => cell.row === coord.row && cell.col === coord.col);
    ship.hits[index] = true;
    const result: ShotResult = isSunk(ship) ? 'sunk' : 'hit';
    this.shotsTaken.set(key(coord), 'hit');
    return { result, ship };
  }

  get allSunk(): boolean {
    return this.ships.length > 0 && this.ships.every(isSunk);
  }

  get remainingShips(): number {
    return this.ships.filter((ship) => !isSunk(ship)).length;
  }
}

export function isSunk(ship: Ship): boolean {
  return ship.hits.every(Boolean);
}
