/**
 * UI Content Display Components
 *
 * Structured content components used inside layout containers.
 * All implement UIElement and use UI_THEME tokens.
 *
 * - Card: structured content with icon, title, subtitle, body + hit-testing
 * - Badge: compact pill-shaped label/tag
 * - Divider: horizontal separator line with optional gradient
 */

import { MakkoEngine } from '@makko/engine';
import { type UIElement, UI_THEME } from './ui-layer';
import { WrappedText } from './ui-layout';

// ============================================================================
// Card
// ============================================================================

/**
 * Card - structured content card with icon, title, subtitle, body
 *
 * Auto-calculates height based on content. Supports selection and
 * disabled states. Exposes getHeight() and contains() for hit testing.
 */
export class Card implements UIElement {
  x: number;
  y: number;
  width: number;
  visible: boolean = true;

  // Content
  icon: { text?: string; color: string } | null;
  title: string;
  subtitle: string;
  body: string;

  // Options
  padding: number;
  iconSize: number;
  selected: boolean;
  disabled: boolean;
  borderColor: string;

  private cachedHeight: number = 0;
  private bodyWrapped: WrappedText | null = null;

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(
    x: number,
    y: number,
    width: number,
    options: {
      icon?: { text?: string; color: string };
      title?: string;
      subtitle?: string;
      body?: string;
      padding?: number;
      iconSize?: number;
      selected?: boolean;
      disabled?: boolean;
      borderColor?: string;
    } = {}
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.icon = options.icon ?? null;
    this.title = options.title ?? '';
    this.subtitle = options.subtitle ?? '';
    this.body = options.body ?? '';
    this.padding = options.padding ?? UI_THEME.spacing.sm;
    this.iconSize = options.iconSize ?? 20;
    this.selected = options.selected ?? false;
    this.disabled = options.disabled ?? false;
    this.borderColor = options.borderColor ?? UI_THEME.border;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    this.calculateHeight();
    return this.cachedHeight;
  }

  contains(mx: number, my: number): boolean {
    return (
      mx >= this.x &&
      mx <= this.x + this.width &&
      my >= this.y &&
      my <= this.y + this.getHeight()
    );
  }

  private calculateHeight(): void {
    let h = this.padding * 2;

    // Icon + title row height
    if (this.title || this.icon) {
      h += Math.max(this.iconSize, UI_THEME.font.sizeMd);
    }

    // Subtitle
    if (this.subtitle) {
      h += UI_THEME.font.sizeSm + UI_THEME.spacing.xs;
    }

    // Body (wrapped text)
    if (this.body) {
      const contentWidth = this.width - this.padding * 2 - (this.icon ? this.iconSize + UI_THEME.spacing.sm : 0);
      if (!this.bodyWrapped || this.bodyWrapped.text !== this.body || this.bodyWrapped.maxWidth !== contentWidth) {
        this.bodyWrapped = new WrappedText(0, 0, this.body, contentWidth, {
          size: 'sm',
          color: 'dim',
        });
      }
      h += this.bodyWrapped.getHeight() + UI_THEME.spacing.xs;
    }

    this.cachedHeight = h;
  }

  render(): void {
    if (!this.visible) return;

    const display = MakkoEngine.display;
    const height = this.getHeight();

    // Background
    const bgColor = this.selected ? UI_THEME.surfaceHover : UI_THEME.surface;
    const strokeColor = this.selected ? UI_THEME.primary : this.borderColor;
    const strokeWidth = this.selected ? 2 : 1;

    display.drawRoundRect(this.x, this.y, this.width, height, UI_THEME.radius.md, {
      fill: bgColor,
      stroke: strokeColor,
      lineWidth: strokeWidth,
    });

    let contentY = this.y + this.padding;
    const contentX = this.x + this.padding;
    const textStartX = contentX + (this.icon ? this.iconSize + UI_THEME.spacing.sm : 0);

    // Icon
    if (this.icon) {
      const iconCenterX = contentX + this.iconSize / 2;
      const iconCenterY = contentY + this.iconSize / 2;
      const iconColor = this.disabled ? UI_THEME.textDim : this.icon.color;

      display.drawCircle(iconCenterX, iconCenterY, this.iconSize / 2, {
        fill: iconColor,
      });

      if (this.icon.text) {
        display.drawText(this.icon.text, iconCenterX, iconCenterY, {
          font: `bold ${UI_THEME.font.sizeXs}px ${UI_THEME.font.family}`,
          fill: UI_THEME.text,
          align: 'center',
          baseline: 'middle',
        });
      }
    }

    // Title
    if (this.title) {
      const titleColor = this.disabled ? UI_THEME.textDim : UI_THEME.text;
      display.drawText(this.title, textStartX, contentY + (this.icon ? this.iconSize / 2 : UI_THEME.font.sizeMd / 2), {
        font: `bold ${UI_THEME.font.sizeMd}px ${UI_THEME.font.family}`,
        fill: titleColor,
        align: 'left',
        baseline: 'middle',
      });
      contentY += Math.max(this.iconSize, UI_THEME.font.sizeMd);
    }

    // Subtitle
    if (this.subtitle) {
      contentY += UI_THEME.spacing.xs;
      const subColor = this.disabled ? UI_THEME.textDim : UI_THEME.textMuted;
      display.drawText(this.subtitle, textStartX, contentY, {
        font: `${UI_THEME.font.sizeSm}px ${UI_THEME.font.family}`,
        fill: subColor,
        align: 'left',
        baseline: 'top',
      });
      contentY += UI_THEME.font.sizeSm;
    }

    // Body (wrapped)
    if (this.body && this.bodyWrapped) {
      contentY += UI_THEME.spacing.xs;
      this.bodyWrapped.x = textStartX;
      this.bodyWrapped.y = contentY;
      this.bodyWrapped.render();
    }
  }
}

