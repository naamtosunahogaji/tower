/**
 * Enemy Types
 *
 * Stat definitions for each enemy archetype. Five core types cover the
 * Aetherguard roster: Grunt, Runner, Brute, Flier, Siege Boss.
 */

export const ENEMY_TYPE = {
  Grunt: 'grunt',
  Runner: 'runner',
  Brute: 'brute',
  Flier: 'flier',
  SiegeBoss: 'siege_boss',
} as const;

export type EnemyTypeId = (typeof ENEMY_TYPE)[keyof typeof ENEMY_TYPE];

export interface EnemyTypeStats {
  id: EnemyTypeId;
  name: string;
  /** Max hit points */
  hp: number;
  /** Base movement speed in pixels per second */
  speed: number;
  /** Gold awarded on kill */
  reward: number;
  /** Body radius in pixels */
  radius: number;
  /** Body color */
  color: string;
  /** Outline / trim color */
  trim: string;
  /** Lives lost when this enemy reaches the end (boss: 3, others: 1) */
  livesLost: number;
  /** Draw the enemy at an elevated altitude (Fliers ignore terrain) */
  flying: boolean;
  /** Visual altitude offset in pixels above the path */
  altitude: number;
}

export const ENEMY_STATS: Record<EnemyTypeId, EnemyTypeStats> = {
  [ENEMY_TYPE.Grunt]: {
    id: ENEMY_TYPE.Grunt,
    name: 'Grunt',
    hp: 40,
    speed: 60,
    reward: 8,
    radius: 11,
    color: '#c94c4c',
    trim: '#7a2a2a',
    livesLost: 1,
    flying: false,
    altitude: 0,
  },
  [ENEMY_TYPE.Runner]: {
    id: ENEMY_TYPE.Runner,
    name: 'Runner',
    hp: 25,
    speed: 110,
    reward: 10,
    radius: 9,
    color: '#e07a3a',
    trim: '#7a3a1a',
    livesLost: 1,
    flying: false,
    altitude: 0,
  },
  [ENEMY_TYPE.Brute]: {
    id: ENEMY_TYPE.Brute,
    name: 'Brute',
    hp: 120,
    speed: 35,
    reward: 25,
    radius: 16,
    color: '#8a5a3a',
    trim: '#3a1a0a',
    livesLost: 1,
    flying: false,
    altitude: 0,
  },
  [ENEMY_TYPE.Flier]: {
    id: ENEMY_TYPE.Flier,
    name: 'Flier',
    hp: 35,
    speed: 75,
    reward: 15,
    radius: 10,
    color: '#9c5cc4',
    trim: '#4a2a6a',
    livesLost: 1,
    flying: true,
    altitude: 18,
  },
  [ENEMY_TYPE.SiegeBoss]: {
    id: ENEMY_TYPE.SiegeBoss,
    name: 'Siege Boss',
    hp: 800,
    speed: 20,
    reward: 200,
    radius: 24,
    color: '#3a1a1a',
    trim: '#ff6b4a',
    livesLost: 3,
    flying: false,
    altitude: 0,
  },
};

/** Resolve stats for an enemy type id; returns null for unknown. */
export function getEnemyStats(id: string): EnemyTypeStats | null {
  return (ENEMY_STATS as Record<string, EnemyTypeStats>)[id] ?? null;
}
