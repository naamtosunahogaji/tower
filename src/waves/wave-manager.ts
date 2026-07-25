/**
 * Wave Manager
 *
 * Orchestrates enemy wave spawning with progression and timing.
 * Define waves as data for easy balancing.
 *
 * Usage:
 *   const waveManager = new WaveManager(WAVES);
 *   waveManager.onEnemySpawn = (type, spawnPoint) => { spawnEnemy(type, spawnPoint); };
 *   waveManager.onWaveComplete = (wave) => { addReward(wave.reward); };
 *   // In game loop: waveManager.update(dt);
 */

const MIN_SPAWN_DELAY_MS = 16; // ~1 frame at 60fps

/**
 * Definition of enemies to spawn in a wave
 */
export interface EnemySpawn {
  /** Enemy type identifier */
  type: string;
  /** Number to spawn */
  count: number;
  /** Milliseconds between each spawn */
  delay: number;
  /** Optional spawn point ID (uses random if not specified) */
  spawnPoint?: string;
}

/**
 * Definition of a complete wave
 */
export interface WaveDefinition {
  /** Wave number/ID */
  id: number;
  /** Enemies to spawn in this wave */
  enemies: EnemySpawn[];
  /** Milliseconds before next wave can start */
  delayAfter: number;
  /** Optional reward for completing this wave */
  reward?: number;
  /** Is this a boss wave? */
  isBossWave?: boolean;
}

/**
 * Wave states
 */
export type WaveState = 'waiting' | 'spawning' | 'active' | 'completed' | 'finished';

/**
 * WaveManager - handles wave-based enemy spawning
 */
export class WaveManager {
  private waves: WaveDefinition[];
  private currentWaveIndex: number = 0;
  private state: WaveState = 'waiting';

  // Spawn tracking
  private spawnQueue: Array<{ type: string; spawnPoint?: string }> = [];
  private spawnTimer: number = 0;
  private currentSpawnDelay: number = 0;

  // Wave timing
  private waveDelayTimer: number = 0;
  private waveStartDelay: number = 3000;

  // Enemy tracking
  private activeEnemyCount: number = 0;

  // Callbacks
  /** Called when an enemy should be spawned */
  onEnemySpawn?: (type: string, spawnPoint?: string) => void;
  /** Called when a wave starts */
  onWaveStart?: (wave: WaveDefinition) => void;
  /** Called when a wave is completed */
  onWaveComplete?: (wave: WaveDefinition) => void;
  /** Called when all waves are finished */
  onAllWavesComplete?: () => void;

  constructor(waves: WaveDefinition[], startDelay: number = 3000) {
    this.waves = waves;
    this.waveStartDelay = startDelay;
    this.waveDelayTimer = startDelay;
    this.state = 'waiting';
  }

  /**
   * Update wave manager (call every frame)
   */
  update(dt: number): void {
    switch (this.state) {
      case 'waiting':
        this.waveDelayTimer -= dt;
        if (this.waveDelayTimer <= 0) {
          this.startWave();
        }
        break;

      case 'spawning':
        this.updateSpawning(dt);
        break;

      case 'active':
        // Waiting for all enemies to be defeated
        if (this.activeEnemyCount <= 0) {
          this.completeWave();
        }
        break;

      case 'completed':
        this.waveDelayTimer -= dt;
        if (this.waveDelayTimer <= 0) {
          this.currentWaveIndex++;
          if (this.currentWaveIndex >= this.waves.length) {
            this.state = 'finished';
            this.onAllWavesComplete?.();
          } else {
            this.startWave();
          }
        }
        break;
    }
  }

  private startWave(): void {
    if (this.waves.length === 0) {
      this.state = 'finished';
      this.onAllWavesComplete?.();
      return;
    }

    const wave = this.waves[this.currentWaveIndex];
    if (!wave) return;

    this.state = 'spawning';
    this.onWaveStart?.(wave);

    // Build spawn queue
    this.spawnQueue = [];
    for (const spawn of wave.enemies) {
      for (let i = 0; i < spawn.count; i++) {
        this.spawnQueue.push({
          type: spawn.type,
          spawnPoint: spawn.spawnPoint,
        });
      }
    }

    // Set initial delay
    this.currentSpawnDelay = Math.max(wave.enemies[0]?.delay ?? 500, MIN_SPAWN_DELAY_MS);
    this.spawnTimer = 0;
  }

  private updateSpawning(dt: number): void {
    this.spawnTimer += dt;

    while (this.spawnTimer >= this.currentSpawnDelay && this.spawnQueue.length > 0) {
      const spawn = this.spawnQueue.shift()!;
      this.onEnemySpawn?.(spawn.type, spawn.spawnPoint);
      this.activeEnemyCount++;
      this.spawnTimer -= this.currentSpawnDelay;

      // Update delay for next spawn
      const wave = this.waves[this.currentWaveIndex];
      if (wave) {
        const spawnDef = wave.enemies.find((e) => e.type === spawn.type);
        if (spawnDef) {
          this.currentSpawnDelay = Math.max(spawnDef.delay ?? 500, MIN_SPAWN_DELAY_MS);
        }
      }
    }

    if (this.spawnQueue.length === 0) {
      this.state = 'active';
    }
  }

  private completeWave(): void {
    const wave = this.waves[this.currentWaveIndex];
    if (!wave) return;

    this.state = 'completed';
    this.waveDelayTimer = wave.delayAfter;
    this.onWaveComplete?.(wave);
  }

  /**
   * Call when an enemy is defeated
   */
  enemyDefeated(): void {
    this.activeEnemyCount = Math.max(0, this.activeEnemyCount - 1);
  }

  /**
   * Skip to next wave (for testing/debug)
   */
  skipWave(): void {
    this.spawnQueue = [];
    this.activeEnemyCount = 0;
    this.completeWave();
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getCurrentWave(): WaveDefinition | null {
    return this.waves[this.currentWaveIndex] ?? null;
  }

  getWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  getTotalWaves(): number {
    return this.waves.length;
  }

  getState(): WaveState {
    return this.state;
  }

  isFinished(): boolean {
    return this.state === 'finished';
  }

  getActiveEnemyCount(): number {
    return this.activeEnemyCount;
  }

  /**
   * Get time until next wave (during waiting/completed states)
   */
  getTimeUntilNextWave(): number {
    if (this.state === 'waiting' || this.state === 'completed') {
      return Math.max(0, this.waveDelayTimer);
    }
    return 0;
  }
}

// ============================================================================
// Example Waves
// ============================================================================

/**
 * Example wave definitions - customize for your game
 */
export const EXAMPLE_WAVES: WaveDefinition[] = [
  {
    id: 1,
    enemies: [{ type: 'basic', count: 5, delay: 500 }],
    delayAfter: 3000,
    reward: 50,
  },
  {
    id: 2,
    enemies: [
      { type: 'basic', count: 3, delay: 400 },
      { type: 'fast', count: 2, delay: 600 },
    ],
    delayAfter: 3000,
    reward: 75,
  },
  {
    id: 3,
    enemies: [
      { type: 'basic', count: 5, delay: 300, spawnPoint: 'left' },
      { type: 'basic', count: 5, delay: 300, spawnPoint: 'right' },
    ],
    delayAfter: 4000,
    reward: 100,
  },
  {
    id: 4,
    enemies: [{ type: 'tank', count: 2, delay: 1000 }],
    delayAfter: 3000,
    reward: 150,
  },
  {
    id: 5,
    enemies: [{ type: 'boss', count: 1, delay: 0 }],
    delayAfter: 5000,
    reward: 500,
    isBossWave: true,
  },
];
