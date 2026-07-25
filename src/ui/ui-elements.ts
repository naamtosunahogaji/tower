/**
 * UI Elements
 *
 * Common UI components: Button, StatusBar, Text.
 * All use screen-space coordinates and the UI theme.
 */

import { MakkoEngine } from '@makko/engine';
import { type UIElement, UI_THEME } from './ui-layer';

// ============================================================================
// Button
// ============================================================================

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

/**
 * Button - clickable UI element with hover/press states
 *
 * Variants:
 *   - primary: solid filled button (default)
 *   - ghost: transparent with border, subtle hover
 *   - danger: red tinted for destructive actions
 *
 * Set disabled=true to dim the button and block clicks.
 */
export class Button implements UIElement {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  visible: boolean = true;
  variant: ButtonVariant;
  disabled: boolean;

  private wasDown: boolean = false;
  private isHovered: boolean = false;
  private isPressed: boolean = false;

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    options: {
      variant?: ButtonVariant;
      disabled?: boolean;
    } = {}
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.label = label;
    this.variant = options.variant ?? 'primary';
    this.disabled = options.disabled ?? false;
  }

  update(dt: number): void {
    if (this.disabled) {
      this.isHovered = false;
      this.isPressed = false;
      this.wasDown = false;
      return;
    }

    const input = MakkoEngine.input;
    const mx = input.mouseX;
    const my = input.mouseY;

    this.isHovered =
      mx >= this.x &&
      mx <= this.x + this.width &&
      my >= this.y &&
      my <= this.y + this.height;

    this.isPressed = this.isHovered && input.isMouseDown();
  }

  /**
   * Returns true only on the frame the mouse is released over the button.
   * Always returns false when disabled.
   */
  isClicked(): boolean {
    if (this.disabled) return false;

    const input = MakkoEngine.input;
    const isOver =
      input.mouseX >= this.x &&
      input.mouseX <= this.x + this.width &&
      input.mouseY >= this.y &&
      input.mouseY <= this.y + this.height;

    const clicked = this.wasDown && !input.isMouseDown() && isOver;
    this.wasDown = input.isMouseDown() && isOver;
    return clicked;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  render(): void {
    const display = MakkoEngine.display;
    const { bg, text: textColor, stroke } = this.getColors();

    if (stroke) {
      display.drawRoundRect(this.x, this.y, this.width, this.height, UI_THEME.radius.md, {
        fill: bg,
        stroke,
        lineWidth: 1,
      });
    } else {
      display.drawRoundRect(this.x, this.y, this.width, this.height, UI_THEME.radius.md, {
        fill: bg,
      });
    }

    display.drawText(this.label, this.x + this.width / 2, this.y + this.height / 2, {
      font: `${UI_THEME.font.sizeMd}px ${UI_THEME.font.family}`,
      fill: textColor,
      align: 'center',
      baseline: 'middle',
    });
  }

  private getColors(): { bg: string; text: string; stroke?: string } {
    if (this.disabled) {
      return { bg: UI_THEME.surface, text: UI_THEME.textDim, stroke: UI_THEME.border };
    }

    if (this.variant === 'ghost') {
      if (this.isPressed) return { bg: 'rgba(255, 255, 255, 0.1)', text: UI_THEME.text, stroke: UI_THEME.borderLight };
      if (this.isHovered) return { bg: 'rgba(255, 255, 255, 0.06)', text: UI_THEME.text, stroke: UI_THEME.borderLight };
      return { bg: 'transparent', text: UI_THEME.textMuted, stroke: UI_THEME.border };
    }

    if (this.variant === 'danger') {
      if (this.isPressed) return { bg: '#991b1b', text: UI_THEME.text };
      if (this.isHovered) return { bg: '#b91c1c', text: UI_THEME.text };
      return { bg: '#dc2626', text: UI_THEME.text };
    }

    // primary (default)
    if (this.isPressed) return { bg: UI_THEME.primaryActive, text: UI_THEME.text };
    if (this.isHovered) return { bg: UI_THEME.primaryHover, text: UI_THEME.text };
    return { bg: UI_THEME.primary, text: UI_THEME.text };
  }
}

// ============================================================================
// StatusBar
// ============================================================================

export type StatusBarType = 'health' | 'mana' | 'stamina' | 'xp';

/**
 * StatusBar - horizontal bar for health, mana, stamina, etc.
 */
export class StatusBar implements UIElement {
  x: number;
  y: number;
  width: number;
  height: number;
  current: number;
  max: number;
  type: StatusBarType;
  visible: boolean = true;

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    current: number,
    max: number,
    type: StatusBarType = 'health'
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.current = current;
    this.max = max;
    this.type = type;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  private getBarColor(): string {
    if (this.type === 'health') {
      return this.current / this.max < 0.25 ? UI_THEME.healthLow : UI_THEME.health;
    }
    const colors: Record<StatusBarType, string> = {
      health: UI_THEME.health,
      mana: UI_THEME.mana,
      stamina: UI_THEME.stamina,
      xp: UI_THEME.xp,
    };
    return colors[this.type];
  }

