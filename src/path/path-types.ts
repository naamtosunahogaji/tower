/**
 * Path Types
 *
 * Interfaces for waypoint-based path following.
 */

/**
 * A point on the path
 */
export interface Waypoint {
  x: number;
  y: number;
}

/**
 * Configuration for a path
 */
export interface PathConfig {
  /** Ordered waypoints defining the path */
  waypoints: Waypoint[];
  /** If true, loop back to the first waypoint after reaching the end */
  loop?: boolean;
}
