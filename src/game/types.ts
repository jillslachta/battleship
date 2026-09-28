export const BOARD_SIZE = 10;

export type Orientation = 'horizontal' | 'vertical';

export interface ShipSpec {
  name: string;
  size: number;
}

export const FLEET: readonly ShipSpec[] = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
] as const;

export interface Coord {
  row: number;
  col: number;
}

export interface Ship {
  name: string;
  size: number;
  cells: Coord[];
  hits: boolean[];
}

export type ShotResult = 'miss' | 'hit' | 'sunk';

export interface Shot {
  coord: Coord;
  result: ShotResult;
  shipName?: string;
}

export type Placement = {
  name: string;
  size: number;
  row: number;
  col: number;
  orientation: Orientation;
};
