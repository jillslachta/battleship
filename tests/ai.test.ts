import { describe, expect, it } from 'vitest';
import { ComputerPlayer } from '../src/ai/computer';
import { Game } from '../src/game/game';
import { randomPlacements } from '../src/game/placement';
import { Coord } from '../src/game/types';

const adjacent = (a: Coord, b: Coord) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

describe('computer opponent', () => {
  it('hunts neighbouring squares after a hit', () => {
    const ai = new ComputerPlayer();
    const hit = { row: 4, col: 4 };
    ai.record(hit, 'hit');
    expect(ai.isHunting).toBe(false);
    for (let i = 0; i < 20; i++) {
      expect(adjacent(hit, ai.nextShot())).toBe(true);
    }
  });

  it('follows the ship axis once two hits line up', () => {
    const ai = new ComputerPlayer();
    ai.record({ row: 4, col: 4 }, 'hit');
    ai.record({ row: 4, col: 5 }, 'hit');
    for (let i = 0; i < 20; i++) {
      const shot = ai.nextShot();
      expect(shot.row).toBe(4);
      expect([3, 6]).toContain(shot.col);
    }
  });

  it('returns to hunting after the ship is sunk', () => {
    const ai = new ComputerPlayer();
    ai.record({ row: 0, col: 0 }, 'hit');
    ai.record({ row: 0, col: 1 }, 'sunk', [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
    expect(ai.isHunting).toBe(true);
  });

  it('never fires at the same cell twice over a full game', () => {
    const ai = new ComputerPlayer();
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const shot = ai.nextShot();
      const key = `${shot.row},${shot.col}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      ai.record(shot, 'miss');
    }
    expect(() => ai.nextShot()).toThrow();
  });
});

describe('game flow', () => {
  it('alternates turns and ends when one fleet is destroyed', () => {
    const game = new Game(randomPlacements(), randomPlacements());
    expect(game.turn).toBe('player');

    let guard = 0;
    while (!game.isOver && guard++ < 250) {
      if (game.turn === 'player') {
        const target = firstUntargeted(game);
        game.playerFire(target);
      } else {
        game.computerFire();
      }
    }

    expect(game.isOver).toBe(true);
    expect(['player', 'computer']).toContain(game.winner);
    expect(() => game.computerFire()).toThrow();
  });

  it('keeps the turn with the player only after the player has fired', () => {
    const game = new Game(randomPlacements(), randomPlacements());
    game.playerFire({ row: 0, col: 0 });
    expect(game.turn).toBe('computer');
    expect(() => game.playerFire({ row: 0, col: 1 })).toThrow();
  });
});

function firstUntargeted(game: Game): Coord {
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (!game.computerBoard.alreadyShot({ row, col })) return { row, col };
    }
  }
  throw new Error('board exhausted');
}
