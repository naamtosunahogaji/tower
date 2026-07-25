/**
 * UI Modal Overlay
 *
 * Full-screen backdrop with centered content container.
 * Use for game-over screens, popups, confirmation dialogs.
 *
 * Usage:
 *   const modal = new Modal({
 *     width: 300,
 *     children: [titleText, scoreText, retryButton],
 *   });
 *   modal.update(dt);
 *   modal.render();
 *   if (modal.isBackdropClicked()) { ... }
 */

import { MakkoEngine } from '@makko/engine';
import { type UIElement, UI_THEME } from './ui-layer';
import { isMeasurable, getNumericProp } from './ui-layout';

/**
 * Modal - overlay with backdrop and centered content
 *
 * Renders a semi-transparent backdrop covering the full screen,
 * then centers a panel containing stacked children.
 * Exposes isBackdropClicked() for click-outside-to-dismiss.
 */
export class Modal implements UIElement {
  x: number = 0;
  y: number = 0;
  visible: boolean = true;

  private children: UIElement[];
  private contentWidth: number;
  private gap: number;
  private padding: number;
  private backdropAlpha: number;
  private backdropClicked: boolean = false;

  constructor(options: {
    width?: number;
    children?: UIElement[];
    gap?: number;
    padding?: number;
    backdropAlpha?: number;
  } = {}) {
    this.contentWidth = options.width ?? 300;
    this.children = options.children ?? [];
    this.gap = options.gap ?? UI_THEME.spacing.md;
    this.padding = options.padding ?? UI_THEME.spacing.xl;
    this.backdropAlpha = options.backdropAlpha ?? 0.6;
  }

  add(element: UIElement): void {
    this.children.push(element);
  }

  clear(): void {
    this.children.length = 0;
  }

  /**
   * Returns true when the user clicks outside the content panel
   */
  isBackdropClicked(): boolean {
    return this.backdropClicked;
  }

  update(dt: number): void {
    this.backdropClicked = false;

    if (!this.visible) return;

    const input = MakkoEngine.input;

    // Check for click outside content panel
    if (input.isMousePressed()) {
      const display = MakkoEngine.display;
      const panelW = this.contentWidth + this.padding * 2;
      const panelH = this.getContentHeight() + this.padding * 2;
      const panelX = (display.width - panelW) / 2;
      const panelY = (display.height - panelH) / 2;

      const mx = input.mouseX;
      const my = input.mouseY;
      if (mx < panelX || mx > panelX + panelW || my < panelY || my > panelY + panelH) {
        this.backdropClicked = true;
      }
    }

    // Update children
    for (const child of this.children) {
      if (child.visible && child.update) {
        child.update(dt);
      }
    }
  }

  render(): void {
    if (!this.visible) return;

    const display = MakkoEngine.display;
    const w = display.width;
    const h = display.height;

    // Backdrop
    display.drawRect(0, 0, w, h, {
      fill: '#000000',
      alpha: this.backdropAlpha,
    });

    // Calculate panel dimensions
    const panelW = this.contentWidth + this.padding * 2;
    const contentH = this.getContentHeight();
    const panelH = contentH + this.padding * 2;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    // Panel background
    display.drawRoundRect(panelX, panelY, panelW, panelH, UI_THEME.radius.lg, {
      fill: UI_THEME.surface,
      stroke: UI_THEME.border,
      lineWidth: 1,
    });

    // Layout children vertically inside panel
    let currentY = panelY + this.padding;
    for (const child of this.children) {
      if (!child.visible) continue;

      child.x = panelX + this.padding;
      child.y = currentY;

      // Propagate width for alignment
      if (getNumericProp(child, 'width') !== undefined) {
        (child as unknown as { width: number }).width = this.contentWidth;
      }

      child.render();

      const childH = isMeasurable(child) ? child.getHeight() : 20;
      currentY += childH + this.gap;
    }
  }

  private getContentHeight(): number {
    let total = 0;
    let visibleCount = 0;

    for (const child of this.children) {
      if (!child.visible) continue;
      total += isMeasurable(child) ? child.getHeight() : 20;
      visibleCount++;
    }

    if (visibleCount > 1) {
      total += (visibleCount - 1) * this.gap;
    }

    return total;
  }
}
