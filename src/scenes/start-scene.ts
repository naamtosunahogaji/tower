/**
 * Start Scene
 *
 * Title screen with main menu. The Aetherguard's seal adorns the background.
 * Players start the campaign from here.
 */

import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../scene/base-scene';
import { Menu } from '../menu/menu';
import type { Game } from '../game/game';

export class StartScene extends BaseScene {
  readonly id = 'start';

  private menu: Menu;
  private game: Game;
  private menuTime: number = 0;

  constructor(game: Game) {
    super();
    this.game = game;
    this.menu = new Menu();
  }

  init(): void {
    this.menu.addItem({
      label: 'Start Campaign',
      action: () => this.switchTo('chapter-select'),
    });
    this.menu.addItem({
      label: 'Settings',
      action: () => {
        // Placeholder — settings scene not implemented in MVP
      },
    });
    this.menu.addItem({
      label: 'Quit',
      action: () => {
        // Cannot truly quit a browser game; do nothing on canvas
      },
    });
  }

  enter(previousScene?: string): void {
    this.menu.setSelectedIndex(0);
    this.menuTime = 0;
  }

  update(dt: number): void {
    this.menuTime += dt;
  }

  handleInput(): void {
    const input = MakkoEngine.input;

    if (input.isKeyPressed('ArrowUp')) {
      this.menu.navigateUp();
    }

    if (input.isKeyPressed('ArrowDown')) {
      this.menu.navigateDown();
    }

    if (input.isKeyPressed('Enter') || input.isKeyPressed('Space')) {
      this.menu.select();
    }
  }

  render(): void {
    const display = MakkoEngine.display;
    const centerX = display.width / 2;
    const centerY = display.height / 2;
    const w = display.width;
    const h = display.height;

    // Background gradient field (subtle)
    display.drawRect(0, 0, w, h, { fill: '#0d111c' });

    // Floating star field
    const stars = 60;
    for (let i = 0; i < stars; i++) {
      const sx = (i * 137 + this.menuTime * 0.01) % w;
      const sy = (i * 79 + Math.sin(this.menuTime * 0.0005 + i) * 8) % h;
      const alpha = 0.2 + 0.3 * Math.sin(this.menuTime * 0.002 + i);
      display.drawCircle(sx, sy, 1.2, { fill: '#a8c0e0', alpha });
    }

    // Title (upper third)
    const titleFont = 'bold 96px serif';
    const title = 'Aetherguard';
    const titleMetrics = display.measureText(title, { font: titleFont });
    display.drawText(title, centerX - titleMetrics.width / 2, centerY - 240, {
      font: titleFont,
      fill: '#f5e6c0',
      shadow: { color: '#c49a6c', blur: 16, offsetY: 2 },
    });

    // Subtitle
    const subtitleFont = '40px serif';
    const subtitle = 'Chapter Defense';
    const subMetrics = display.measureText(subtitle, { font: subtitleFont });
    display.drawText(subtitle, centerX - subMetrics.width / 2, centerY - 140, {
      font: subtitleFont,
      fill: '#c49a6c',
    });

    // Decorative divider
    display.drawLine(centerX - 200, centerY - 90, centerX + 200, centerY - 90, {
      stroke: '#6a4a2a',
      lineWidth: 2,
      alpha: 0.7,
    });

    // Tagline
    const tagFont = 'italic 20px serif';
    const tag = 'Hold the line, Commander.';
    const tagMetrics = display.measureText(tag, { font: tagFont });
    display.drawText(tag, centerX - tagMetrics.width / 2, centerY - 60, {
      font: tagFont,
      fill: '#8a8aa0',
    });

    // Menu
    this.menu.render(centerX, centerY + 20, {
      fontSize: 32,
      fontFamily: 'monospace',
      color: '#a0a0b8',
      selectedColor: '#f5e6c0',
      disabledColor: '#555566',
      selector: '>',
      spacing: 56,
      align: 'center',
    });

    // Footer hint
    const hintFont = '16px monospace';
    const hint = 'Arrow Keys to navigate  |  Enter to select';
    const hintMetrics = display.measureText(hint, { font: hintFont });
    display.drawText(hint, centerX - hintMetrics.width / 2, h - 80, {
      font: hintFont,
      fill: '#555566',
    });

    // Bottom credit
    const creditFont = '14px monospace';
    const credit = 'A 2.5D Tower Defense';
    const creditMetrics = display.measureText(credit, { font: creditFont });
    display.drawText(credit, centerX - creditMetrics.width / 2, h - 50, {
      font: creditFont,
      fill: '#444455',
    });
  }
}
