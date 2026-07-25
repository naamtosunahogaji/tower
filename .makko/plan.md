# Aetherguard: Chapter Defense — Game Plan

## Spec

### Concept
A **2.5D chapter-based tower defense** game for web players. The world is rendered with an isometric-style dimetric projection on a 2D canvas: terrain tiles are flattened vertically, towers and enemies are drawn with subtle height offsets and drop shadows to create a sense of depth. The player is the commander of the Aetherguard, defending arcane cores from waves of invading factions across a campaign of five chapters. Tone: tactical, slightly heroic, clean fantasy with readable silhouettes.

> Default title: **Aetherguard: Chapter Defense** (default — confirm or change). The original design doc referenced Three.js + a physics engine; this build targets MakkoEngine's 2D canvas and achieves the 2.5D look through projection, layering, and shadow rendering rather than true 3D.

> Default chapter count: **5 chapters** (default — confirm or change), each with 6–10 waves and a unique path layout.

### Core loop
1. **Prepare** — view the chapter map, the enemy path, and starting gold.
2. **Build** — place towers on valid grid cells; upgrade or sell existing towers.
3. **Defend** — waves spawn enemies that follow the path toward the base.
4. **React** — towers auto-target, fire projectiles, and apply slows/splash damage.
5. **Resolve** — enemies that reach the base reduce player lives; all enemies cleared starts the inter-wave build phase.
6. **Progress** — survive all waves to unlock the next chapter and return to the chapter select map.

### Player input
- **Mouse**: click empty grid cells to place the selected tower; click a placed tower to select it and open its upgrade/sell panel; click-and-drag to pan the map (optional); scroll to zoom (optional).
- **Keyboard hotkeys**:
  - `1`–`4` — select tower type from the palette.
  - `U` — upgrade selected tower (if affordable).
  - `S` — sell selected tower.
  - `Space` — start the next wave early.
  - `Escape` — pause / unpause.
- Device default: mouse + keyboard. Touch is out of scope for this build.

### Game systems
- **Grid**: 16 columns × 10 rows, 64 px cells, offset to center the board on a 1920×1080 canvas (default — confirm or change). Path cells are pre-marked and unbuildable.
- **Tower types (3 in the initial build, 4th slot stubbed):** (default — confirm or change)
  - **Arrow Turret**: fast fire rate, low damage, single target, cheap. Cost 50/75/100, range 140/170/200, damage 8/14/22, fire rate 400/320/250 ms.
  - **Cannon Tower**: slow fire rate, splash damage. Cost 120/180/240, range 180/220/260, damage 25/45/70, splash radius 60/75/90, fire rate 1200/1000/850 ms.
  - **Ice Spire**: moderate damage, slows enemies. Cost 100/150/200, range 150/190/230, damage 6/10/16, slow 35%/45%/55% for 1.5/2/2.5 s, fire rate 800/700/600 ms.
  - **Lightning Rod**: chain damage to nearby enemies. Cost 150/225/300, range 160/200/240, damage 15/25/40, chains to 2/3/4 targets within 80/100/120 px, fire rate 900/800/700 ms. *(Lightning is a post-MVP stretch if time allows; start with Arrow/Cannon/Ice and stub the slot.)*
- **Targeting**: each tower uses `TargetStrategy` — Arrow defaults `First`, Cannon defaults `First`, Ice defaults `Strongest`. Player can cycle strategy per tower.
- **Enemies (5):** (default roster — confirm or change)
  - **Grunt**: 40 HP, speed 60 px/s, reward 8 gold.
  - **Runner**: 25 HP, speed 110 px/s, reward 10 gold.
  - **Brute**: 120 HP, speed 35 px/s, reward 25 gold.
  - **Flier**: 35 HP, speed 75 px/s, ignores terrain (drawn at a higher altitude), reward 15 gold.
  - **Siege Boss**: 800 HP, speed 20 px/s, reward 200 gold, appears as a final wave boss.
