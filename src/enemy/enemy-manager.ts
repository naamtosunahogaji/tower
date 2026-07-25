/**
 * Enemy Manager
 *
 * Owns the active enemy list. Provides spawn, update, damage application,
 * splash damage by distance, slow application, and removal. Also feeds
 * `TowerTarget` snapshots back to the tower system.
 */

import { Enemy } from './enemy';
import { getEnemyStats } from './enemy-types';
import { Waypoint } from '../path/path-types';
import { TowerTarget } from '../tower/tower-types';

export interface ProjectileHitInfo {
  x: number;
  y: number;
  damage: number;
  splashRadius: number;
  slowDuration: number;
  slowFactor: number;
}

export class EnemyManager {
  private enemies: Enemy[] = [];
  private nextId: number = 1;
  private waypoints: Waypoint[];
  private countByType: Map<string, number> = new Map();

  /** Callback when an enemy reaches the end of the path */
  onEnemyReachedEnd?: (enemy: Enemy) => void;
  /** Callback when an enemy dies (killed by tower) */
  onEnemyKilled?: (enemy: Enemy) => void;
  /** Callback when a slow effect is applied to an enemy */
  onSlowApplied?: (enemy: Enemy, factor: number, duration: number) => void;
  /** Callback when an enemy is hit (for damage floats, etc.) */
  onEnemyHit?: (enemy: Enemy, damage: number) => void;

  constructor(waypoints: Waypoint[]) {
    this.waypoints = waypoints;
  }

  /**
   * Spawn an enemy by type. Returns the new Enemy or null for unknown types.
   */
  spawn(typeId: string): Enemy | null {
    const stats = getEnemyStats(typeId);
    if (!stats) return null;

    const enemy = new Enemy(this.nextId++, stats, this.waypoints);
    this.enemies.push(enemy);
    this.countByType.set(typeId, (this.countByType.get(typeId) ?? 0) + 1);
    return enemy;
  }

  /**
   * Update all enemies. Handles movement, end-of-path reach events, and
   * removal of fully-faded dead enemies.
   */
  update(dt: number): void {
    const toRemove: Enemy[] = [];

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];

      if (enemy.shouldRemove()) {
        toRemove.push(enemy);
        continue;
      }

      const reachedEnd = enemy.update(dt);
      if (reachedEnd && !enemy.isDead()) {
        this.onEnemyReachedEnd?.(enemy);
        toRemove.push(enemy);
      }
    }

    if (toRemove.length > 0) {
      this.enemies = this.enemies.filter((e) => !toRemove.includes(e));
    }
  }

  /**
   * Apply a projectile hit at (x, y) with the given damage/effects.
   * Splash damage is applied by distance to all enemies within the radius.
   * Returns the number of enemies damaged.
   */
  applyProjectileHit(hit: ProjectileHitInfo): number {
    let count = 0;

    for (const enemy of this.enemies) {
      if (enemy.isDead()) continue;

      const dx = enemy.x - hit.x;
      const dy = enemy.getDrawY() - hit.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let inRange = false;
      let damageMul = 1;

      if (hit.splashRadius > 0) {
        if (dist <= hit.splashRadius) {
          inRange = true;
          // Falloff: 100% at center, 50% at edge of splash
          damageMul = 1 - 0.5 * (dist / hit.splashRadius);
        }
      } else {
        // Single-target: hit the enemy the projectile is aimed at.
        // Approximate by checking distance to hit point <= 18 px.
        if (dist <= 18) {
          inRange = true;
        }
      }

      if (inRange) {
        const dmg = hit.damage * damageMul;
        const died = enemy.takeDamage(dmg);
        this.onEnemyHit?.(enemy, dmg);
        count++;

        if (died) {
          this.onEnemyKilled?.(enemy);
        } else if (hit.slowDuration > 0 && hit.slowFactor < 1) {
          enemy.applySlow(hit.slowFactor, hit.slowDuration);
          this.onSlowApplied?.(enemy, hit.slowFactor, hit.slowDuration);
        }
      }
    }

    return count;
  }

  /**
   * Build a snapshot of currently-alive enemies as TowerTarget objects.
   * The tower system reads these each frame for targeting.
   */
  getTargets(): TowerTarget[] {
    const result: TowerTarget[] = [];
    for (const enemy of this.enemies) {
      if (enemy.isDead()) continue;
      result.push({
        x: enemy.x,
        y: enemy.getDrawY(),
        health: enemy.hp,
        maxHealth: enemy.maxHp,
        pathProgress: enemy.pathProgress,
      });
    }
    return result;
  }

  /**
   * Render all enemies (call after towers so flying enemies sort properly).
   */
  render(): void {
    // Sort by draw Y for back-to-front depth (fliers last to sit above)
    const sorted = [...this.enemies].sort((a, b) => a.getDrawY() - b.getDrawY());
    for (const enemy of sorted) {
      enemy.render();
    }
  }

  /**
   * Get all live enemy instances (for UI / queries).
   */
  getEnemies(): Enemy[] {
    return this.enemies;
  }

  /**
   * Number of alive enemies.
   */
  getActiveCount(): number {
    return this.enemies.filter((e) => !e.isDead()).length;
  }

  /**
   * Remove every enemy and reset counters.
   */
  clear(): void {
    this.enemies = [];
    this.nextId = 1;
    this.countByType.clear();
  }

  /**
   * Reconfigure the path the enemies follow.
   */
  setWaypoints(waypoints: Waypoint[]): void {
    this.waypoints = waypoints;
  }
}
