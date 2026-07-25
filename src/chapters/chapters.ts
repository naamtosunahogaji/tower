/**
 * Chapter Definitions
 *
 * Five chapters, each with a unique path layout and escalating waves.
 * All chapters use a 16-col × 10-row × 64-px grid, centered on a
 * 1920 × 1080 canvas.
 *
 *  Grid placement on 1920x1080:
 *   grid pixel size = 16 * 64 × 10 * 64 = 1024 × 640
 *   offsetX = (1920 - 1024) / 2 = 448
 *   offsetY = (1080 - 640) / 2 - HUD allowance = 200
 */

import { ChapterDefinition, ChapterGridConfig, pathCellsToWaypoints } from './chapter-types';
import { WaveDefinition } from '../waves/wave-manager';

const GRID: ChapterGridConfig = {
  cols: 16,
  rows: 10,
  cellSize: 64,
  offsetX: 448,
  offsetY: 200,
};

// ---------------------------------------------------------------------------
// Wave helpers
// ---------------------------------------------------------------------------

/** Compose a wave with sensible defaults. */
function wave(
  id: number,
  enemies: Array<{ type: string; count: number; delay: number }>,
  reward: number,
  isBoss: boolean = false,
  delayAfter: number = 6000
): WaveDefinition {
  return {
    id,
    enemies: enemies.map((e) => ({ type: e.type, count: e.count, delay: e.delay })),
    delayAfter,
    reward,
    isBossWave: isBoss,
  };
}

// ---------------------------------------------------------------------------
// Chapter 1 — tutorial layout, "Greenmere Approach"
// Path: left side → bottom-right corner
// ---------------------------------------------------------------------------

const chapter1: ChapterDefinition = {
  id: 1,
  name: 'Chapter 1: Greenmere Approach',
  description: 'The Shrouded Host spills from the western wood. Hold the line.',
  grid: GRID,
  path: {
    cells: [
      { col: -1, row: 1 }, // off-screen spawn (left)
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 3, row: 1 },
      { col: 3, row: 2 },
      { col: 3, row: 3 },
      { col: 3, row: 4 },
      { col: 4, row: 4 },
      { col: 5, row: 4 },
      { col: 6, row: 4 },
      { col: 7, row: 4 },
      { col: 7, row: 5 },
      { col: 7, row: 6 },
      { col: 8, row: 6 },
      { col: 9, row: 6 },
      { col: 10, row: 6 },
      { col: 11, row: 6 },
      { col: 12, row: 6 },
      { col: 12, row: 7 },
      { col: 12, row: 8 },
      { col: 13, row: 8 },
      { col: 14, row: 8 },
      { col: 15, row: 8 },
      { col: 16, row: 8 }, // off-screen end (right)
    ],
  },
  startingGold: 250,
  startingLives: 20,
  waves: [
    wave(1, [{ type: 'grunt', count: 6, delay: 700 }], 30),
    wave(2, [{ type: 'grunt', count: 8, delay: 600 }], 40),
    wave(3, [{ type: 'grunt', count: 6, delay: 600 }, { type: 'runner', count: 3, delay: 500 }], 55),
    wave(4, [{ type: 'runner', count: 8, delay: 450 }], 60),
    wave(5, [{ type: 'grunt', count: 10, delay: 400 }, { type: 'runner', count: 4, delay: 500 }], 75),
    wave(6, [{ type: 'brute', count: 2, delay: 1200 }, { type: 'grunt', count: 6, delay: 500 }], 100),
    wave(7, [{ type: 'flier', count: 6, delay: 700 }, { type: 'grunt', count: 8, delay: 500 }], 120),
    wave(8, [{ type: 'brute', count: 3, delay: 1000 }, { type: 'runner', count: 8, delay: 400 }], 150),
    wave(9, [{ type: 'siege_boss', count: 1, delay: 0 }, { type: 'grunt', count: 10, delay: 400 }], 300, true),
  ],
};

// ---------------------------------------------------------------------------
// Chapter 2 — "The Hollow Pass"
// Path: top → middle → bottom
// ---------------------------------------------------------------------------

