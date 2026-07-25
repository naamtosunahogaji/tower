/**
 * Tower Types
 *
 * Interfaces for configurable tower definitions, upgrades, and targeting.
 */

/**
 * Targeting strategies for towers
 */
export const TargetStrategy = {
  /** Target the enemy closest to the tower */
  Nearest: 'nearest',
  /** Target the enemy with the most health */
  Strongest: 'strongest',
  /** Target the enemy furthest along the path */
  First: 'first',
  /** Target the enemy least far along the path */
  Last: 'last',
} as const;

export type TargetStrategy = (typeof TargetStrategy)[keyof typeof TargetStrategy];

/**
 * Stats for a single upgrade level
 */
export interface UpgradeLevel {
  /** Damage per hit */
  damage: number;
  /** Attack range in pixels */
  range: number;
  /** Milliseconds between attacks */
  fireRate: number;
  /** Splash damage radius (0 = single target) */
  splashRadius?: number;
  /** Duration of slow effect in ms (0 = no slow) */
  slowDuration?: number;
  /** Speed multiplier when slowed (e.g. 0.5 = half speed) */
  slowFactor?: number;
  /** Tower color at this level */
  color: string;
  /** Cost to reach this level (level 0 = purchase cost) */
  cost: number;
}

/**
 * Complete definition of a tower type
 */
export interface TowerDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Stats for each upgrade level (exactly 3) */
  levels: [UpgradeLevel, UpgradeLevel, UpgradeLevel];
  /** Projectile travel speed in pixels/second */
  projectileSpeed: number;
  /** Projectile color */
  projectileColor: string;
  /** Projectile radius in pixels */
  projectileSize: number;
  /** Default targeting strategy */
  targetStrategy: TargetStrategy;
  /** Fraction of total cost refunded on sell (0-1) */
  sellRefundPercent: number;
}

/**
 * Interface that enemies must satisfy for tower targeting.
 * Keeps the tower system decoupled from specific enemy implementations.
 */
export interface TowerTarget {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  /** Progress along the path (0-1), used for First/Last targeting */
  pathProgress: number;
}
