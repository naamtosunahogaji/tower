/**
 * Tower
 *
 * A single placed tower that targets enemies within range and fires projectiles.
 * Supports multiple upgrade levels with visual indicators.
 *
 * Usage:
 *   const tower = new Tower(col, row, centerX, centerY, arrowTowerDef);
 *   // In update loop:
 *   const projectile = tower.update(dt, enemyTargets);
 *   if (projectile) { spawnProjectile(projectile); }
 */

import { MakkoEngine } from '@makko/engine';
import { TowerDefinition, TowerTarget, TargetStrategy, UpgradeLevel } from './tower-types';
import { TowerRenderer } from './renderers/tower-renderer';
import { ArrowRenderer } from './renderers/arrow-renderer';
import { CannonRenderer } from './renderers/cannon-renderer';
import { IceRenderer } from './renderers/ice-renderer';

/** Tower renderers keyed by definition id */
const RENDERERS: Record<string, TowerRenderer> = {
  arrow: new ArrowRenderer(),
  cannon: new CannonRenderer(),
  ice: new IceRenderer(),
};

export class Tower {
  readonly col: number;
  readonly row: number;
  /** Center X of the grid cell this tower occupies (pixels) */
  readonly x: number;
  /** Center Y of the grid cell this tower occupies (pixels) */
  readonly y: number;
  readonly definition: TowerDefinition;

  private currentLevel: number = 0;
  private cooldownTimer: number = 0;
  private showRange: boolean = false;
  private turretAngle: number = -Math.PI / 2; // default: pointing up

  constructor(col: number, row: number, x: number, y: number, definition: TowerDefinition) {
    this.col = col;
    this.row = row;
    this.x = x;
    this.y = y;
    this.definition = definition;
  }

  /**
   * Update targeting and cooldown.
   * The turret always tracks the best target in range.
   * Returns fire data if the tower fires this frame, null otherwise.
   */
  update(
    dt: number,
    targets: TowerTarget[]
  ): { targetX: number; targetY: number } | null {
    this.cooldownTimer -= dt;

    const stats = this.getStats();
    const target = this.findTarget(targets, stats.range);

    // Always aim at the best target
    if (target) {
      this.turretAngle = Math.atan2(target.y - this.y, target.x - this.x);
    }

    // Only fire when cooldown is ready
    if (this.cooldownTimer > 0 || !target) return null;

    this.cooldownTimer = stats.fireRate;

    return { targetX: target.x, targetY: target.y };
  }

  private findTarget(targets: TowerTarget[], range: number): TowerTarget | null {
    let best: TowerTarget | null = null;
    let bestValue = -Infinity;
    const rangeSq = range * range;

    for (const target of targets) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > rangeSq) continue;

      let value: number;

      switch (this.definition.targetStrategy) {
        case TargetStrategy.Nearest:
          value = -distSq;
          break;
        case TargetStrategy.Strongest:
          value = target.health;
          break;
        case TargetStrategy.First:
          value = target.pathProgress;
          break;
        case TargetStrategy.Last:
          value = -target.pathProgress;
          break;
        default:
          value = -distSq;
      }

      if (value > bestValue) {
        bestValue = value;
        best = target;
      }
    }

    return best;
  }

  /**
   * Get the stats for the current upgrade level
   */
  getStats(): UpgradeLevel {
    return this.definition.levels[this.currentLevel];
  }

  /**
   * Get the current range
   */
  getRange(): number {
    return this.getStats().range;
  }

  /**
   * Whether the tower can be upgraded further
   */
  canUpgrade(): boolean {
    return this.currentLevel < this.definition.levels.length - 1;
  }

  /**
   * Upgrade to the next level
   */
  upgrade(): void {
    if (this.canUpgrade()) {
      this.currentLevel++;
    }
  }

  /**
   * Get the cost to upgrade to the next level
   */
  getUpgradeCost(): number {
    if (!this.canUpgrade()) return 0;
    return this.definition.levels[this.currentLevel + 1].cost;
  }

  /**
   * Get the total gold invested in this tower
   */
  getTotalInvested(): number {
    let total = 0;
    for (let i = 0; i <= this.currentLevel; i++) {
      total += this.definition.levels[i].cost;
    }
    return total;
  }

  /**
   * Get the sell refund value
   */
  getSellValue(): number {
    return Math.floor(this.getTotalInvested() * this.definition.sellRefundPercent);
  }

  /**
   * Get the current upgrade level (0, 1, or 2)
   */
  getCurrentLevel(): number {
    return this.currentLevel;
  }

  /**
   * Set whether to show the range indicator
   */
  setShowRange(show: boolean): void {
    this.showRange = show;
  }

  /**
   * Render the tower
   */
  render(): void {
    const display = MakkoEngine.display;
    const stats = this.getStats();

    // Range indicator (when selected)
    if (this.showRange) {
      display.drawCircle(this.x, this.y, stats.range, {
        stroke: stats.color,
        lineWidth: 1,
        alpha: 0.3,
      });
      display.drawCircle(this.x, this.y, stats.range, {
        fill: stats.color,
        alpha: 0.05,
      });
    }

    // Delegate to type-specific renderer
    const renderer = RENDERERS[this.definition.id];
    if (renderer) {
      renderer.render({
        x: this.x,
        y: this.y,
        color: stats.color,
        level: this.currentLevel,
        angle: this.turretAngle,
        heightOffset: 12,
      });
    } else {
      // Fallback: simple circle for unknown tower types
      display.drawCircle(this.x, this.y, 14, { fill: '#333333' });
      display.drawCircle(this.x, this.y, 12, { fill: stats.color });
    }
  }
}