  render(): void {
    const display = MakkoEngine.display;

    // Background track
    display.drawRoundRect(this.x, this.y, this.width, this.height, UI_THEME.radius.sm, {
      fill: UI_THEME.surface,
      stroke: UI_THEME.border,
      lineWidth: 1,
    });

    // Fill bar
    const padding = 2;
    const fillWidth = Math.max(0, (this.width - padding * 2) * (this.current / this.max));

    if (fillWidth > 0) {
      display.drawRoundRect(
        this.x + padding,
        this.y + padding,
        fillWidth,
        this.height - padding * 2,
        UI_THEME.radius.sm - 1,
        { fill: this.getBarColor() }
      );
    }
  }
}

// ============================================================================
// Text
// ============================================================================

export type TextSize = 'sm' | 'md' | 'lg';
export type TextColor = 'text' | 'muted' | 'dim';

/**
 * Text - static or dynamic text display
 */
export type TextAlign = 'left' | 'center' | 'right';

export class Text implements UIElement {
  x: number;
  y: number;
  text: string;
  size: TextSize;
  color: TextColor;
  align: TextAlign;
  visible: boolean = true;
  /** When set by a layout container, text alignment is relative to this width */
  width: number = 0;

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(
    x: number,
    y: number,
    text: string,
    options: {
      size?: TextSize;
      color?: TextColor;
      align?: TextAlign;
    } = {}
  ) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.size = options.size ?? 'md';
    this.color = options.color ?? 'text';
    this.align = options.align ?? 'left';
  }

  private getFontSize(): number {
    const sizes = {
      sm: UI_THEME.font.sizeSm,
      md: UI_THEME.font.sizeMd,
      lg: UI_THEME.font.sizeLg,
    };
    return sizes[this.size];
  }

  private getColor(): string {
    const colors = {
      text: UI_THEME.text,
      muted: UI_THEME.textMuted,
      dim: UI_THEME.textDim,
    };
    return colors[this.color];
  }

  getWidth(): number {
    if (this.width > 0) return this.width;
    const display = MakkoEngine.display;
    const font = `${this.getFontSize()}px ${UI_THEME.font.family}`;
    return display.measureText(this.text, { font }).width;
  }

  getHeight(): number {
    return this.getFontSize();
  }

  render(): void {
    const display = MakkoEngine.display;

    // When width is set, resolve alignment within the box
    let drawX = this.x;
    if (this.width > 0) {
      if (this.align === 'center') {
        drawX = this.x + this.width / 2;
      } else if (this.align === 'right') {
        drawX = this.x + this.width;
      }
    }

    display.drawText(this.text, drawX, this.y, {
      font: `${this.getFontSize()}px ${UI_THEME.font.family}`,
      fill: this.getColor(),
      align: this.align,
    });
  }
}

// ============================================================================
// Panel
// ============================================================================

/**
 * Panel - container with background for grouping UI elements
 */
export class Panel implements UIElement {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean = true;

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  render(): void {
    const display = MakkoEngine.display;

    display.drawRoundRect(this.x, this.y, this.width, this.height, UI_THEME.radius.lg, {
      fill: UI_THEME.surface,
      stroke: UI_THEME.border,
      lineWidth: 1,
    });
  }
}

// ============================================================================
// KeyHint
// ============================================================================

/**
 * KeyHint - keyboard shortcut indicator
 *
 * Renders a small bordered chip that looks like a physical key cap.
 * Use for showing keyboard shortcuts: new KeyHint(0, 0, 'SPACE')
 */
export class KeyHint implements UIElement {
  x: number;
  y: number;
  key: string;
  visible: boolean = true;

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(x: number, y: number, key: string) {
    this.x = x;
    this.y = y;
    this.key = key;
  }

  getWidth(): number {
    const display = MakkoEngine.display;
    const font = `${UI_THEME.font.sizeXs}px ${UI_THEME.font.family}`;
    const textW = display.measureText(this.key, { font }).width;
    return textW + UI_THEME.spacing.sm * 2;
  }

  getHeight(): number {
    return UI_THEME.font.sizeXs + UI_THEME.spacing.xs * 2;
  }

  render(): void {
    if (!this.visible) return;

    const display = MakkoEngine.display;
    const font = `${UI_THEME.font.sizeXs}px ${UI_THEME.font.family}`;
    const textW = display.measureText(this.key, { font }).width;
    const padX = UI_THEME.spacing.sm;
    const padY = UI_THEME.spacing.xs;
    const w = textW + padX * 2;
    const h = UI_THEME.font.sizeXs + padY * 2;

    display.drawRoundRect(this.x, this.y, w, h, UI_THEME.radius.sm, {
      fill: 'rgba(255, 255, 255, 0.06)',
      stroke: UI_THEME.border,
      lineWidth: 1,
    });

    display.drawText(this.key, this.x + w / 2, this.y + h / 2, {
      font,
      fill: UI_THEME.textDim,
      align: 'center',
      baseline: 'middle',
    });
  }
}
