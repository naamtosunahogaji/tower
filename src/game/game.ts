/**
 * Game — main class with scene-based architecture.
 *
 * Delegates all game logic to scenes via SceneManager.
 *
 * Usage:
 *   const game = new Game();
 *   await game.init();
 *   game.start();
 *
 * Adding scenes: create a class extending BaseScene, implement
 * init/enter/exit/handleInput/update/render, then register it in Game.init().
 *
 * Adding systems: create a class implementing System with id/priority/enabled,
 * then call this.addSystem() from the owning scene's init().
 *
 * Scene transitions: use this.switchTo('sceneId') for full transitions,
 * this.pushScene('pause') to overlay, this.popScene() to return.
 */

import { MakkoEngine } from '@makko/engine';
import { SceneManager } from '../scene/scene-manager';
import { StartScene } from '../scenes/start-scene';
import { ChapterSelectScene } from '../scenes/chapter-select-scene';
import { PlayScene } from '../scenes/play-scene';

export class Game {
  private scenes = new SceneManager();
  private lastTime = 0;
  private running = false;
  /** Chapter selected on the chapter-select screen — read by the play scene. */
  private selectedChapterId: number = 1;

  /**
   * Initialize game and register scenes.
   * Call this before start().
   */
  async init(): Promise<void> {
    await this.scenes.register(new StartScene(this));
    await this.scenes.register(new ChapterSelectScene(this));
    await this.scenes.register(new PlayScene(this));
  }

  /**
   * Start the game loop.
   * Switches to the start scene by default.
   */
  start(): void {
    this.running = true;
    this.lastTime = performance.now();

    this.scenes.switchTo('start');
    this.gameLoop();
  }

  stop(): void {
    this.running = false;
  }

  private gameLoop(): void {
    if (!this.running) return;

    const currentTime = performance.now();
    const dt = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.scenes.handleInput();
    this.scenes.update(dt);
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  private render(): void {
    const display = MakkoEngine.display;

    display.beginFrame();
    display.clear('#0d111c');

    this.scenes.render();

    display.endFrame();

    MakkoEngine.input.endFrame();
  }

  getSceneManager(): SceneManager {
    return this.scenes;
  }

  switchScene(sceneId: string): void {
    this.scenes.switchTo(sceneId);
  }

  setSelectedChapterId(id: number): void {
    this.selectedChapterId = id;
  }

  getSelectedChapterId(): number {
    return this.selectedChapterId;
  }
}
