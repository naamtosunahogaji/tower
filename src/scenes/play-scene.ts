/**
 * Play Scene
 *
 * Main gameplay scene for Aetherguard: Chapter Defense.
 * Owns the grid, path, TowerManager, EnemyManager, WaveManager, HUD,
 * tower palette, tower info panel, and the pause / victory / defeat
 * overlays. Drives a small internal state machine for build / wave /
 * paused / victory / defeat.
 */

import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../scene/base-scene';
import type { Game } from '../game/game';
import { PlacementGrid } from '../placement/placement-grid';
import { CellState } from '../placement/placement-types';
import { PlacementRenderer } from '../placement/placement-renderer';
import { EnemyManager } from '../enemy/enemy-manager';
import { TowerManager } from '../tower/tower-manager';
import { Tower } from '../tower/tower';
import {
  TOWER_DEFINITIONS,
  TOWER_HOTKEYS,
  ARROW_TOWER,
  CANNON_TOWER,
  ICE_TOWER,
} from '../tower/tower-definitions';
import type { TowerDefinition } from '../tower/tower-types';
import { WaveManager } from '../waves/wave-manager';
import { CHAPTERS, getChapterWaypoints } from '../chapters/chapters';
import { ChapterDefinition } from '../chapters/chapter-types';
import { Button } from '../ui/ui-elements';
import { loadSave, saveSave } from '../save/aetherguard-save';

/** Internal play-state machine values. */
type PlayPhase = 'build' | 'wave' | 'paused' | 'victory' | 'defeat';

export class PlayScene extends BaseScene {
  readonly id = 'play';

  private game: Game;
  private chapter!: ChapterDefinition;
  private grid!: PlacementGrid;
  private enemyManager!: EnemyManager;
  private towerManager!: TowerManager;
  private waveManager!: WaveManager;
  private placementRenderer = new PlacementRenderer();

  private phase: PlayPhase = 'build';
  private interWaveTimer: number = 0;
  private gold: number = 0;
  private lives: number = 20;
  private totalEnemiesKilled: number = 0;

  /** User-selected tower type from the palette. Null = no selection. */
  private selectedTowerType: TowerDefinition | null = null;
  /** Currently selected placed tower (right panel + range ring). */
  private selectedPlacedTower: Tower | null = null;

  private hoveredCell: { col: number; row: number } | null = null;
  private mouseGameX: number = 0;
  private mouseGameY: number = 0;

  // Juice state
  private screenShake: number = 0;
  private damageFlash: number = 0;

  // UI widgets
  private pauseButton!: Button;
  private resumeButton!: Button;
  private restartButton!: Button;
  private quitButton!: Button;
  private continueButton!: Button;
  private retryButton!: Button;
  private speedNextWaveButton!: Button;

