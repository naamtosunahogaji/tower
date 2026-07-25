/**
 * Tower Manager
 *
 * Manages all towers: placement, upgrading, selling, updating, and rendering.
 * Uses the PlacementGrid for position validation and Pool for projectiles.
 *
 * Usage:
 *   const manager = new TowerManager(grid);
 *   manager.onProjectileHit = (x, y, damage, splash, slow) => { applyDamage(...); };
 *   const tower = manager.placeTower(5, 3, arrowDef);
 *   // In game loop:
 *   manager.update(dt, enemyTargets);
 *   manager.render();
 */

import { Pool } from '../pool/pool';
import { PlacementGrid } from '../placement/placement-grid';
import { TowerDefinition, TowerTarget } from './tower-types';
import { Tower } from './tower';
import { TowerProjectile } from './tower-projectile';

export class TowerManager {
  private grid: PlacementGrid;
  private towers: Tower[] = [];
  private projectilePool: Pool<TowerProjectile>;

  /**
   * Callback when a projectile hits its target position.
   * The game scene wires this to apply damage/effects to enemies.
   */
  onProjectileHit?: (
    x: number,
    y: number,
    damage: number,
    splashRadius: number,
    slowDuration: number,
    slowFactor: number
  ) => void;

  constructor(grid: PlacementGrid, projectilePoolSize: number = 50) {
    this.grid = grid;
    this.projectilePool = new Pool<TowerProjectile>(
      () => new TowerProjectile(),
      projectilePoolSize
    );
  }

  /**
   * Place a new tower at the given grid position.
   * Returns the tower if successful, null if placement is invalid.
   */
  placeTower(col: number, row: number, definition: TowerDefinition): Tower | null {
    if (!this.grid.canPlace(col, row)) return null;

    const center = this.grid.getCellCenter(col, row);
    const tower = new Tower(col, row, center.x, center.y, definition);

    this.grid.place(col, row, tower);
    this.towers.push(tower);

    return tower;
  }

  /**
   * Upgrade a tower to its next level.
   * Returns the upgrade cost (0 if can't upgrade).
   */
  upgradeTower(tower: Tower): number {
    if (!tower.canUpgrade()) return 0;
    const cost = tower.getUpgradeCost();
    tower.upgrade();
    return cost;
  }

  /**
   * Sell a tower, removing it from the grid.
   * Returns the refund amount.
   */
  sellTower(tower: Tower): number {
    const refund = tower.getSellValue();

    this.grid.remove(tower.col, tower.row);
    const index = this.towers.indexOf(tower);
    if (index !== -1) {
      this.towers.splice(index, 1);
    }

    return refund;
  }

  /**
   * Update all towers and projectiles.
   * Towers target enemies and fire projectiles. Projectiles move and trigger hits.
   */
  update(dt: number, targets: TowerTarget[]): void {
    // Update towers (targeting and firing)
    for (const tower of this.towers) {
      const fireResult = tower.update(dt, targets);
      if (fireResult) {
        const stats = tower.getStats();
        const proj = this.projectilePool.get();
        proj.spawn({
          x: tower.x,
          y: tower.y,
          targetX: fireResult.targetX,
          targetY: fireResult.targetY,
          speed: tower.definition.projectileSpeed,
          damage: stats.damage,
          color: tower.definition.projectileColor,
          size: tower.definition.projectileSize,
          splashRadius: stats.splashRadius ?? 0,
          slowDuration: stats.slowDuration ?? 0,
          slowFactor: stats.slowFactor ?? 1,
        });
      }
    }

    // Update projectiles
    this.projectilePool.forEach((proj) => {
      const hit = proj.update(dt);
      if (hit) {
        this.onProjectileHit?.(
          proj.targetX,
          proj.targetY,
          proj.damage,
          proj.splashRadius,
          proj.slowDuration,
          proj.slowFactor
        );
      }
    });
  }

  /**
   * Render all towers and active projectiles
   */
  render(): void {
    // Render towers
    for (const tower of this.towers) {
      tower.render();
    }

    // Render projectiles
    this.projectilePool.forEach((proj) => {
      proj.render();
    });
  }

  /**
   * Get the tower at a grid position, if any
   */
  getTowerAt(col: number, row: number): Tower | null {
    return this.towers.find((t) => t.col === col && t.row === row) ?? null;
  }

  /**
   * Get all placed towers
   */
  getTowers(): Tower[] {
    return this.towers;
  }

  /**
   * Remove all towers and clear projectiles
   */
  clear(): void {
    for (const tower of this.towers) {
      this.grid.remove(tower.col, tower.row);
    }
    this.towers = [];
    this.projectilePool.clear();
  }
}