// ============================================================================
// Badge
// ============================================================================

/**
 * Badge - small labeled chip / pill
 *
 * Auto-sized to text with small padding. Use for cost tags, key hints, level badges.
 */
export class Badge implements UIElement {
  x: number;
  y: number;
  label: string;
  visible: boolean = true;

  bgColor: string;
  textColor: string;
  fontSize: number;

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(
    x: number,
    y: number,
    label: string,
    options: {
      color?: string;
      textColor?: string;
      fontSize?: number;
    } = {}
  ) {
    this.x = x;
    this.y = y;
    this.label = label;
    this.bgColor = options.color ?? UI_THEME.primary;
    this.textColor = options.textColor ?? UI_THEME.text;
    this.fontSize = options.fontSize ?? UI_THEME.font.sizeXs;
  }

  private getPadX(): number {
    return UI_THEME.spacing.xs + 2;
  }

  getWidth(): number {
    const display = MakkoEngine.display;
    const font = `bold ${this.fontSize}px ${UI_THEME.font.family}`;
    return display.measureText(this.label, { font }).width + this.getPadX() * 2;
  }

  getHeight(): number {
    return this.fontSize + UI_THEME.spacing.xs * 2;
  }

  render(): void {
    if (!this.visible) return;

    const display = MakkoEngine.display;
    const font = `bold ${this.fontSize}px ${UI_THEME.font.family}`;
    const textWidth = display.measureText(this.label, { font }).width;
    const padX = this.getPadX();
    const padY = UI_THEME.spacing.xs;
    const w = textWidth + padX * 2;
    const h = this.fontSize + padY * 2;

    display.drawRoundRect(this.x, this.y, w, h, UI_THEME.radius.full, {
      fill: this.bgColor,
    });

    display.drawText(this.label, this.x + w / 2, this.y + h / 2, {
      font,
      fill: this.textColor,
      align: 'center',
      baseline: 'middle',
    });
  }
}

// ============================================================================
// Divider
// ============================================================================

/**
 * Divider - horizontal separator line
 *
 * Thin line with optional gradient fade on edges.
 * Height is always 1px but getHeight() returns 1 + vertical margin for layout math.
 */
export class Divider implements UIElement {
  x: number;
  y: number;
  width: number;
  visible: boolean = true;

  private color: string;
  private alpha: number;
  private gradient: boolean;
  private margin: number;

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(
    x: number,
    y: number,
    width: number,
    options: {
      color?: string;
      alpha?: number;
      gradient?: boolean;
      margin?: number;
    } = {}
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.color = options.color ?? UI_THEME.border;
    this.alpha = options.alpha ?? 0.5;
    this.gradient = options.gradient ?? false;
    this.margin = options.margin ?? UI_THEME.spacing.sm;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return 1 + this.margin * 2;
  }

  private parseHex(hex: string): { r: number; g: number; b: number } {
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    return {
      r: parseInt(h.slice(0, 2), 16) || 0,
      g: parseInt(h.slice(2, 4), 16) || 0,
      b: parseInt(h.slice(4, 6), 16) || 0,
    };
  }

  render(): void {
    if (!this.visible) return;

    const display = MakkoEngine.display;
    const lineY = this.y + this.margin;

    if (this.gradient) {
      // Parse hex color for rgba gradient (supports #fff and #ffffff)
      const { r, g, b } = this.parseHex(this.color);
      const a = this.alpha;

      display.drawRect(this.x, lineY, this.width, 1, {
        fill: {
          type: 'linear',
          x0: this.x,
          y0: 0,
          x1: this.x + this.width,
          y1: 0,
          stops: [
            { offset: 0, color: `rgba(${r}, ${g}, ${b}, 0)` },
            { offset: 0.5, color: `rgba(${r}, ${g}, ${b}, ${a})` },
            { offset: 1, color: `rgba(${r}, ${g}, ${b}, 0)` },
          ],
        },
      });
    } else {
      display.drawLine(this.x, lineY, this.x + this.width, lineY, {
        stroke: this.color,
        lineWidth: 1,
        alpha: this.alpha,
      });
    }
  }
}
