/**
 * Chapter Select Scene
 *
 * Displays the five chapters as cards. Locked chapters are dimmed.
 * Selecting a chapter enters the play scene.
 *
 * Persists unlocked chapters and last-selected chapter via aetherguard-save.
 */

import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../scene/base-scene';
import type { Game } from '../game/game';
import { CHAPTERS } from '../chapters/chapters';
import { loadSave, saveSave, AetherguardSave } from '../save/aetherguard-save';
import { Button } from '../ui/ui-elements';
import { Card } from '../ui/ui-cards';
import { HStack, VStack } from '../ui/ui-layout';
import { UILayer } from '../ui/ui-layer';

export class ChapterSelectScene extends BaseScene {
  readonly id = 'chapter-select';

  private game: Game;
  private ui: UILayer;
  private backButton: Button;
  private cards: Card[] = [];
  private selectedChapterId: number = 1;
  private hoverChapterId: number | null = null;
  private save: AetherguardSave;

  constructor(game: Game) {
    super();
    this.game = game;
    this.ui = new UILayer();
    this.save = loadSave();
    this.selectedChapterId = this.save.lastChapter;
    this.backButton = new Button(0, 0, 140, 44, '< Back', { variant: 'ghost' });
  }

  init(): void {
    this.ui.add(this.backButton);
    this.rebuildLayout();
  }

  enter(previousScene?: string): void {
    this.save = loadSave();
    this.rebuildLayout();
  }

  /**
   * Recompute card + button positions based on display dimensions.
   */
  private rebuildLayout(): void {
    const display = MakkoEngine.display;
    const w = display.width;

    // Back button: top-left corner
    this.backButton.x = 40;
    this.backButton.y = 40;

    // Title
    const titleY = 100;
    const titleFont = 'bold 48px serif';
    const title = 'Choose a Chapter';
    const titleW = display.measureText(title, { font: titleFont }).width;
    display.drawText(title, w / 2 - titleW / 2, titleY, { font: titleFont, fill: '#f5e6c0' });

    // Cards in a 5-wide row
    const cardW = 280;
    const cardGap = 30;
    const totalW = CHAPTERS.length * cardW + (CHAPTERS.length - 1) * cardGap;
    const startX = (w - totalW) / 2;
    const cardY = 220;

    this.cards = CHAPTERS.map((chapter, idx) => {
      const isUnlocked = this.save.unlockedChapters.includes(chapter.id);
      const isSelected = chapter.id === this.selectedChapterId;
      const card = new Card(startX + idx * (cardW + cardGap), cardY, cardW, {
        icon: { text: String(chapter.id), color: isSelected ? '#f5e6c0' : '#6a4a2a' },
        title: `Chapter ${chapter.id}`,
        subtitle: chapter.name.replace(`Chapter ${chapter.id}: `, ''),
        body: chapter.description,
        selected: isSelected,
        disabled: !isUnlocked,
        borderColor: isSelected ? '#f5e6c0' : '#3a3a4a',
      });
      return card;
    });
  }

  handleInput(): void {
    const input = MakkoEngine.input;

    // Back button click
    if (this.backButton.isClicked()) {
      this.switchTo('start');
      return;
    }

    // Mouse hover & click on chapter cards
    const mx = input.mouseX;
    const my = input.mouseY;
    this.hoverChapterId = null;

    for (const card of this.cards) {
      if (card.contains(mx, my)) {
        // Look up the chapter by card index
        const idx = this.cards.indexOf(card);
        const chapter = CHAPTERS[idx];
        if (chapter && this.save.unlockedChapters.includes(chapter.id)) {
          this.hoverChapterId = chapter.id;
          if (input.isMousePressed()) {
            this.selectChapter(chapter.id);
          }
        }
      }
    }

    // Keyboard navigation
    if (input.isKeyPressed('ArrowLeft')) {
      this.selectChapter(this.findNearestUnlocked(this.selectedChapterId, -1));
    } else if (input.isKeyPressed('ArrowRight')) {
      this.selectChapter(this.findNearestUnlocked(this.selectedChapterId, 1));
    } else if (input.isKeyPressed('Enter') || input.isKeyPressed('Space')) {
      if (this.save.unlockedChapters.includes(this.selectedChapterId)) {
        this.startChapter(this.selectedChapterId);
      }
    } else if (input.isKeyPressed('Escape')) {
      this.switchTo('start');
    }
  }

  private findNearestUnlocked(fromId: number, dir: -1 | 1): number {
    let id = fromId;
    for (let i = 0; i < CHAPTERS.length; i++) {
      id += dir;
      if (id < 1 || id > CHAPTERS.length) return fromId;
      if (this.save.unlockedChapters.includes(id)) return id;
    }
    return fromId;
  }

  private selectChapter(id: number): void {
    this.selectedChapterId = id;
    this.save.lastChapter = id;
    saveSave(this.save);
    this.rebuildLayout();
  }

  private startChapter(id: number): void {
    // Stash selected chapter for play scene to pick up
    this.game.setSelectedChapterId(id);
    this.switchTo('play');
  }

  render(): void {
    const display = MakkoEngine.display;
    const w = display.width;
    const h = display.height;

    // Background
    display.drawRect(0, 0, w, h, { fill: '#0d111c' });

    // Title
    const titleFont = 'bold 48px serif';
    const title = 'Choose a Chapter';
    const titleMetrics = display.measureText(title, { font: titleFont });
    display.drawText(title, w / 2 - titleMetrics.width / 2, 100, { font: titleFont, fill: '#f5e6c0' });

    // Cards
    for (const card of this.cards) {
      card.render();
    }

    // Locked overlay for each disabled card
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      if (card.disabled) {
        const cx = card.x + card.width / 2;
        const cy = card.y + card.getHeight() / 2 + 30;
        const lockFont = 'bold 32px monospace';
        const lockText = 'LOCKED';
        const lockMetrics = display.measureText(lockText, { font: lockFont });
        display.drawText(lockText, cx - lockMetrics.width / 2, cy, {
          font: lockFont,
          fill: '#665555',
        });
      }
    }

    // Hover hint
    if (this.hoverChapterId !== null) {
      const hintFont = '16px monospace';
      const hint = `Click to deploy — Chapter ${this.hoverChapterId}`;
      const hintMetrics = display.measureText(hint, { font: hintFont });
      display.drawText(hint, w / 2 - hintMetrics.width / 2, h - 160, {
        font: hintFont,
        fill: '#c49a6c',
      });
    }

    // Action prompt
    const promptFont = '18px monospace';
    const prompt = this.save.unlockedChapters.includes(this.selectedChapterId)
      ? `Chapter ${this.selectedChapterId} selected — Press ENTER to deploy`
      : `Chapter ${this.selectedChapterId} is locked — Clear the previous chapter first`;
    const promptMetrics = display.measureText(prompt, { font: promptFont });
    display.drawText(prompt, w / 2 - promptMetrics.width / 2, h - 110, {
      font: promptFont,
      fill: this.save.unlockedChapters.includes(this.selectedChapterId) ? '#a0d090' : '#887070',
    });

    // Footer
    const footerFont = '16px monospace';
    const footer = '< Left/Right: Change  |  Enter: Deploy  |  Esc: Back';
    const footerMetrics = display.measureText(footer, { font: footerFont });
    display.drawText(footer, w / 2 - footerMetrics.width / 2, h - 60, {
      font: footerFont,
      fill: '#555566',
    });

    // Back button
    this.backButton.render();
  }
}

// Silence unused warning — HStack/VStack are imported in case future layouts
// need them; remove when actually used.
void HStack; void VStack;