  constructor(game: Game) {
    super();
    this.game = game;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  init(): void {
    this.pauseButton = new Button(1820, 24, 80, 36, 'Pause', { variant: 'ghost' });
    this.resumeButton = new Button(0, 0, 200, 50, 'Resume', { variant: 'primary' });
    this.restartButton = new Button(0, 0, 200, 50, 'Restart Chapter', { variant: 'ghost' });
    this.quitButton = new Button(0, 0, 220, 50, 'Quit to Chapter Select', { variant: 'danger' });
    this.continueButton = new Button(0, 0, 220, 50, 'Continue', { variant: 'primary' });
    this.retryButton = new Button(0, 0, 220, 50, 'Retry Chapter', { variant: 'primary' });
    this.speedNextWaveButton = new Button(0, 0, 220, 50, 'Start Wave (Space)', { variant: 'primary' });
  }

  enter(previousScene?: string): void {
    const chapterId = this.game.getSelectedChapterId();
    const found = CHAPTERS.find((c) => c.id === chapterId);
    this.chapter = found ?? CHAPTERS[0];

    // Build grid
    this.grid = new PlacementGrid(this.chapter.grid);
    for (const cell of this.chapter.path.cells) {
      if (this.grid.isInBounds(cell.col, cell.row)) {
        this.grid.setCellState(cell.col, cell.row, CellState.Path);
      }
    }

    // Build managers
    const waypoints = getChapterWaypoints(this.chapter);
    this.enemyManager = new EnemyManager(waypoints);
    this.towerManager = new TowerManager(this.grid, 100);
    this.waveManager = new WaveManager(this.chapter.waves, 3000);

    // Wire up callbacks
    this.waveManager.onEnemySpawn = (type) => {
      this.enemyManager.spawn(type);
    };
    this.waveManager.onWaveComplete = (wave) => {
      this.gold += wave.reward ?? 0;
    };
    this.waveManager.onAllWavesComplete = () => {
      if (this.lives > 0) this.setPhase('victory');
    };

    this.towerManager.onProjectileHit = (x, y, damage, splashRadius, slowDuration, slowFactor) => {
      this.enemyManager.applyProjectileHit({ x, y, damage, splashRadius, slowDuration, slowFactor });
    };

    this.enemyManager.onEnemyKilled = (enemy) => {
      this.gold += enemy.reward;
      this.totalEnemiesKilled++;
      this.waveManager.enemyDefeated();
    };

    this.enemyManager.onEnemyReachedEnd = (enemy) => {
      this.lives -= enemy.livesLost;
      this.screenShake = 6;
      this.damageFlash = 0.4;
      this.waveManager.enemyDefeated();
      if (this.lives <= 0) {
        this.lives = 0;
        this.setPhase('defeat');
      }
    };

    // State
    this.phase = 'build';
    this.interWaveTimer = 0;
    this.gold = this.chapter.startingGold;
    this.lives = this.chapter.startingLives;
    this.totalEnemiesKilled = 0;
    this.selectedTowerType = null;
    this.selectedPlacedTower = null;
  }

  exit(nextScene?: string): void {
    // No-op: state is rebuilt on next enter()
  }

  // ============================================================================
  // Input
  // ============================================================================

  handleInput(): void {
    if (this.phase === 'paused') {
      this.handlePausedInput();
      return;
    }
    if (this.phase === 'victory' || this.phase === 'defeat') {
      this.handleEndGameInput();
      return;
    }

    const input = MakkoEngine.input;
    this.updateMouseCoords();

    // Pause button
    if (this.pauseButton.isClicked()) {
      this.setPhase('paused');
      return;
    }

    // Tower palette hotkeys
    if (input.isKeyPressed('Digit1')) this.setSelectedTowerType(ARROW_TOWER);
    else if (input.isKeyPressed('Digit2')) this.setSelectedTowerType(CANNON_TOWER);
    else if (input.isKeyPressed('Digit3')) this.setSelectedTowerType(ICE_TOWER);
    else if (input.isKeyPressed('Digit4')) {
      // Lightning is stubbed in MVP
      this.setSelectedTowerType(null);
    }

    // Escape: pause
    if (input.isKeyPressed('Escape')) {
      this.setPhase('paused');
      return;
    }

    // Space: start wave early (only in build phase)
    if (input.isKeyPressed('Space') && this.phase === 'build') {
      this.startNextWave();
    }

    // U: upgrade selected tower
    if (input.isKeyPressed('KeyU') && this.selectedPlacedTower) {
      this.upgradeSelectedTower();
    }

    // S: sell selected tower
    if (input.isKeyPressed('KeyS') && this.selectedPlacedTower) {
      this.sellSelectedTower();
    }

    // Mouse click on grid
    if (input.isMousePressed() && this.hoveredCell) {
      const { col, row } = this.hoveredCell;
      const existing = this.towerManager.getTowerAt(col, row);
      if (existing) {
        this.selectedPlacedTower = existing;
        this.selectedTowerType = null;
      } else if (this.selectedTowerType) {
        this.tryPlaceTower(col, row);
      } else {
        this.selectedPlacedTower = null;
      }
    }

    // Click on SpeedNextWave button (build phase)
    if (this.phase === 'build' && this.speedNextWaveButton.isClicked()) {
      this.startNextWave();
    }
  }

  private handlePausedInput(): void {
    const input = MakkoEngine.input;
    if (this.resumeButton.isClicked()) {
      this.setPhase(this.waveManager.getState() === 'waiting' || this.waveManager.getState() === 'completed' ? 'build' : 'wave');
    } else if (this.restartButton.isClicked()) {
      this.switchTo('play'); // re-enter rebuilds the chapter
    } else if (this.quitButton.isClicked()) {
      this.switchTo('chapter-select');
    }
    if (input.isKeyPressed('Escape')) {
      this.setPhase(this.waveManager.getState() === 'waiting' || this.waveManager.getState() === 'completed' ? 'build' : 'wave');
    }
  }

  private handleEndGameInput(): void {
    const input = MakkoEngine.input;
    if (this.continueButton.isClicked() || input.isKeyPressed('Enter') || input.isKeyPressed('Escape')) {
      if (this.phase === 'victory') {
        this.unlockNextChapter();
        this.switchTo('chapter-select');
      } else {
        this.switchTo('chapter-select');
      }
    } else if (this.retryButton.isClicked() || input.isKeyPressed('KeyR')) {
      this.switchTo('play');
    }
  }

  // ============================================================================
  // Update
  // ============================================================================

  update(dt: number): void {
    if (this.phase === 'paused' || this.phase === 'victory' || this.phase === 'defeat') {
      return;
    }

    // Decay juice
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 0.05);
    if (this.damageFlash > 0) this.damageFlash = Math.max(0, this.damageFlash - dt * 0.002);

    // Wave manager
    this.waveManager.update(dt);

    if (this.waveManager.getState() === 'completed' && this.phase === 'wave') {
      this.phase = 'build';
      this.interWaveTimer = this.waveManager.getTimeUntilNextWave() || 0;
    }

    if (this.phase === 'build' && this.waveManager.getState() === 'waiting' && this.waveManager.getTimeUntilNextWave() > 0) {
      this.interWaveTimer = this.waveManager.getTimeUntilNextWave();
    }

    // Enemy / tower updates
    this.enemyManager.update(dt);
    this.towerManager.update(dt, this.enemyManager.getTargets());
  }

