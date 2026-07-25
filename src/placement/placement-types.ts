/**
 * Placement Types
 *
 * Interfaces for grid-based object placement.
 */

/**
 * Cell states for the placement grid
 */
export const CellState = {
  Empty: 'empty',
  Occupied: 'occupied',
  Blocked: 'blocked',
  Path: 'path',
} as const;

export type CellState = (typeof CellState)[keyof typeof CellState];

/**
 * Grid configuration
 */
export interface GridConfig {
  /** Number of columns */
  cols: number;
  /** Number of rows */
  rows: number;
  /** Size of each cell in pixels */
  cellSize: number;
  /** X offset of the grid on screen */
  offsetX: number;
  /** Y offset of the grid on screen */
  offsetY: number;
}

/**
 * Data stored in each cell
 */
export interface CellData {
  state: CellState;
  /** Optional data attached to the cell (e.g. tower reference) */
  data?: unknown;
}

/**
 * Result of a placement attempt
 */
export interface PlacementResult {
  success: boolean;
  col: number;
  row: number;
  reason?: string;
}
