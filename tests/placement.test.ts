import { describe, expect, it } from 'vitest';
import { buildBoard, layoutSignature, randomPlacements, UniqueLayoutGenerator } from '../src/game/placement';
import { BOARD_SIZE, FLEET } from '../src/game/types';
import { inBounds } from '../src/game/board';

function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('random placement', () => {
  it('always produces a legal full fleet', () => {
    for (let i = 0; i < 200; i++) {
      const placements = randomPlacements();
      expect(placements).toHaveLength(FLEET.length);
      const board = buildBoard(placements);
      expect(board.ships).toHaveLength(FLEET.length);
      board.ships.forEach((ship) => {
        expect(ship.cells).toHaveLength(ship.size);
        ship.cells.forEach((cell) => expect(inBounds(cell)).toBe(true));
      });
      const occupied = new Set(board.ships.flatMap((s) => s.cells.map((c) => `${c.row},${c.col}`)));
      expect(occupied.size).toBe(FLEET.reduce((sum, spec) => sum + spec.size, 0));
      expect(occupied.size).toBeLessThan(BOARD_SIZE * BOARD_SIZE);
    }
  });
});

describe('UniqueLayoutGenerator', () => {
  it('never repeats a layout while unused ones remain', () => {
    const generator = new UniqueLayoutGenerator(seededRng(42));
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const signature = layoutSignature(generator.next());
      expect(seen.has(signature)).toBe(false);
      seen.add(signature);
    }
    expect(generator.usedCount).toBe(100);
  });

  it('resets its history once the pool of layouts is exhausted', () => {
    // A degenerate rng can only ever produce one layout, so the pool is exhausted
    // after a single draw.
    const generator = new UniqueLayoutGenerator(() => 0, [{ name: 'Destroyer', size: 2 }], 5);
    const first = layoutSignature(generator.next());
    expect(generator.usedCount).toBe(1);

    const second = layoutSignature(generator.next());
    expect(second).toBe(first);
    expect(generator.usedCount).toBe(1);
  });
});
