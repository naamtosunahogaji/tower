/**
 * Enemy
 *
 * A single enemy that follows a path. Implements TowerTarget so the tower
 * system can target it without depending on this class directly.
 *
 * Slow handling: each enemy tracks one slow effect. Applying a new slow
 * refreshes the duration and applies the minimum (most aggressive) factor
 * of the existing and new slow — prevents stacking to zero speed.
 * A 20% minimum speed clamp guards against extreme stacking.
 */

import { MakkoEngine } from '@makko/engine';
import { PathFollower } from '../path/path-follower';
import { Waypoint } from '../path/path-types';
import { TowerTarget } from '../tower/tower-types';
import { EnemyTypeStats } from './enemy-types';

const MIN_SLOW_FACTOR = 0.2;

export class Enemy implements TowerTarget {
  readonly id: number;
  readonly type: EnemyTypeStats;

  private pathFollower: PathFollower;
  private baseSpeed: number;
  hp: number;
  maxHp: number;
  reward: number;
  livesLost: number;

  /** Current slow factor (1 = no slow) */
  private slowFactor: number = 1;
  /** Remaining slow duration in ms */
  private slowTimer: number = 0;
  /** Visual flash timer in ms (used when hit) */
  private flashTimer: number = 0;
  /** True after the enemy is killed and is fading out */
  private dead: boolean = false;
  /** Fade-out timer in ms after death */
  private deathTimer: number = 0;
  /** Total damage taken over the enemy's life (for UI) */
  private damageTaken: number = 0;

  constructor(id: number, type: EnemyTypeStats, waypoints: Waypoint[]) {
    this.id = id;
    this.type = type;
    this.hp = type.hp;
    this.maxHp = type.hp;
    this.reward = type.reward;
    this.livesLost = type.livesLost;
    this.baseSpeed = type.speed;
    this.pathFollower = new PathFollower({ waypoints });
  }

  /**
   * Update movement, slow expiration, and visual timers.
   * Returns true if the enemy has reached the end of the path.
   */
  update(dt: number): boolean {
    if (this.dead) {
      this.deathTimer -= dt;
      return false;
    }

    // Decay slow effect
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowTimer = 0;
        this.slowFactor = 1;
      }
    }

    // Decay damage flash
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
    }

    const effectiveSpeed = this.baseSpeed * this.slowFactor;
    this.pathFollower.update(dt, effectiveSpeed);
    return this.pathFollower.hasReachedEnd();
  }

  /**
   * Apply damage. Returns true if the enemy died from this hit.
   */
  takeDamage(amount: number): boolean {
    if (this.dead) return false;
    this.hp -= amount;
    this.damageTaken += amount;
    this.flashTimer = 80;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.deathTimer = 250;
      return true;
    }
    return false;
  }

  /**
   * Apply a slow effect. Refreshes duration; uses the more aggressive
   * (smaller) factor of the existing and incoming slow.
   */
  applySlow(factor: number, duration: number): void {
    if (this.dead) return;
    const clamped = Math.max(MIN_SLOW_FACTOR, factor);
    if (this.slowTimer > 0) {
      this.slowFactor = Math.min(this.slowFactor, clamped);
    } else {
      this.slowFactor = clamped;
    }
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  isDead(): boolean {
    return this.dead;
  }

  /** Fade-out progress 0-1 after death. */
  getDeathFade(): number {
    if (!this.dead) return 0;
    return 1 - this.deathTimer / 250;
  }

  shouldRemove(): boolean {
    return this.dead && this.deathTimer <= 0;
  }

  // === TowerTarget interface ===

  get x(): number {
    return this.pathFollower.getPosition().x;
  }

  get y(): number {
    return this.pathFollower.getPosition().y;
  }

  /** Y after applying flying altitude offset. */
  getDrawY(): number {
    return this.y - this.type.altitude;
  }

  get health(): number {
    return this.hp;
  }

  get maxHealth(): number {
    return this.maxHp;
  }

  get pathProgress(): number {
    return this.pathFollower.getProgress();
  }

  isFlying(): boolean {
    return this.type.flying;
  }

  isSlowed(): boolean {
    return this.slowTimer > 0;
  }

  getSlowFactor(): number {
    return this.slowFactor;
  }

  /**
   * Render the enemy — body shape, drop shadow, optional health bar,
   * slow tint, and damage flash. Uses MakkoEngine.display only.
   */
  render(): void {
    const display = MakkoEngine.display;
    const drawX = this.x;
    const drawY = this.getDrawY();
    const alpha = this.dead ? Math.max(0, 1 - this.getDeathFade()) : 1;

    // Drop shadow on the ground for ground units; fliers get no shadow
    if (!this.type.flying) {
      const shadowAlpha = alpha * 0.45;
      display.drawEllipse(drawX, drawY + this.type.radius * 0.6, this.type.radius * 0.9, this.type.radius * 0.3, {
        fill: '#000000',
        alpha: shadowAlpha,
      });
    }

    // Body
    const flash = this.flashTimer > 0;
    const bodyFill = flash ? '#ffffff' : this.type.color;
    const trimFill = flash ? '#dddddd' : this.type.trim;

    // Larger Brute / Boss get a chunky hex-like body, others a circle
    if (this.type.id === 'siege_boss' || this.type.id === 'brute') {
      // Hex body for the heavy hitters
      const pts: Array<{ x: number; y: number }> = [];
      const r = this.type.radius;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        pts.push({ x: drawX + r * Math.cos(a), y: drawY + r * Math.sin(a) });
      }
      display.drawPolygon(pts, { fill: bodyFill, stroke: trimFill, lineWidth: 2, alpha });
    } else {
      display.drawCircle(drawX, drawY, this.type.radius, { fill: bodyFill, stroke: trimFill, lineWidth: 2, alpha });
    }

    // Slow tint — pale blue overlay
    if (this.isSlowed() && !this.dead) {
      display.drawCircle(drawX, drawY, this.type.radius, {
        fill: '#7fd0e8',
        alpha: 0.25,
      });
    }

    // Flying accent: little wings
    if (this.type.flying && !this.dead) {
      display.drawLine(drawX - this.type.radius, drawY, drawX - this.type.radius - 4, drawY - 4, {
        stroke: '#ffffff',
        lineWidth: 1.5,
        alpha: alpha * 0.7,
      });
      display.drawLine(drawX + this.type.radius, drawY, drawX + this.type.radius + 4, drawY - 4, {
        stroke: '#ffffff',
        lineWidth: 1.5,
        alpha: alpha * 0.7,
      });
    }

    // Health bar (only when damaged)
    if (this.hp < this.maxHp && !this.dead) {
      const barW = this.type.radius * 2;
      const barH = 3;
      const barX = drawX - barW / 2;
      const barY = drawY - this.type.radius - 8;
      const pct = this.hp / this.maxHp;
      display.drawRect(barX, barY, barW, barH, { fill: '#1a1a1a', alpha: 0.7 });
      display.drawRect(barX, barY, barW * pct, barH, { fill: pct > 0.5 ? '#5cd46a' : '#e0c050', alpha: 0.95 });
    }
  }
}