- **Economy**: starting gold scales per chapter (250–600) (default — confirm or change). Wave completion reward and per-kill reward as defined in wave data.
- **Base health**: 20 lives (default — confirm or change). Each enemy reaching the end removes 1 life (boss removes 3). Health does not regenerate between chapters.
- **Waves**: 6–10 waves per chapter; defined in chapter data. Waves have spawn delays, mixed enemy types, and an inter-wave build timer (default 8 s, skippable with Space).

### Progression
- **5 chapters**, each with a unique path layout and escalating wave composition.
- Chapters unlock sequentially; completion of chapter N unlocks chapter N+1.
- A chapter is won when all waves are cleared and at least 1 life remains. Lost when lives reach 0.
- No persistent meta-upgrades in this build; replayability comes from perfecting earlier chapters and higher difficulties (stretch).

### State & flow
```
Title → Chapter Select → Play → (Victory | Defeat) → Chapter Select
                ↑
             Pause (overlay)
```
- **Title**: game name, Start Game, Settings (placeholder), Quit.
- **Chapter Select**: grid of chapter nodes; locked chapters are dimmed; hover/click to start.
- **Play**: build phase and wave phase alternate automatically.
- **Pause overlay**: Resume, Restart Chapter, Quit to Chapter Select.
- **Victory/Defeat**: summary modal with stars (3-star rating based on lives remaining — stretch), Continue, Retry.

