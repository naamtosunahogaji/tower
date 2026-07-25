/**
 * Object Pool
 *
 * Generic pool for reusable objects to reduce allocation churn.
 * Used by tower-system for projectile recycling.
 *
 * Usage:
 *   const pool = new Pool<TowerProjectile>(() => new TowerProjectile(), 50);
 *   const proj = pool.get();
 *   // ... use proj ...
 *   pool.release(proj);
 */

export class Pool<T extends { active: boolean }> {
  private factory: () => T;
  private items: T[] = [];
  private activeCount: number = 0;

  /**
   * Create a pool with a factory function and pre-allocated size.
   *
   * @param factory Function that creates a new instance
   * @param size Initial number of items to pre-allocate
   */
  constructor(factory: () => T, size: number = 16) {
    this.factory = factory;
    for (let i = 0; i < size; i++) {
      this.items.push(factory());
    }
  }

  /**
   * Acquire an item from the pool. Returns an existing inactive item
   * if one is available, otherwise creates a new one.
   */
  get(): T {
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].active) {
        this.items[i].active = true;
        this.activeCount++;
        return this.items[i];
      }
    }
    // No inactive item found — grow the pool.
    const item = this.factory();
    item.active = true;
    this.items.push(item);
    this.activeCount++;
    return item;
  }

  /**
   * Release an item back to the pool. Marks it as inactive.
   */
  release(item: T): void {
    if (!item.active) return;
    item.active = false;
    this.activeCount = Math.max(0, this.activeCount - 1);
  }

  /**
   * Iterate over all active items in the pool. Calls the callback
   * for each active item.
   */
  forEach(callback: (item: T) => void): void {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].active) {
        callback(this.items[i]);
      }
    }
  }

  /**
   * Get the current number of active items.
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * Get the total pool size (active + inactive).
   */
  getTotalSize(): number {
    return this.items.length;
  }

  /**
   * Deactivate all items and clear references.
   */
  clear(): void {
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].active = false;
    }
    this.activeCount = 0;
  }
}
