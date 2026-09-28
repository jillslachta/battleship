import { ComputerPlayer } from '../ai/computer';
import { Board, isSunk } from './board';
import { buildBoard, Rng, UniqueLayoutGenerator } from './placement';
import { Coord, Placement, ShotResult } from './types';

export type Turn = 'player' | 'computer';
export type Winner = Turn | null;

export interface TurnOutcome {
  by: Turn;
  coord: Coord;
  result: ShotResult;
  shipName?: string;
}

export class Game {
  readonly playerBoard: Board;
  readonly computerBoard: Board;
  private readonly computer: ComputerPlayer;
  turn: Turn = 'player';
  winner: Winner = null;

  constructor(
    playerPlacements: Placement[],
    computerPlacements: Placement[],
    rng: Rng = Math.random,
  ) {
    this.playerBoard = buildBoard(playerPlacements);
    this.computerBoard = buildBoard(computerPlacements);
    this.computer = new ComputerPlayer(rng);
  }

  get isOver(): boolean {
    return this.winner !== null;
  }

  playerFire(coord: Coord): TurnOutcome {
    if (this.isOver) throw new Error('Game is already over');
    if (this.turn !== 'player') throw new Error("It is not the player's turn");

    const { result, ship } = this.computerBoard.receiveShot(coord);
    if (this.computerBoard.allSunk) this.winner = 'player';
    else this.turn = 'computer';

    return { by: 'player', coord, result, shipName: ship?.name };
  }

  computerFire(): TurnOutcome {
    if (this.isOver) throw new Error('Game is already over');
    if (this.turn !== 'computer') throw new Error("It is not the computer's turn");

    const coord = this.computer.nextShot();
    const { result, ship } = this.playerBoard.receiveShot(coord);
    this.computer.record(coord, result, ship && isSunk(ship) ? ship.cells : []);

    if (this.playerBoard.allSunk) this.winner = 'computer';
    else this.turn = 'player';

    return { by: 'computer', coord, result, shipName: ship?.name };
  }
}

export const layoutGenerator = new UniqueLayoutGenerator();
