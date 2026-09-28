import { Board } from './board';
import { BOARD_SIZE, FLEET, Orientation, Placement, ShipSpec } from './types';

export type Rng = () => number;

export function randomPlacements(rng: Rng = Math.random, fleet: readonly ShipSpec[] = FLEET): Placement[] {
  for (let restart = 0; restart < 100; restart++) {
    const board = new Board();
    const placements: Placement[] = [];
    let failed = false;

    for (const spec of fleet) {
      let placed = false;
      for (let attempt = 0; attempt < 200 && !placed; attempt++) {
        const orientation: Orientation = rng() < 0.5 ? 'horizontal' : 'vertical';
        const limit = BOARD_SIZE - spec.size + 1;
        const row = Math.floor(rng() * (orientation === 'vertical' ? limit : BOARD_SIZE));
        const col = Math.floor(rng() * (orientation === 'horizontal' ? limit : BOARD_SIZE));
        if (board.canPlace(row, col, spec.size, orientation)) {
          const placement: Placement = { name: spec.name, size: spec.size, row, col, orientation };
          board.place(placement);
          placements.push(placement);
          placed = true;
        }
      }
      if (!placed) {
        failed = true;
        break;
      }
    }

    if (!failed) return placements;
  }
  throw new Error('Could not generate a valid random layout');
}

export function layoutSignature(placements: Placement[]): string {
  return [...placements]
    .map((p) => `${p.name}:${p.row},${p.col},${p.orientation[0]}`)
    .sort()
    .join('|');
}

/**
 * Hands out random layouts without repeating one until the pool of reachable
 * layouts has been exhausted, at which point the history resets.
 */
export class UniqueLayoutGenerator {
  private seen = new Set<string>();

  constructor(
    private readonly rng: Rng = Math.random,
    private readonly fleet: readonly ShipSpec[] = FLEET,
    private readonly attemptsBeforeReset = 250,
  ) {}

  get usedCount(): number {
    return this.seen.size;
  }

  next(): Placement[] {
    for (let attempt = 0; attempt < this.attemptsBeforeReset; attempt++) {
      const placements = randomPlacements(this.rng, this.fleet);
      const signature = layoutSignature(placements);
      if (!this.seen.has(signature)) {
        this.seen.add(signature);
        return placements;
      }
    }

    // Every sampled layout was already used: treat the pool as exhausted and start over.
    this.seen.clear();
    const placements = randomPlacements(this.rng, this.fleet);
    this.seen.add(layoutSignature(placements));
    return placements;
  }

  reset(): void {
    this.seen.clear();
  }
}

export function buildBoard(placements: Placement[]): Board {
  const board = new Board();
  placements.forEach((placement) => board.place(placement));
  return board;
}
