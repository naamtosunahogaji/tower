/**
 * Placement Renderer
 *
 * Renders a grid overlay on the display with cell highlighting for
 * valid/invalid placement and path/blocked visualization.
 *
 * Usage:
 *   const renderer = new PlacementRenderer();
 *   // In render loop:
 *   renderer.render(grid, hoveredCell, canPlace);
 */

import { MakkoEngine } from '@makko/engine';
import { PlacementGrid } from './placement-grid';
import { CellState } from './placement-types';

export class PlacementRenderer {
  /**
   * Render the grid overlay
   * @param grid The placement grid to render
   * @param hoveredCell Currently hovered cell (or null)
   * @param isValidPlacement Whether the hovered cell is a valid placement target
   * @param showGrid Whether to show grid lines
   */
  render(
    grid: PlacementGrid,
    hoveredCell?: { col: number; row: number } | null,
    isValidPlacement?: boolean,
    showGrid: boolean = true
  ): void {
    const display = MakkoEngine.display;
    const config = grid.getConfig();

    // Draw cell state backgrounds
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const cell = grid.getCell(col, row);
        if (!cell) continue;

        const tl = grid.getCellTopLeft(col, row);

        if (cell.state === CellState.Path) {
          display.drawRect(tl.x, tl.y, config.cellSize, config.cellSize, {
            fill: '#3d3020',
            alpha: 0.5,
          });
        } else if (cell.state === CellState.Blocked) {
          display.drawRect(tl.x, tl.y, config.cellSize, config.cellSize, {
            fill: '#333333',
            alpha: 0.3,
          });
        }
      }
    }

    // Draw grid lines (subtle, matching dark theme)
    if (showGrid) {
      const gridLeft = config.offsetX;
      const gridTop = config.offsetY;
      const gridRight = gridLeft + config.cols * config.cellSize;
      const gridBottom = gridTop + config.rows * config.cellSize;

      for (let col = 0; col <= config.cols; col++) {
        const x = gridLeft + col * config.cellSize;
        display.drawLine(x, gridTop, x, gridBottom, {
          stroke: '#4a9eff',
          lineWidth: 0.5,
          alpha: 0.06,
        });
      }

      for (let row = 0; row <= config.rows; row++) {
        const y = gridTop + row * config.cellSize;
        display.drawLine(gridLeft, y, gridRight, y, {
          stroke: '#4a9eff',
          lineWidth: 0.5,
          alpha: 0.06,
        });
      }
    }

    // Draw hovered cell highlight
    if (hoveredCell) {
      const tl = grid.getCellTopLeft(hoveredCell.col, hoveredCell.row);
      const color = isValidPlacement ? '#4a9eff' : '#CC4444';
      const alpha = isValidPlacement ? 0.25 : 0.2;

      display.drawRect(tl.x, tl.y, config.cellSize, config.cellSize, {
        fill: color,
        alpha,
      });

      display.drawRect(tl.x, tl.y, config.cellSize, config.cellSize, {
        stroke: color,
        lineWidth: 1.5,
        alpha: 0.5,
      });
    }
  }
}
