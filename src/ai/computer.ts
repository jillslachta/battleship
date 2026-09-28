import { inBounds, key } from '../game/board';
import { BOARD_SIZE, Coord, ShotResult } from '../game/types';
import { Rng } from '../game/placement';

const NEIGHBOUR_OFFSETS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/**
 * Hunt/target AI: fires on a parity grid while hunting, then works outward
 * from live hits, locking onto a ship's axis once two hits line up.
 */
export class ComputerPlayer {
  private readonly tried = new Set<string>();
  private activeHits: Coord[] = [];

  constructor(private readonly rng: Rng = Math.random) {}

  get isHunting(): boolean {
    return this.activeHits.length === 0;
  }

  nextShot(): Coord {
    const targeted = this.targetCandidates();
    if (targeted.length > 0) return this.pick(targeted);

    const untried = this.untriedCells();
    if (untried.length === 0) throw new Error('No cells left to fire at');

    const parity = untried.filter(({ row, col }) => (row + col) % 2 === 0);
    return this.pick(parity.length > 0 ? parity : untried);
  }

  record(coord: Coord, result: ShotResult, sunkCells: Coord[] = []): void {
    this.tried.add(key(coord));

    if (result === 'hit') {
      this.activeHits.push(coord);
      return;
    }

    if (result === 'sunk') {
      const sunk = new Set(sunkCells.map(key));
      sunk.add(key(coord));
      this.activeHits = this.activeHits.filter((hit) => !sunk.has(key(hit)));
    }
  }

  private targetCandidates(): Coord[] {
    if (this.activeHits.length === 0) return [];

    const axis = this.lockedAxis();
    const candidates = axis ? this.axisEnds(axis) : this.neighbours(this.activeHits[0]);
    const usable = candidates.filter((cell) => inBounds(cell) && !this.tried.has(key(cell)));
    if (usable.length > 0) return usable;

    // Axis dead end (e.g. two separate ships hit): fall back to all hit neighbours.
    return this.activeHits
      .flatMap((hit) => this.neighbours(hit))
      .filter((cell) => inBounds(cell) && !this.tried.has(key(cell)));
  }

  private lockedAxis(): 'row' | 'col' | null {
    if (this.activeHits.length < 2) return null;
    const [first, ...rest] = this.activeHits;
    if (rest.every((hit) => hit.row === first.row)) return 'row';
    if (rest.every((hit) => hit.col === first.col)) return 'col';
    return null;
  }

  private axisEnds(axis: 'row' | 'col'): Coord[] {
    if (axis === 'row') {
      const row = this.activeHits[0].row;
      const cols = this.activeHits.map((hit) => hit.col);
      return [
        { row, col: Math.min(...cols) - 1 },
        { row, col: Math.max(...cols) + 1 },
      ];
    }
    const col = this.activeHits[0].col;
    const rows = this.activeHits.map((hit) => hit.row);
    return [
      { row: Math.min(...rows) - 1, col },
      { row: Math.max(...rows) + 1, col },
    ];
  }

  private neighbours(coord: Coord): Coord[] {
    return NEIGHBOUR_OFFSETS.map((offset) => ({
      row: coord.row + offset.row,
      col: coord.col + offset.col,
    }));
  }

  private untriedCells(): Coord[] {
    const cells: Coord[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!this.tried.has(key({ row, col }))) cells.push({ row, col });
      }
    }
    return cells;
  }

  private pick(cells: Coord[]): Coord {
    return cells[Math.floor(this.rng() * cells.length)];
  }
}
