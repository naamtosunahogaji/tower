/**
 * Tower Projectile
 *
 * A poolable projectile that travels from a tower toward a target position.
 * Carries damage and optional splash/slow effect data.
 *
 * Usage:
 *   const pool = new Pool(() => new TowerProjectile(), 50);
 *   const proj = pool.get();
 *   proj.spawn(towerX, towerY, targetX, targetY, speed, damage, '#ff0', 3);
 */

import { MakkoEngine } from '@makko/engine';

export interface ProjectileSpawnOptions {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  color: string;
  size: number;
  splashRadius: number;
  slowDuration: number;
  slowFactor: number;
}

export class TowerProjectile {
  active: boolean = false;

  x: number = 0;
  y: number = 0;
  targetX: number = 0;
  targetY: number = 0;
  speed: number = 0;
  damage: number = 0;
  color: string = '#ffffff';
  size: number = 3;

  /** Splash radius (0 = single target) */
  splashRadius: number = 0;
  /** Slow effect duration in ms */
  slowDuration: number = 0;
  /** Slow speed multiplier */
  slowFactor: number = 1;

  /**
   * Initialize the projectile for flight
   */
  spawn(opts: ProjectileSpawnOptions): void {
    this.x = opts.x;
    this.y = opts.y;
    this.targetX = opts.targetX;
    this.targetY = opts.targetY;
    this.speed = opts.speed;
    this.damage = opts.damage;
    this.color = opts.color;
    this.size = opts.size;
    this.splashRadius = opts.splashRadius;
    this.slowDuration = opts.slowDuration;
    this.slowFactor = opts.slowFactor;
    this.active = true;
  }

  /**
   * Move toward target. Returns true when the target is reached.
   */
  update(dt: number): boolean {
    if (!this.active) return false;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const moveAmount = this.speed * (dt / 1000);

    if (dist <= moveAmount) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.active = false;
      return true;
    }

    this.x += (dx / dist) * moveAmount;
    this.y += (dy / dist) * moveAmount;
    return false;
  }

  /**
   * Whether this projectile deals splash (area) damage
   */
  hasSplash(): boolean {
    return this.splashRadius > 0;
  }

  /**
   * Whether this projectile applies a slow effect
   */
  hasSlow(): boolean {
    return this.slowDuration > 0 && this.slowFactor < 1;
  }

  /**
   * Render the projectile with a small drop shadow for 2.5D depth.
   * The projectile is drawn as a glowing orb; the shadow gives an
   * arc-of-flight feel.
   */
  render(): void {
    if (!this.active) return;

    const display = MakkoEngine.display;
    // Slight lift gives the projectile an arc-of-flight feel
    const arcLift = 4;

    // Drop shadow on the ground plane
    display.drawEllipse(this.x, this.y + 2, this.size * 1.4, this.size * 0.5, {
      fill: '#000000',
      alpha: 0.35,
    });

    // Projectile body (slightly raised)
    display.drawCircle(this.x, this.y - arcLift, this.size, {
      fill: this.color,
      shadow: { color: this.color, blur: 8 },
    });
  }
}