  // ============================================================================
  // Render
  // ============================================================================

  render(): void {
    const display = MakkoEngine.display;
    const w = display.width;
    const h = display.height;

    // Apply screen shake
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      display.setGlobalOffset(sx, sy);
    }

    // Background
    display.drawRect(0, 0, w, h, { fill: '#0d111c' });

    // 2.5D terrain
    this.renderTerrain();

    // Towers and enemies — sort by Y for back-to-front
    this.renderTowersAndEnemies();

    // Projectiles
    this.towerManager.render();

    // Range rings
    this.renderRangeRings();

    // Placement hover highlight
    this.placementRenderer.render(this.grid, this.hoveredCell, this.isValidPlacement(this.hoveredCell), true);

    // Reset offset before drawing HUD (UI must not shake)
    display.setGlobalOffset(0, 0);

    // Damage flash overlay
    if (this.damageFlash > 0) {
      display.drawRect(0, 0, w, h, { fill: '#ff4444', alpha: this.damageFlash });
    }

    // HUD
    this.renderHUD();

    // Tower info panel
    this.renderTowerInfoPanel();

    // Overlays
    if (this.phase === 'paused') {
      this.renderPauseModal();
    } else if (this.phase === 'victory') {
      this.renderVictoryOverlay();
    } else if (this.phase === 'defeat') {
      this.renderDefeatOverlay();
    }
  }

  private renderTerrain(): void {
    const display = MakkoEngine.display;
    const cfg = this.grid.getConfig();

    // Spawn / base markers — drawn first so terrain and path sit on top
    this.renderSpawnAndBaseMarkers();

    for (let row = 0; row < cfg.rows; row++) {
      for (let col = 0; col < cfg.cols; col++) {
        const tl = this.grid.getCellTopLeft(col, row);
        const cell = this.grid.getCell(col, row);
        if (!cell) continue;

        if (cell.state === CellState.Path) {
          // Path tile — drawn as a slightly squashed band for 2.5D
          display.drawRect(tl.x, tl.y + 8, cfg.cellSize, cfg.cellSize - 16, { fill: '#4a3f35' });
          display.drawRect(tl.x, tl.y + 8, cfg.cellSize, cfg.cellSize - 16, {
            stroke: '#5a4f45',
            lineWidth: 1,
          });
        } else {
          // Grassy tile — dimetric diamond
          const center = this.grid.getCellCenter(col, row);
          const halfW = cfg.cellSize / 2;
          const halfH = cfg.cellSize / 4; // vertical squash for 2.5D

          const top = { x: center.x, y: center.y - halfH };
          const right = { x: center.x + halfW, y: center.y };
          const bottom = { x: center.x, y: center.y + halfH };
          const left = { x: center.x - halfW, y: center.y };

          display.drawPolygon([top, right, bottom, left], { fill: '#2d4a3e' });
          const variant = (col * 7 + row * 11) % 5;
          const tint = ['#2d4a3e', '#335042', '#284036', '#2f4d40', '#26423a'][variant];
          display.drawPolygon([top, right, bottom, left], {
            fill: tint,
            alpha: 0.4,
          });
        }
      }
    }
  }

  /**
   * Draw a pulsing spawn portal at the start of the path and a glowing
   * core at the end. Off-screen cells (col < 0 or >= cols, or row < 0 or
   * >= rows) project naturally onto the edge for visual clarity.
   */
  private renderSpawnAndBaseMarkers(): void {
    const display = MakkoEngine.display;
    const waypoints = getChapterWaypoints(this.chapter);
    if (waypoints.length < 2) return;

    const spawn = waypoints[0];
    const base = waypoints[waypoints.length - 1];
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.003);

    // Spawn portal — swirling red vortex
    display.drawCircle(spawn.x, spawn.y, 24, {
      fill: '#1a0a0a',
      stroke: '#c94c4c',
      lineWidth: 2,
      alpha: 0.9,
    });
    display.drawCircle(spawn.x, spawn.y, 18 + pulse * 4, {
      stroke: '#c94c4c',
      lineWidth: 2,
      alpha: 0.5 + pulse * 0.3,
    });
    display.drawCircle(spawn.x, spawn.y, 12, {
      fill: '#c94c4c',
      alpha: 0.3 + pulse * 0.2,
    });
    display.drawText('SPAWN', spawn.x, spawn.y + 36, {
      font: 'bold 10px monospace',
      fill: '#e08080',
      align: 'center',
    });

    // Defended core — glowing blue crystal
    display.drawPolygon(
      [
        { x: base.x, y: base.y - 18 },
        { x: base.x + 16, y: base.y - 4 },
        { x: base.x + 12, y: base.y + 14 },
        { x: base.x - 12, y: base.y + 14 },
        { x: base.x - 16, y: base.y - 4 },
      ],
      { fill: '#1a2a4a', stroke: '#6ecbe0', lineWidth: 2 }
    );
    display.drawCircle(base.x, base.y, 8 + pulse * 3, {
      fill: '#a8e5f0',
      alpha: 0.4 + pulse * 0.3,
      shadow: { color: '#6ecbe0', blur: 10 },
    });
    display.drawText('CORE', base.x, base.y + 30, {
      font: 'bold 10px monospace',
      fill: '#a8e5f0',
      align: 'center',
    });
  }

  private renderTowersAndEnemies(): void {
    interface DrawItem {
      y: number;
      draw: () => void;
    }
    const items: DrawItem[] = [];

    for (const tower of this.towerManager.getTowers()) {
      items.push({ y: tower.y, draw: () => tower.render() });
    }
    for (const enemy of this.enemyManager.getEnemies()) {
      items.push({ y: enemy.getDrawY(), draw: () => enemy.render() });
    }
    items.sort((a, b) => a.y - b.y);
    for (const item of items) item.draw();
  }

  private renderRangeRings(): void {
    if (this.selectedPlacedTower) {
      this.selectedPlacedTower.setShowRange(true);
      this.selectedPlacedTower.render();
    }

    if (this.selectedTowerType && this.hoveredCell) {
      const center = this.grid.getCellCenter(this.hoveredCell.col, this.hoveredCell.row);
      const range = this.selectedTowerType.levels[0].range;
      const display = MakkoEngine.display;
      display.drawCircle(center.x, center.y, range, {
        stroke: this.selectedTowerType.levels[0].color,
        lineWidth: 1.5,
        alpha: 0.5,
      });
      display.drawCircle(center.x, center.y, range, {
        fill: this.selectedTowerType.levels[0].color,
        alpha: 0.08,
      });
    }
  }

  private renderHUD(): void {
    const display = MakkoEngine.display;
    const w = display.width;
    const h = display.height;

    // Top bar background
    display.drawRect(0, 0, w, 64, {
      fill: '#0a0c14',
      alpha: 0.85,
    });
    display.drawLine(0, 64, w, 64, { stroke: '#3a3a4a', lineWidth: 1 });

    // Lives
    const livesText = `Lives: ${this.lives}`;
    display.drawText(livesText, 32, 22, {
      font: 'bold 28px monospace',
      fill: this.lives <= 5 ? '#e06060' : '#e0c080',
    });

    // Gold
    const goldText = `Gold: ${this.gold}`;
    display.drawText(goldText, 260, 22, {
      font: 'bold 28px monospace',
      fill: '#f0c050',
    });

    // Wave
    const current = this.waveManager.getWaveNumber();
    const total = this.waveManager.getTotalWaves();
    const waveText = `Wave ${current} / ${total}`;
    display.drawText(waveText, 500, 22, {
      font: 'bold 28px monospace',
      fill: '#a0d0e0',
    });

    // Phase indicator
    let phaseLabel = '';
    let phaseColor = '#aaaaaa';
    if (this.phase === 'build') {
      const t = Math.ceil(this.interWaveTimer / 1000);
      phaseLabel = t > 0 ? `Build Phase — Next wave in ${t}s (Space to start)` : 'Build Phase — Press Space to start';
      phaseColor = '#90c090';
    } else if (this.phase === 'wave') {
      const remaining = this.enemyManager.getActiveCount();
      phaseLabel = `Wave in Progress — ${remaining} enemies left`;
      phaseColor = '#e08060';
    }
    display.drawText(phaseLabel, 800, 22, {
      font: '20px monospace',
      fill: phaseColor,
    });

    // Chapter name (right side, before pause button)
    const chapText = this.chapter.name;
    const chapW = display.measureText(chapText, { font: '18px serif' }).width;
    display.drawText(chapText, 1820 - chapW - 100, 26, {
      font: '18px serif',
      fill: '#a89a78',
    });

    // Pause button
    this.pauseButton.render();

    // Bottom palette background
    const paletteY = h - 140;
    display.drawRect(0, paletteY, w, 140, {
      fill: '#0a0c14',
      alpha: 0.9,
    });
    display.drawLine(0, paletteY, w, paletteY, { stroke: '#3a3a4a', lineWidth: 1 });

    // Tower palette
    const slotW = 200;
    const slotH = 100;
    const slotGap = 30;
    const totalSlotsW = TOWER_DEFINITIONS.length * slotW + (TOWER_DEFINITIONS.length - 1) * slotGap;
    const paletteStartX = (w - totalSlotsW) / 2;

    for (let i = 0; i < TOWER_DEFINITIONS.length; i++) {
      const def = TOWER_DEFINITIONS[i];
      const slotX = paletteStartX + i * (slotW + slotGap);
      const slotY = paletteY + 20;
      const isSelected = this.selectedTowerType?.id === def.id;
      const isStub = def.id === 'lightning';
      const canAfford = this.gold >= def.levels[0].cost;
      const isHovered =
        this.mouseGameX >= slotX && this.mouseGameX <= slotX + slotW &&
        this.mouseGameY >= slotY && this.mouseGameY <= slotY + slotH;

      display.drawRoundRect(slotX, slotY, slotW, slotH, 8, {
        fill: isSelected ? '#2a3a4a' : '#1a1a28',
        stroke: isSelected ? def.levels[0].color : isHovered ? '#5a5a7a' : '#3a3a4a',
        lineWidth: isSelected ? 2 : 1,
      });

      const hotkey = TOWER_HOTKEYS[def.id] ?? String(i + 1);
      display.drawRoundRect(slotX + 8, slotY + 8, 24, 24, 4, { fill: '#3a3a4a' });
      display.drawText(hotkey, slotX + 20, slotY + 14, {
        font: 'bold 16px monospace',
        fill: '#f0e0c0',
        align: 'center',
        baseline: 'middle',
      });

      display.drawText(def.name, slotX + 40, slotY + 14, {
        font: 'bold 16px monospace',
        fill: isStub ? '#666' : '#e0e0e8',
      });

      display.drawText(`Cost: ${def.levels[0].cost}g`, slotX + 40, slotY + 36, {
        font: '14px monospace',
        fill: canAfford ? '#f0c050' : '#806040',
      });

      display.drawText(def.description, slotX + 40, slotY + 56, {
        font: '12px monospace',
        fill: '#888',
      });

      if (isStub) {
        display.drawText('(Coming soon)', slotX + 40, slotY + 76, {
          font: '12px monospace',
          fill: '#666',
        });
      }

      if (isHovered && MakkoEngine.input.isMousePressed() && !isStub && canAfford) {
        this.setSelectedTowerType(def);
      }
    }

    // Speed next wave button
    if (this.phase === 'build') {
      this.speedNextWaveButton.x = w - 260;
      this.speedNextWaveButton.y = 90;
      this.speedNextWaveButton.render();
    }
  }

  private renderTowerInfoPanel(): void {
    if (!this.selectedPlacedTower) return;

    const display = MakkoEngine.display;
    const panelX = 1620;
    const panelY = 100;
    const panelW = 280;
    const panelH = 380;

    display.drawRoundRect(panelX, panelY, panelW, panelH, 8, {
      fill: '#0a0c14',
      stroke: '#5a5a7a',
      lineWidth: 1,
    });

    const tower = this.selectedPlacedTower;
    const stats = tower.getStats();
    display.drawText(tower.definition.name, panelX + 16, panelY + 16, {
      font: 'bold 22px monospace',
      fill: stats.color,
    });
    display.drawText(`Level ${tower.getCurrentLevel() + 1} / 3`, panelX + 16, panelY + 46, {
      font: '14px monospace',
      fill: '#888',
    });

    display.drawLine(panelX + 16, panelY + 76, panelX + panelW - 16, panelY + 76, {
      stroke: '#3a3a4a',
      lineWidth: 1,
    });

    const lines = [
      `Damage:    ${stats.damage}`,
      `Range:     ${stats.range}`,
      `Fire Rate: ${(1000 / stats.fireRate).toFixed(1)}/s`,
    ];
    if (stats.splashRadius) lines.push(`Splash:    ${stats.splashRadius}`);
    if (stats.slowDuration && stats.slowFactor) {
      lines.push(`Slow:      ${Math.round((1 - stats.slowFactor) * 100)}% for ${stats.slowDuration / 1000}s`);
    }
    lines.push(`Strategy:  ${tower.definition.targetStrategy}`);

    let statY = panelY + 92;
    for (const line of lines) {
      display.drawText(line, panelX + 16, statY, {
        font: '14px monospace',
        fill: '#c0c0d0',
      });
      statY += 22;
    }

    if (tower.canUpgrade()) {
      const upgradeCost = tower.getUpgradeCost();
      const canUpgrade = this.gold >= upgradeCost;
      const btnX = panelX + 16;
      const btnY = panelY + panelH - 100;
      display.drawRoundRect(btnX, btnY, panelW - 32, 36, 6, {
        fill: canUpgrade ? '#3a6a3a' : '#3a3a3a',
        stroke: canUpgrade ? '#5cd46a' : '#5a5a5a',
        lineWidth: 1,
      });
      display.drawText(`Upgrade (${upgradeCost}g)  [U]`, btnX + (panelW - 32) / 2, btnY + 18, {
        font: 'bold 14px monospace',
        fill: canUpgrade ? '#fff' : '#666',
        align: 'center',
        baseline: 'middle',
      });

      if (
        this.mouseGameX >= btnX && this.mouseGameX <= btnX + (panelW - 32) &&
        this.mouseGameY >= btnY && this.mouseGameY <= btnY + 36 &&
        MakkoEngine.input.isMousePressed() && canUpgrade
      ) {
        this.upgradeSelectedTower();
      }
    } else {
      display.drawText('Max Level', panelX + panelW / 2, panelY + panelH - 82, {
        font: 'bold 14px monospace',
        fill: '#f0c050',
        align: 'center',
      });
    }

    const sellX = panelX + 16;
    const sellY = panelY + panelH - 56;
    display.drawRoundRect(sellX, sellY, panelW - 32, 36, 6, {
      fill: '#6a3a3a',
      stroke: '#d46060',
      lineWidth: 1,
    });
    display.drawText(`Sell (+${tower.getSellValue()}g)  [S]`, sellX + (panelW - 32) / 2, sellY + 18, {
      font: 'bold 14px monospace',
      fill: '#fff',
      align: 'center',
      baseline: 'middle',
    });

    if (
      this.mouseGameX >= sellX && this.mouseGameX <= sellX + (panelW - 32) &&
      this.mouseGameY >= sellY && this.mouseGameY <= sellY + 36 &&
      MakkoEngine.input.isMousePressed()
    ) {
      this.sellSelectedTower();
    }
  }

  private renderPauseModal(): void {
    const display = MakkoEngine.display;
    const w = display.width;
    const h = display.height;

    display.drawRect(0, 0, w, h, { fill: '#000', alpha: 0.65 });

    const panelW = 380;
    const panelH = 280;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;
    display.drawRoundRect(panelX, panelY, panelW, panelH, 12, {
      fill: '#1a1a28',
      stroke: '#5a5a7a',
      lineWidth: 2,
    });

    display.drawText('Paused', panelX + panelW / 2, panelY + 36, {
      font: 'bold 36px serif',
      fill: '#f5e6c0',
      align: 'center',
      baseline: 'middle',
    });

    this.resumeButton.x = panelX + (panelW - this.resumeButton.width) / 2;
    this.resumeButton.y = panelY + 100;
    this.restartButton.x = panelX + (panelW - this.restartButton.width) / 2;
    this.restartButton.y = panelY + 160;
    this.quitButton.x = panelX + (panelW - this.quitButton.width) / 2;
    this.quitButton.y = panelY + 220;

    this.resumeButton.render();
    this.restartButton.render();
    this.quitButton.render();
  }

  private renderVictoryOverlay(): void {
    this.renderEndGameOverlay('Victory!', '#90c090', `Chapter ${this.chapter.id} defended.`, 'Continue');
  }

  private renderDefeatOverlay(): void {
    this.renderEndGameOverlay('Defeat', '#e06060', `The Shrouded Host overran the core.`, 'Back to Chapters');
  }

  private renderEndGameOverlay(title: string, color: string, subtitle: string, continueLabel: string): void {
    const display = MakkoEngine.display;
    const w = display.width;
    const h = display.height;

    display.drawRect(0, 0, w, h, { fill: '#000', alpha: 0.7 });

    const panelW = 460;
    const panelH = 360;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;
    display.drawRoundRect(panelX, panelY, panelW, panelH, 12, {
      fill: '#1a1a28',
      stroke: color,
      lineWidth: 2,
    });

    display.drawText(title, panelX + panelW / 2, panelY + 40, {
      font: 'bold 48px serif',
      fill: color,
      align: 'center',
      baseline: 'middle',
    });

    display.drawText(subtitle, panelX + panelW / 2, panelY + 100, {
      font: '18px serif',
      fill: '#c0c0d0',
      align: 'center',
      baseline: 'middle',
    });

    const statsY = panelY + 160;
    display.drawText(`Lives remaining: ${this.lives}`, panelX + panelW / 2, statsY, {
      font: '18px monospace',
      fill: '#e0c080',
      align: 'center',
    });
    display.drawText(`Enemies defeated: ${this.totalEnemiesKilled}`, panelX + panelW / 2, statsY + 30, {
      font: '18px monospace',
      fill: '#a0d0e0',
      align: 'center',
    });

    this.continueButton.label = continueLabel;
    this.continueButton.x = panelX + (panelW - 220) / 2;
    this.continueButton.y = panelY + panelH - 70;
    this.continueButton.render();

    this.retryButton.x = panelX + (panelW - 220) / 2;
    this.retryButton.y = panelY + panelH - 130;
    this.retryButton.render();
  }

  // ============================================================================
  // Actions
  // ============================================================================

  private setPhase(phase: PlayPhase): void {
    this.phase = phase;
  }

  private setSelectedTowerType(def: TowerDefinition | null): void {
    this.selectedTowerType = def;
    if (def) this.selectedPlacedTower = null;
  }

  private isValidPlacement(cell: { col: number; row: number } | null): boolean {
    if (!cell) return false;
    if (!this.grid.canPlace(cell.col, cell.row)) return false;
    if (!this.selectedTowerType) return false;
    if (this.gold < this.selectedTowerType.levels[0].cost) return false;
    return true;
  }

  private tryPlaceTower(col: number, row: number): void {
    if (!this.selectedTowerType) return;
    const cost = this.selectedTowerType.levels[0].cost;
    if (this.gold < cost) return;
    const result = this.towerManager.placeTower(col, row, this.selectedTowerType);
    if (result) {
      this.gold -= cost;
    }
  }

  private upgradeSelectedTower(): void {
    if (!this.selectedPlacedTower) return;
    const cost = this.towerManager.upgradeTower(this.selectedPlacedTower);
    if (cost > 0) {
      this.gold -= cost;
    }
  }

  private sellSelectedTower(): void {
    if (!this.selectedPlacedTower) return;
    const refund = this.towerManager.sellTower(this.selectedPlacedTower);
    this.gold += refund;
    this.selectedPlacedTower = null;
  }

  private startNextWave(): void {
    if (this.phase !== 'build') return;
    if (this.waveManager.getState() !== 'waiting' && this.waveManager.getState() !== 'completed') return;
    this.phase = 'wave';
    this.waveManager.skipWave();
    this.interWaveTimer = 0;
  }

  private unlockNextChapter(): void {
    const save = loadSave();
    const nextId = this.chapter.id + 1;
    if (nextId <= CHAPTERS.length && !save.unlockedChapters.includes(nextId)) {
      save.unlockedChapters.push(nextId);
    }
    saveSave(save);
  }

  // ============================================================================
  // Mouse helpers
  // ============================================================================

  private updateMouseCoords(): void {
    const display = MakkoEngine.display;
    const game = display.toGameCoords(MakkoEngine.input.mouseX, MakkoEngine.input.mouseY);
    this.mouseGameX = game.x;
    this.mouseGameY = game.y;
    this.hoveredCell = this.grid.getCellAt(this.mouseGameX, this.mouseGameY);
  }
}
