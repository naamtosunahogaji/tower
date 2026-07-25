/**
 * Spawn Point Manager
 *
 * Manages multiple spawn locations for enemies.
 * Supports random selection and offset positioning.
 *
 * Usage:
 *   const spawns = new SpawnPointManager();
 *   spawns.add('left', 0, 300);
 *   spawns.add('right', 800, 300);
 *   const pos = spawns.getPosition('left', 20); // With 20px random offset
 */

/**
 * Spawn point definition
 */
export interface SpawnPoint {
  id: string;
  x: number;
  y: number;
  active: boolean;
}

/**
 * SpawnPointManager - manages spawn locations
 */
export class SpawnPointManager {
  private spawnPoints: Map<string, SpawnPoint> = new Map();
  private defaultSpawnPoint: string | null = null;

  /**
   * Add a spawn point
   */
  add(id: string, x: number, y: number): void {
    this.spawnPoints.set(id, { id, x, y, active: true });
    if (!this.defaultSpawnPoint) {
      this.defaultSpawnPoint = id;
    }
  }

  /**
   * Remove a spawn point
   */
  remove(id: string): void {
    this.spawnPoints.delete(id);
    if (this.defaultSpawnPoint === id) {
      this.defaultSpawnPoint = this.spawnPoints.keys().next().value ?? null;
    }
  }

  /**
   * Get a spawn point by ID, or random if not specified
   */
  get(id?: string): SpawnPoint | null {
    if (id) {
      return this.spawnPoints.get(id) ?? null;
    }
    // Random active spawn point
    const active = Array.from(this.spawnPoints.values()).filter((sp) => sp.active);
    if (active.length === 0) return null;
    return active[Math.floor(Math.random() * active.length)];
  }

  /**
   * Get position with optional random offset
   */
  getPosition(id?: string, offsetRadius: number = 0): { x: number; y: number } | null {
    const sp = this.get(id);
    if (!sp) return null;

    let x = sp.x;
    let y = sp.y;

    if (offsetRadius > 0) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * offsetRadius;
      x += Math.cos(angle) * dist;
      y += Math.sin(angle) * dist;
    }

    return { x, y };
  }

  /**
   * Enable/disable a spawn point
   */
  setActive(id: string, active: boolean): void {
    const sp = this.spawnPoints.get(id);
    if (sp) {
      sp.active = active;
    }
  }

  /**
   * Get all spawn points
   */
  getAll(): SpawnPoint[] {
    return Array.from(this.spawnPoints.values());
  }

  /**
   * Get all active spawn points
   */
  getActive(): SpawnPoint[] {
    return Array.from(this.spawnPoints.values()).filter((sp) => sp.active);
  }

  /**
   * Clear all spawn points
   */
  clear(): void {
    this.spawnPoints.clear();
    this.defaultSpawnPoint = null;
  }
}

// ============================================================================
// Edge Spawner
// ============================================================================

/**
 * EdgeSpawner - spawns enemies from screen edges
 * Useful for survival/arena games where enemies come from all sides
 */
export class EdgeSpawner {
  private screenWidth: number;
  private screenHeight: number;
  private padding: number;

  constructor(screenWidth: number, screenHeight: number, padding: number = 20) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.padding = padding;
  }

  /**
   * Get a random position from any edge
   */
  getRandomEdgePosition(): { x: number; y: number; edge: 'top' | 'bottom' | 'left' | 'right' } {
    const edge = Math.floor(Math.random() * 4);
    return this.getEdgePosition(edge as 0 | 1 | 2 | 3);
  }

  /**
   * Get position from specific edge
   */
  getEdgePosition(edge: 0 | 1 | 2 | 3): {
    x: number;
    y: number;
    edge: 'top' | 'bottom' | 'left' | 'right';
  } {
    let x = 0;
    let y = 0;
    let edgeName: 'top' | 'bottom' | 'left' | 'right';

    switch (edge) {
      case 0: // Top
        x = Math.random() * this.screenWidth;
        y = -this.padding;
        edgeName = 'top';
        break;
      case 1: // Right
        x = this.screenWidth + this.padding;
        y = Math.random() * this.screenHeight;
        edgeName = 'right';
        break;
      case 2: // Bottom
        x = Math.random() * this.screenWidth;
        y = this.screenHeight + this.padding;
        edgeName = 'bottom';
        break;
      case 3: // Left
      default:
        x = -this.padding;
        y = Math.random() * this.screenHeight;
        edgeName = 'left';
        break;
    }

    return { x, y, edge: edgeName };
  }

  /**
   * Get position from edge opposite to a point (useful for surrounding player)
   */
  getOppositeEdgePosition(targetX: number, targetY: number): { x: number; y: number } {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;

    // Determine which side the target is on and spawn from opposite
    const dx = targetX - centerX;
    const dy = targetY - centerY;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Target is more left/right - spawn from opposite side
      return this.getEdgePosition(dx > 0 ? 3 : 1);
    } else {
      // Target is more top/bottom - spawn from opposite side
      return this.getEdgePosition(dy > 0 ? 0 : 2);
    }
  }
}
