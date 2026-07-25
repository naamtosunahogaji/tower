/**
 * Placement Grid
 *
 * Manages a grid of cells for object placement. Tracks occupancy, validates
 * placement, and converts between grid and screen coordinates.
 *
 * Usage:
 *   const grid = new PlacementGrid({ cols: 20, rows: 13, cellSize: 40, offsetX: 0, offsetY: 40 });
 *   grid.setCellState(5, 3, CellState.Path);    // Mark path cells
 *   if (grid.canPlace(10, 5)) {
 *     grid.place(10, 5, towerRef);
 *   }
 *   const center = grid.getCellCenter(10, 5);   // Screen position
 */

import { GridConfig, CellData, CellState, PlacementResult } from './placement-types';

export class PlacementGrid {
  private config: GridConfig;
  private cells: CellData[][];

  constructor(config: GridConfig) {
    this.config = config;

    if (config.cellSize <= 0) {
      throw new Error('PlacementGrid cellSize must be greater than 0');
    }
    if (config.rows <= 0) {
      throw new Error('PlacementGrid rows must be greater than 0');
    }
    if (config.cols <= 0) {
      throw new Error('PlacementGrid cols must be greater than 0');
    }

    this.cells = [];

    for (let row = 0; row < config.rows; row++) {
      this.cells[row] = [];
      for (let col = 0; col < config.cols; col++) {
        this.cells[row][col] = { state: CellState.Empty };
      }
    }
  }

  /**
   * Check if an object can be placed at the given cell
   */
  canPlace(col: number, row: number): boolean {
    if (!this.isInBounds(col, row)) return false;
    return this.cells[row][col].state === CellState.Empty;
  }

  /**
   * Place an object at the given cell
   */
  place(col: number, row: number, data?: unknown): PlacementResult {
    if (!this.isInBounds(col, row)) {
      return { success: false, col, row, reason: 'Out of bounds' };
    }

    const cell = this.cells[row][col];

    if (cell.state !== CellState.Empty) {
      return { success: false, col, row, reason: `Cell is ${cell.state}` };
    }

    cell.state = CellState.Occupied;
    cell.data = data;
    return { success: true, col, row };
  }

  /**
   * Remove an object from the given cell
   */
  remove(col: number, row: number): void {
    if (!this.isInBounds(col, row)) return;
    this.cells[row][col].state = CellState.Empty;
    this.cells[row][col].data = undefined;
  }

  /**
   * Get cell data at the given position
   */
  getCell(col: number, row: number): CellData | null {
    if (!this.isInBounds(col, row)) return null;
    return this.cells[row][col];
  }

  /**
   * Set the state of a cell (for marking path, blocked areas, etc.)
   */
  setCellState(col: number, row: number, state: CellState): void {
    if (!this.isInBounds(col, row)) return;
    this.cells[row][col].state = state;
  }

  /**
   * Convert screen coordinates to grid coordinates.
   * Returns null if the position is outside the grid.
   */
  getCellAt(screenX: number, screenY: number): { col: number; row: number } | null {
    const col = Math.floor((screenX - this.config.offsetX) / this.config.cellSize);
    const row = Math.floor((screenY - this.config.offsetY) / this.config.cellSize);

    if (!this.isInBounds(col, row)) return null;
    return { col, row };
  }

  /**
   * Get the screen-space center of a cell.
   * Note: Does not validate bounds. Callers should check isInBounds() first.
   */
  getCellCenter(col: number, row: number): { x: number; y: number } {
    return {
      x: this.config.offsetX + col * this.config.cellSize + this.config.cellSize / 2,
      y: this.config.offsetY + row * this.config.cellSize + this.config.cellSize / 2,
    };
  }

  /**
   * Get the screen-space top-left corner of a cell.
   * Note: Does not validate bounds. Callers should check isInBounds() first.
   */
  getCellTopLeft(col: number, row: number): { x: number; y: number } {
    return {
      x: this.config.offsetX + col * this.config.cellSize,
      y: this.config.offsetY + row * this.config.cellSize,
    };
  }

  /**
   * Check if coordinates are within the grid
   */
  isInBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.config.cols && row >= 0 && row < this.config.rows;
  }

  /**
   * Get the grid configuration
   */
  getConfig(): GridConfig {
    return this.config;
  }

  /**
   * Reset all cells to Empty
   */
  clear(): void {
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        this.cells[row][col] = { state: CellState.Empty };
      }
    }
  }
}
