/**
 * Path Follower
 *
 * Follows a sequence of waypoints at a configurable speed.
 * Speed is passed into update() so callers can apply modifiers (e.g. slow effects).
 *
 * Usage:
 *   const path = new PathFollower({ waypoints: [{x:0,y:0}, {x:100,y:0}, {x:100,y:100}] });
 *   // In update loop:
 *   path.update(dt, speed);
 *   const pos = path.getPosition();
 *   if (path.hasReachedEnd()) { // arrived }
 */

import { Waypoint, PathConfig } from './path-types';

export class PathFollower {
  private waypoints: Waypoint[];
  private loop: boolean;

  /** Index of the waypoint we're moving FROM (toward waypoints[currentIndex + 1]) */
  private currentIndex: number = 0;
  /** 0-1 interpolation between current waypoint and next */
  private segmentT: number = 0;

  private segmentLengths: number[] = [];
  private totalDistance: number = 0;
  private distanceTraveled: number = 0;
  private reachedEnd: boolean = false;

  /** Pre-allocated position object returned by getPosition() */
  private cachedPosition = { x: 0, y: 0 };
  /** Pre-allocated direction object returned by getDirection() */
  private cachedDirection = { x: 0, y: 0 };

  constructor(config: PathConfig) {
    if (config.waypoints.length === 0) {
      throw new Error('PathFollower requires at least one waypoint');
    }

    this.waypoints = config.waypoints;
    this.loop = config.loop ?? false;

    if (this.loop && this.waypoints.length < 2) {
      this.loop = false; // Can't loop with fewer than 2 waypoints
    }

    this.preCalculate();

    // Initialize cached position to starting waypoint
    this.cachedPosition.x = this.waypoints[0].x;
    this.cachedPosition.y = this.waypoints[0].y;
  }

  private preCalculate(): void {
    this.segmentLengths = [];
    this.totalDistance = 0;

    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const a = this.waypoints[i];
      const b = this.waypoints[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      this.segmentLengths.push(len);
      this.totalDistance += len;
    }

    // Add closing segment for loops
    if (this.loop && this.waypoints.length > 1) {
      const last = this.waypoints[this.waypoints.length - 1];
      const first = this.waypoints[0];
      const dx = first.x - last.x;
      const dy = first.y - last.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      this.segmentLengths.push(len);
      this.totalDistance += len;
    }
  }

  /**
   * Advance along the path.
   * @param dt Delta time in milliseconds
   * @param speed Movement speed in pixels per second
   */
  update(dt: number, speed: number): void {
    if (this.reachedEnd) return;

    const maxIndex = this.loop
      ? this.segmentLengths.length
      : this.waypoints.length - 1;

    if (this.currentIndex >= maxIndex) {
      this.reachedEnd = true;
      return;
    }

    let remaining = speed * (dt / 1000);

    while (remaining > 0 && !this.reachedEnd) {
      const segLen = this.segmentLengths[this.currentIndex];
      if (segLen === 0) {
        this.advanceSegment(maxIndex);
        continue;
      }

      const distLeftInSegment = (1 - this.segmentT) * segLen;

      if (remaining < distLeftInSegment) {
        this.segmentT += remaining / segLen;
        this.distanceTraveled += remaining;
        remaining = 0;
      } else {
        remaining -= distLeftInSegment;
        this.distanceTraveled += distLeftInSegment;
        this.advanceSegment(maxIndex);
      }
    }

    this.updateCachedVectors();
  }

  private updateCachedVectors(): void {
    const a = this.waypoints[this.currentIndex];
    const nextIndex = this.loop
      ? (this.currentIndex + 1) % this.waypoints.length
      : Math.min(this.currentIndex + 1, this.waypoints.length - 1);
    const b = this.waypoints[nextIndex];

    // Update cached position
    this.cachedPosition.x = a.x + (b.x - a.x) * this.segmentT;
    this.cachedPosition.y = a.y + (b.y - a.y) * this.segmentT;

    // Update cached direction
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) {
      this.cachedDirection.x = 1;
      this.cachedDirection.y = 0;
    } else {
      this.cachedDirection.x = dx / len;
      this.cachedDirection.y = dy / len;
    }
  }

  private advanceSegment(maxIndex: number): void {
    this.currentIndex++;
    this.segmentT = 0;

    if (this.loop) {
      if (this.currentIndex >= maxIndex) {
        this.currentIndex = 0;
        this.distanceTraveled = 0;
      }
    } else if (this.currentIndex >= maxIndex) {
      this.currentIndex = maxIndex - 1;
      this.segmentT = 1;
      this.reachedEnd = true;
    }
  }

  /**
   * Get the current interpolated position on the path.
   * Returns a cached reference — do not mutate the returned object.
   */
  getPosition(): { x: number; y: number } {
    return this.cachedPosition;
  }

  /**
   * Get the normalized direction vector of current movement.
   * Returns a cached reference — do not mutate the returned object.
   */
  getDirection(): { x: number; y: number } {
    return this.cachedDirection;
  }

  /**
   * Get progress along the path (0 = start, 1 = end)
   */
  getProgress(): number {
    if (this.totalDistance === 0) return 1;
    return Math.min(1, this.distanceTraveled / this.totalDistance);
  }

  /**
   * Whether the entity has reached the end of the path
   */
  hasReachedEnd(): boolean {
    return this.reachedEnd;
  }

  /**
   * Reset to the beginning of the path, optionally with new waypoints.
   */
  reset(newWaypoints?: Waypoint[]): void {
    if (newWaypoints && newWaypoints.length > 0) {
      this.waypoints = newWaypoints;
      this.preCalculate();
    }
    this.currentIndex = 0;
    this.segmentT = 0;
    this.distanceTraveled = 0;
    this.reachedEnd = false;
    this.updateCachedVectors();
  }
}