const chapter2: ChapterDefinition = {
  id: 2,
  name: 'Chapter 2: The Hollow Pass',
  description: 'Through a narrow defile, the vanguard pushes deeper into Aetherguard territory.',
  grid: GRID,
  path: {
    cells: [
      { col: 0, row: 0 }, // off-screen top
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 2, row: 1 },
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
      { col: 5, row: 2 },
      { col: 5, row: 3 },
      { col: 5, row: 4 },
      { col: 6, row: 4 },
      { col: 7, row: 4 },
      { col: 8, row: 4 },
      { col: 8, row: 5 },
      { col: 8, row: 6 },
      { col: 9, row: 6 },
      { col: 10, row: 6 },
      { col: 11, row: 6 },
      { col: 11, row: 7 },
      { col: 11, row: 8 },
      { col: 12, row: 8 },
      { col: 13, row: 8 },
      { col: 14, row: 8 },
      { col: 15, row: 8 },
      { col: 16, row: 8 }, // off-screen right
    ],
  },
  startingGold: 300,
  startingLives: 20,
  waves: [
    wave(1, [{ type: 'grunt', count: 8, delay: 500 }], 35),
    wave(2, [{ type: 'runner', count: 8, delay: 400 }], 45),
    wave(3, [{ type: 'grunt', count: 10, delay: 400 }, { type: 'runner', count: 4, delay: 500 }], 60),
    wave(4, [{ type: 'flier', count: 6, delay: 600 }, { type: 'grunt', count: 6, delay: 500 }], 70),
    wave(5, [{ type: 'brute', count: 3, delay: 900 }, { type: 'runner', count: 6, delay: 400 }], 100),
    wave(6, [{ type: 'flier', count: 10, delay: 450 }, { type: 'grunt', count: 6, delay: 500 }], 120),
    wave(7, [{ type: 'brute', count: 4, delay: 800 }, { type: 'runner', count: 10, delay: 350 }], 150),
    wave(8, [{ type: 'flier', count: 12, delay: 350 }, { type: 'brute', count: 2, delay: 1000 }], 180),
    wave(9, [{ type: 'siege_boss', count: 1, delay: 0 }, { type: 'brute', count: 2, delay: 800 }, { type: 'flier', count: 8, delay: 500 }], 350, true),
  ],
};

// ---------------------------------------------------------------------------
// Chapter 3 — "The Sunken Causeway"
// Path: left → right with a long central span
// ---------------------------------------------------------------------------

const chapter3: ChapterDefinition = {
  id: 3,
  name: 'Chapter 3: The Sunken Causeway',
  description: 'A long straight stretch. Towers have room to breathe.',
  grid: GRID,
  path: {
    cells: [
      { col: -1, row: 5 }, // off-screen left
      { col: 0, row: 5 },
      { col: 1, row: 5 },
      { col: 2, row: 5 },
      { col: 3, row: 5 },
      { col: 4, row: 5 },
      { col: 5, row: 5 },
      { col: 6, row: 5 },
      { col: 7, row: 5 },
      { col: 8, row: 5 },
      { col: 9, row: 5 },
      { col: 10, row: 5 },
      { col: 11, row: 5 },
      { col: 12, row: 5 },
      { col: 13, row: 5 },
      { col: 14, row: 5 },
      { col: 15, row: 5 },
      { col: 16, row: 5 }, // off-screen right
    ],
  },
  startingGold: 350,
  startingLives: 20,
  waves: [
    wave(1, [{ type: 'grunt', count: 10, delay: 400 }], 40),
    wave(2, [{ type: 'runner', count: 12, delay: 300 }], 55),
    wave(3, [{ type: 'grunt', count: 10, delay: 350 }, { type: 'flier', count: 4, delay: 600 }], 70),
    wave(4, [{ type: 'brute', count: 3, delay: 800 }, { type: 'runner', count: 8, delay: 350 }], 100),
    wave(5, [{ type: 'flier', count: 12, delay: 350 }, { type: 'runner', count: 8, delay: 300 }], 130),
    wave(6, [{ type: 'brute', count: 5, delay: 700 }, { type: 'grunt', count: 10, delay: 350 }], 150),
    wave(7, [{ type: 'flier', count: 16, delay: 300 }, { type: 'runner', count: 10, delay: 300 }], 180),
    wave(8, [{ type: 'brute', count: 6, delay: 600 }, { type: 'flier', count: 8, delay: 400 }, { type: 'runner', count: 6, delay: 350 }], 220),
    wave(9, [{ type: 'siege_boss', count: 1, delay: 0 }, { type: 'brute', count: 4, delay: 700 }, { type: 'flier', count: 12, delay: 350 }], 400, true),
  ],
};

// ---------------------------------------------------------------------------
// Chapter 4 — "The Writhing Glade"
// Path: serpentine left → right
// ---------------------------------------------------------------------------

