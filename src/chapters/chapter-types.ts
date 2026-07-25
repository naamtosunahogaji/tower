/**
 * Chapter Types
 *
 * One chapter = one playable level. Each chapter defines its grid (cols/rows,
 * cell size, screen offset), the path cells the enemies follow, player
 * starting resources, and the wave list.
 *
 * Waypoints are NOT pre-baked here — they are derived from the path cells
 * via `pathCellsToWaypoints()` so the path always matches the grid.
 */

import { WaveDefinition } from '../waves/wave-manager';

export interface ChapterGridConfig {
  cols: number;
  rows: number;
  cellSize: number;
  offsetX: number;
  offsetY: number;
}

export interface ChapterPath {
  /** Ordered grid cells the enemies traverse. Adjacent cells share an edge. */
  cells: Array<{ col: number; row: number }>;
}

export interface ChapterDefinition {
  id: number;
  name: string;
  description: string;
  grid: ChapterGridConfig;
  path: ChapterPath;
  /** Gold the player starts with */
  startingGold: number;
  /** Player lives at chapter start */
  startingLives: number;
  waves: WaveDefinition[];
}

/**
 * Convert a list of path cells into screen-space waypoints by snapping
 * each cell to its center. Returns a list of {x, y} in canvas pixels.
 */
export function pathCellsToWaypoints(
  cells: Array<{ col: number; row: number }>,
  grid: ChapterGridConfig
): Array<{ x: number; y: number }> {
  const waypoints: Array<{ x: number; y: number }> = [];
  for (const cell of cells) {
    waypoints.push({
      x: grid.offsetX + cell.col * grid.cellSize + grid.cellSize / 2,
      y: grid.offsetY + cell.row * grid.cellSize + grid.cellSize / 2,
    });
  }
  return waypoints;
}