### Presentation
- **2.5D rendering**: dimetric projection using a vertical squash factor of 0.5. Terrain tiles are drawn as flat diamonds; towers have a circular base + elevated turret barrel/crystal; enemies are simple shapes with a shadow ellipse offset below them. Projectiles arc slightly or travel with a height offset.
- **Color palette**: deep slate background (#101219), grassy tiles (#2d4a3e), path tiles (#4a3f35), tower accents by type (arrow #c49a6c, cannon #6b6b6b, ice #6ecbe0), enemy red (#c94c4c), UI panels with dark translucent backgrounds.
- **HUD**: top bar shows lives, gold, current wave / total waves; bottom bar shows tower palette with costs and hotkeys; right-side panel appears when a tower is selected.
- **Juice**: small screen shake on base hit, flash on enemy death, hover highlight on valid placement cells, range ring when placing or selecting a tower, coin-float text on kill (stretch).
- **Audio**: placeholder SFX hooks for tower fire, enemy hit, base damage, wave start; background music is out of scope unless assets are provided.

### Narrative
Light fantasy framing only: the Aetherguard protects realm cores from the Shrouded Host. One-line chapter descriptions on the chapter select screen. No in-level dialogue or cutscenes.

### Build needs
- Canvas: 1920×1080, DPI-aware scaling via MakkoEngine.
- Assets: programmatic placeholder art is fine for the build. If the user adds sprite assets via Makko Studio, the renderer classes in `src/tower/renderers/` and enemy renderer can swap to `MakkoEngine.sprite()`/`display.drawImage()` without changing gameplay code.
- Performance cap: up to ~60 active enemies and 100 projectiles on screen.

### Scope
- **In**: title screen, chapter select, one playable chapter built first, wave system, three tower types with upgrades, five enemy types, path following, grid placement, HUD, pause/victory/defeat overlays, save/load for unlock progress.
- **Out**: multiplayer, true 3D rendering, touch controls, monetization integration, meta-progression shop, difficulty settings, sound asset production.
- **Edge cases**: enemies reaching the end while base lives are 0 must trigger defeat immediately; selling a tower refunds gold and frees the cell; loading a corrupted save resets to chapter 1 unlocked.

---

## Build Plan

### Architecture sketch
- `src/main.ts` — boots MakkoEngine, captures keys, creates `Game`, and starts the loop.
- `src/game/game.ts` — owns `SceneManager`, registers scenes, drives update/render loop.
- `src/scene/scene-manager.ts`, `src/scene/base-scene.ts` — scene lifecycle from `new-project`.
- `src/scenes/start-scene.ts` — title screen with menu; navigates to `chapter-select`.
- `src/scenes/chapter-select-scene.ts` — chapter nodes, reads/writes unlock progress.
- `src/scenes/play-scene.ts` — main gameplay scene: grid, path, towers, enemies, waves, HUD, pause overlay.
- `src/tower/` — injected `tower-system`; customize `TowerDefinition` data, renderer colors, and possibly swap programmatic renderers for image-backed ones.
- `src/placement/` — injected `grid-placement`; mark path cells per chapter layout.
- `src/waves/` — injected `enemy-spawner`; define chapter waves.
- `src/path/` — injected `path-follower`; enemy positions advance along chapter waypoints.
- `src/enemy/` — enemy factory, enemy instance class, stat definitions, slow/splash effect handling.
- `src/chapters/` — `ChapterDefinition`, `CHAPTERS` array, path waypoint generation.
- `src/ui/` — injected `ui-layer`; HUD widgets, chapter cards, pause/victory modals.
- `src/state/` — injected `state-machine`; used for wave phase / build phase state inside `PlayScene`.
- `src/save/` — injected `save-load`; persist `unlockedChapters` and last selected chapter.

### Template plan
Inject the following templates:
- `new-project` — scaffold, scene manager, title scene, menu system.
- `ui-layer` — buttons, panels, modals, status bars, layout stacks for HUD and menus.
- `state-machine` — finite state machine for title/play/pause/victory/defeat and in-level wave/build substates.
- `save-load` — `SaveManager` and `HighScoreManager` for chapter unlock persistence.
- `grid-placement` — placement grid, occupancy, and coordinate conversion.
- `path-follower` — waypoint movement for enemies.
- `enemy-spawner` — wave definitions and `WaveManager`.
- `tower-system` — `TowerManager`, `Tower`, targeting, upgrades, projectiles, and renderer stubs.

### Task list

#### Task 1 — Inject `new-project`
- **What:** Establish the project scaffold, scene manager, title screen, and empty game scene.
- **Files:** `index.html`, `style.css`, `src/main.ts`, `src/game/game.ts`, `src/scene/*`, `src/scenes/start-scene.ts`, `src/scenes/game-scene.ts`, `src/menu/*`.
- **Verify:** Build compiles; title screen renders with "Aetherguard: Chapter Defense" and a Start Game option.

#### Task 2 — Inject `ui-layer`
- **What:** Add on-canvas UI toolkit for buttons, panels, and text widgets.
- **Files:** `src/ui/*`.
- **Verify:** Build compiles; a temporary button drawn in `start-scene.ts` renders and responds to hover.

#### Task 3 — Inject `state-machine`
- **What:** Add generic state machine for scene and gameplay state transitions.
- **Files:** `src/state/state-machine.ts`.
- **Verify:** Build compiles; a simple state machine test in `game.ts` or a scratch file transitions Title→Play without errors (remove scratch code before final).

#### Task 4 — Inject `save-load`
- **What:** Add persistence for chapter unlock progress.
- **Files:** `src/save/save-manager.ts`.
- **Verify:** Build compiles; `SaveManager` can save and load `{ version: 1, unlockedChapters: number[], lastChapter: number }`.

#### Task 5 — Inject `grid-placement`
- **What:** Add the placement grid system.
- **Files:** `src/placement/*`.
- **Verify:** Build compiles; `PlacementGrid` marks path cells and rejects placement on them.

#### Task 6 — Inject `path-follower`
- **What:** Add waypoint-based path movement.
- **Files:** `src/path/*`.
- **Verify:** Build compiles; a `PathFollower` moves from a start waypoint to an end waypoint and reports `hasReachedEnd()`.

#### Task 7 — Inject `enemy-spawner`
- **What:** Add wave manager and wave definitions.
- **Files:** `src/waves/*`.
- **Verify:** Build compiles; `WaveManager.update(dt)` emits `onEnemySpawn` callbacks for each enemy in a test wave.

#### Task 8 — Inject `tower-system`
- **What:** Add towers, targeting, upgrades, projectiles, and renderer stubs.
- **Files:** `src/tower/*`.
- **Verify:** Build compiles; a `TowerManager` placed on a grid can place an arrow tower, update it against dummy targets, and render it. (addresses risk: missing `Pool` dependency is satisfied because `tower-system` declares `Pool` as an expected dependency and the injector resolves it.)

#### Task 9 — Define tower data and 2.5D renderer styling
- **What:** Create `src/tower/tower-definitions.ts` with Arrow, Cannon, and Ice stats/costs; adjust renderer colors to match the Aetherguard palette; ensure `TowerRenderer` signatures accept a height offset for 2.5D look.
- **Files:** `src/tower/tower-definitions.ts`, `src/tower/renderers/arrow-renderer.ts`, `src/tower/renderers/cannon-renderer.ts`, `src/tower/renderers/ice-renderer.ts`.
- **Verify:** Build compiles; all three tower types render with distinct colors and an elevated turret; range rings display.

#### Task 10 — Build enemy types and path-following behavior
- **What:** Add `src/enemy/enemy-types.ts` for stat definitions; `src/enemy/enemy.ts` as the runtime enemy class using `PathFollower`; `src/enemy/enemy-manager.ts` to spawn, update, slow, and remove enemies.
- **Files:** `src/enemy/enemy-types.ts`, `src/enemy/enemy.ts`, `src/enemy/enemy-manager.ts`.
- **Verify:** Enemies spawn, follow a hardcoded path, and reach the end; slow effects reduce speed and expire correctly. (addresses risk: slow status must expire and not permanently cripple enemies.)

#### Task 11 — Create chapter definitions and path layouts
- **What:** Add `src/chapters/chapter-types.ts` and `src/chapters/chapters.ts` with 5 chapter records, each defining grid size, path cells, waypoints, starting gold, base health, and wave list.
- **Files:** `src/chapters/chapter-types.ts`, `src/chapters/chapters.ts`.
- **Verify:** At least chapter 1 returns valid waypoints; grid path cells match the waypoints; wave data loads into `WaveManager`.

#### Task 12 — Build the Play scene core loop
- **What:** Implement `src/scenes/play-scene.ts`: create grid, path, `TowerManager`, `EnemyManager`, `WaveManager`; wire `WaveManager.onEnemySpawn` to enemy creation; handle projectiles hitting enemies via `TowerManager.onProjectileHit`; track lives/gold; switch between build and wave states.
- **Files:** `src/scenes/play-scene.ts`.
- **Verify:** A full chapter can be played: towers can be placed, enemies spawn in waves, projectiles deal damage, kills grant gold, reaching the end reduces lives. (addresses risk: projectile hit callback must apply splash and slow consistently across enemy instances.)

#### Task 13 — Implement mouse input and tower placement UX
- **What:** Map mouse coordinates to grid cells; highlight valid/invalid placement; show range ring and cost; handle palette selection, tower selection, upgrade, and sell.
- **Files:** `src/scenes/play-scene.ts`, `src/placement/placement-renderer.ts`.
- **Verify:** Clicking a valid empty cell places the selected tower and deducts gold; clicking a tower opens its panel; U/S hotkeys work; invalid cells flash red.

#### Task 14 — Build HUD and in-game UI
- **What:** Use `ui-layer` to render top bar (lives, gold, wave), bottom tower palette with costs, and right-side tower info panel; add pause modal with Resume/Restart/Quit.
- **Files:** `src/ui/hud.ts` or inline in `play-scene.ts`.
- **Verify:** HUD updates with lives/gold/wave; pause modal blocks placement and pauses the wave timer; buttons route correctly.

#### Task 15 — Build chapter select scene
- **What:** Implement `src/scenes/chapter-select-scene.ts`: read save data, draw chapter nodes, unlock next chapter on completion, start Play scene with selected chapter.
- **Files:** `src/scenes/chapter-select-scene.ts`.
- **Verify:** Only chapter 1 is unlocked on fresh save; after a chapter is won, the next unlocks; save persists across reloads.

#### Task 16 — Wire game state machine and transitions
- **What:** Use `StateMachine` in `Game`/`PlayScene` to handle Title → ChapterSelect → Play → Victory/Defeat → ChapterSelect. Add victory/defeat overlays.
- **Files:** `src/game/game.ts`, `src/scenes/play-scene.ts`, `src/scenes/victory-overlay.ts`, `src/scenes/defeat-overlay.ts`.
- **Verify:** Completing all waves shows Victory overlay; hitting 0 lives shows Defeat overlay; both allow Retry or Continue.

#### Task 17 — Add 2.5D visual polish
- **What:** Apply dimetric projection squash to terrain/path drawing; draw towers and enemies with drop shadows and height offsets; add subtle projectile arcs; add hit/death flashes.
- **Files:** `src/scenes/play-scene.ts`, `src/tower/renderers/*`, `src/enemy/enemy.ts`.
- **Verify:** Game visually reads as 2.5D; depth cues (shadows, squashed tiles) are consistent; performance stays above 55 FPS with 50 enemies.

#### Task 18 — Final integration and QA pass
- **What:** Ensure all imports resolve, remove test/scratch code, verify all chapters have valid data, test save/load migration, confirm no direct `ctx` drawing.
- **Files:** All.
- **Verify:** Game builds without errors or warnings; full playthrough of chapter 1 succeeds; corrupt save resets to chapter 1.

### Verification milestones
- **After Task 8:** the tower system renders and fires projectiles against test targets.
- **After Task 12:** a complete but unpolished chapter is playable end-to-end.
- **After Task 16:** full state flow (title → chapter select → play → victory/defeat) works.
- **After Task 18:** all five chapters are defined, save/load is stable, and the game builds cleanly.

### Engine primitives used
- `MakkoEngine.initEngine`, `MakkoEngine.display` — canvas setup, frame begin/clear/end, all 2D drawing.
- `MakkoEngine.input` — keyboard hotkeys, mouse position/buttons, `input.endFrame()`.
- `MakkoEngine.display.drawRect`, `drawCircle`, `drawLine`, `drawText`, `drawPolygon` — terrain, towers, enemies, HUD.
- Optional: `MakkoEngine.sprite()` / `display.drawImage()` only if the user later supplies assets.

### Known risks & gotchas
- **`tower-system` expects `Pool`:** The template declares `Pool` as an expected dependency; the injector should resolve it automatically, but verify `src/pool/pool.ts` exists after injection before compiling. (Task 8 verify step addresses this.)
- **Slow effects stacking:** Multiple Ice towers could stack slows to zero speed. Clamp minimum speed to 20% and refresh duration instead of multiplying factors. (Task 10 verify addresses this.)
- **Projectile hit synchronization:** `TowerManager.onProjectileHit` fires at the target position; splash and slow must be applied in `EnemyManager` by distance check, not by per-enemy callbacks. (Task 12 verify addresses this.)
- **Path vs grid mismatch:** Waypoints must align to path cell centers; generate waypoints from chapter path cells programmatically to avoid drift. (Task 11 verify addresses this.)
- **2.5D depth sorting:** Enemies and towers must be drawn back-to-front by their projected Y coordinate so sprites overlap correctly. (Task 17 verify addresses this.)
- **Direct `ctx` usage:** All drawing must go through `MakkoEngine.display`. Any template renderer that uses raw context must be refactored. (Task 18 verify addresses this.)
