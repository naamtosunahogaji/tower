/**
 * Tower Renderer Interface
 *
 * Each tower type implements this to draw its unique vector art.
 * The `heightOffset` parameter lifts the turret above its base for a 2.5D look.
 */

export interface TowerRenderContext {
  /** Center X of the grid cell (pixels). Towers render symmetrically around this point. */
  x: number;
  /** Center Y of the grid cell (pixels). This is the BASE position; the turret draws above. */
  y: number;
  color: string;
  level: number;
  /** Turret rotation in radians (0 = right, PI/2 = down) */
  angle: number;
  /** Pixels to lift the turret above the base for a 2.5D look (default 0). */
  heightOffset?: number;
}

export interface TowerRenderer {
  render(ctx: TowerRenderContext): void;
}