const chapter4: ChapterDefinition = {
  id: 4,
  name: 'Chapter 4: The Writhing Glade',
  description: 'The path winds through haunted woods. Fliers bypass your towers.',
  grid: GRID,
  path: {
    cells: [
      { col: -1, row: 1 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 1, row: 2 },
      { col: 1, row: 3 },
      { col: 2, row: 3 },
      { col: 3, row: 3 },
      { col: 4, row: 3 },
      { col: 4, row: 4 },
      { col: 4, row: 5 },
      { col: 5, row: 5 },
      { col: 6, row: 5 },
      { col: 7, row: 5 },
      { col: 7, row: 6 },
      { col: 7, row: 7 },
      { col: 8, row: 7 },
      { col: 9, row: 7 },
      { col: 10, row: 7 },
      { col: 10, row: 6 },
      { col: 10, row: 5 },
      { col: 11, row: 5 },
      { col: 12, row: 5 },
      { col: 12, row: 4 },
      { col: 12, row: 3 },
      { col: 13, row: 3 },
      { col: 14, row: 3 },
      { col: 15, row: 3 },
      { col: 16, row: 3 },
    ],
  },
  startingGold: 400,
  startingLives: 20,
  waves: [
    wave(1, [{ type: 'runner', count: 10, delay: 350 }], 50),
    wave(2, [{ type: 'grunt', count: 12, delay: 350 }, { type: 'flier', count: 4, delay: 500 }], 70),
    wave(3, [{ type: 'runner', count: 14, delay: 280 }], 80),
    wave(4, [{ type: 'brute', count: 3, delay: 800 }, { type: 'flier', count: 8, delay: 400 }], 110),
    wave(5, [{ type: 'runner', count: 12, delay: 280 }, { type: 'brute', count: 2, delay: 900 }], 130),
    wave(6, [{ type: 'flier', count: 16, delay: 300 }, { type: 'grunt', count: 8, delay: 350 }], 160),
    wave(7, [{ type: 'brute', count: 5, delay: 600 }, { type: 'runner', count: 12, delay: 250 }], 200),
    wave(8, [{ type: 'flier', count: 20, delay: 250 }, { type: 'brute', count: 4, delay: 700 }], 240),
    wave(9, [{ type: 'siege_boss', count: 1, delay: 0 }, { type: 'brute', count: 6, delay: 600 }, { type: 'flier', count: 12, delay: 300 }], 500, true),
  ],
};

// ---------------------------------------------------------------------------
// Chapter 5 — "The Heart of Aetherguard"
// Path: full perimeter loop with cross
// ---------------------------------------------------------------------------

const chapter5: ChapterDefinition = {
  id: 5,
  name: 'Chapter 5: The Heart of Aetherguard',
  description: 'The final stand. The Shrouded Host throws everything at the core.',
  grid: GRID,
  path: {
    cells: [
      { col: -1, row: 0 }, // off-screen top-left
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
      { col: 5, row: 0 },
      { col: 6, row: 0 },
      { col: 7, row: 0 },
      { col: 7, row: 1 },
      { col: 7, row: 2 },
      { col: 7, row: 3 },
      { col: 8, row: 3 },
      { col: 9, row: 3 },
      { col: 9, row: 4 },
      { col: 9, row: 5 },
      { col: 9, row: 6 },
      { col: 8, row: 6 },
      { col: 7, row: 6 },
      { col: 7, row: 7 },
      { col: 7, row: 8 },
      { col: 8, row: 8 },
      { col: 9, row: 8 },
      { col: 10, row: 8 },
      { col: 11, row: 8 },
      { col: 12, row: 8 },
      { col: 13, row: 8 },
      { col: 14, row: 8 },
      { col: 15, row: 8 },
      { col: 16, row: 8 }, // off-screen right
    ],
  },
  startingGold: 600,
  startingLives: 20,
  waves: [
    wave(1, [{ type: 'runner', count: 12, delay: 300 }], 60),
    wave(2, [{ type: 'grunt', count: 14, delay: 300 }, { type: 'flier', count: 6, delay: 450 }], 80),
    wave(3, [{ type: 'brute', count: 4, delay: 700 }, { type: 'runner', count: 10, delay: 300 }], 120),
    wave(4, [{ type: 'flier', count: 16, delay: 280 }, { type: 'grunt', count: 10, delay: 320 }], 150),
    wave(5, [{ type: 'brute', count: 5, delay: 600 }, { type: 'runner', count: 14, delay: 250 }], 180),
    wave(6, [{ type: 'flier', count: 20, delay: 250 }, { type: 'brute', count: 4, delay: 700 }], 220),
    wave(7, [{ type: 'siege_boss', count: 1, delay: 0 }, { type: 'brute', count: 4, delay: 600 }, { type: 'flier', count: 12, delay: 300 }], 500, true),
  ],
};

// ---------------------------------------------------------------------------
// Public chapter list
// ---------------------------------------------------------------------------

export const CHAPTERS: ChapterDefinition[] = [chapter1, chapter2, chapter3, chapter4, chapter5];

/** Get the waypoints (screen pixels) for a chapter. */
export function getChapterWaypoints(chapter: ChapterDefinition): Array<{ x: number; y: number }> {
  return pathCellsToWaypoints(chapter.path.cells, chapter.grid);
}
