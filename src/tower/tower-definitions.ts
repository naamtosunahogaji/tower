/**
 * Tower Definitions
 *
 * Data for all tower types in Aetherguard. Each tower has 3 upgrade levels
 * with progressive cost, damage, range, and fire rate.
 *
 * Targeting defaults:
 *   - Arrow Turret: First (prioritizes enemies furthest along the path)
 *   - Cannon Tower: First (high-value splash on grouped enemies)
 *   - Ice Spire: Strongest (sustained slow on tough enemies)
 *
 * A 4th slot (Lightning Rod) is stubbed for post-MVP.
 */

import { TargetStrategy, TowerDefinition } from './tower-types';

export const ARROW_TOWER: TowerDefinition = {
  id: 'arrow',
  name: 'Arrow Turret',
  description: 'Fast single-target shots. Cheap and reliable.',
  levels: [
    { damage: 8, range: 140, fireRate: 400, color: '#c49a6c', cost: 50 },
    { damage: 14, range: 170, fireRate: 320, color: '#d4a96a', cost: 75 },
    { damage: 22, range: 200, fireRate: 250, color: '#f0c987', cost: 100 },
  ],
  projectileSpeed: 600,
  projectileColor: '#f0d090',
  projectileSize: 3,
  targetStrategy: TargetStrategy.First,
  sellRefundPercent: 0.6,
};

export const CANNON_TOWER: TowerDefinition = {
  id: 'cannon',
  name: 'Cannon Tower',
  description: 'Slow fire, splash damage. Crushes clumps of foes.',
  levels: [
    { damage: 25, range: 180, fireRate: 1200, splashRadius: 60, color: '#6b6b6b', cost: 120 },
    { damage: 45, range: 220, fireRate: 1000, splashRadius: 75, color: '#888888', cost: 180 },
    { damage: 70, range: 260, fireRate: 850, splashRadius: 90, color: '#a8a8a8', cost: 240 },
  ],
  projectileSpeed: 480,
  projectileColor: '#ffaa55',
  projectileSize: 6,
  targetStrategy: TargetStrategy.First,
  sellRefundPercent: 0.6,
};

export const ICE_TOWER: TowerDefinition = {
  id: 'ice',
  name: 'Ice Spire',
  description: 'Moderate damage with a chilling slow effect.',
  levels: [
    { damage: 6, range: 150, fireRate: 800, slowDuration: 1500, slowFactor: 0.65, color: '#6ecbe0', cost: 100 },
    { damage: 10, range: 190, fireRate: 700, slowDuration: 2000, slowFactor: 0.55, color: '#8ad8e8', cost: 150 },
    { damage: 16, range: 230, fireRate: 600, slowDuration: 2500, slowFactor: 0.45, color: '#a8e5f0', cost: 200 },
  ],
  projectileSpeed: 520,
  projectileColor: '#a8e5f0',
  projectileSize: 4,
  targetStrategy: TargetStrategy.Strongest,
  sellRefundPercent: 0.6,
};

/** Stubbed tower for the 4th palette slot — Lightning Rod (post-MVP). */
export const LIGHTNING_TOWER: TowerDefinition = {
  id: 'lightning',
  name: 'Lightning Rod',
  description: 'Chain damage to nearby enemies. (Coming soon)',
  levels: [
    { damage: 15, range: 160, fireRate: 900, color: '#a87fff', cost: 150 },
    { damage: 25, range: 200, fireRate: 800, color: '#bf99ff', cost: 225 },
    { damage: 40, range: 240, fireRate: 700, color: '#d4b3ff', cost: 300 },
  ],
  projectileSpeed: 700,
  projectileColor: '#e0cfff',
  projectileSize: 4,
  targetStrategy: TargetStrategy.Nearest,
  sellRefundPercent: 0.6,
};

/** Ordered palette of playable tower types (lightning is stubbed / disabled in UI). */
export const TOWER_DEFINITIONS: TowerDefinition[] = [
  ARROW_TOWER,
  CANNON_TOWER,
  ICE_TOWER,
  LIGHTNING_TOWER,
];

/** Hotkey labels displayed on the palette chips. */
export const TOWER_HOTKEYS: Record<string, string> = {
  arrow: '1',
  cannon: '2',
  ice: '3',
  lightning: '4',
};
