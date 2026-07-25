/**
 * UI Layout Containers
 *
 * Layout containers that position child elements with consistent spacing.
 * All components implement UIElement and use UI_THEME tokens.
 *
 * - WrappedText: auto word-wrapping text with getHeight()
 * - HStack: horizontal row layout with gap/align/distribute
 * - VStack: vertical stack layout with gap/padding, propagates width to children
 */

import { MakkoEngine } from '@makko/engine';
import { type UIElement, UI_THEME } from './ui-layer';
import { type TextSize, type TextColor, type TextAlign } from './ui-elements';

/**
 * Read a numeric property off a UIElement without widening it to `any`.
 * Some concrete elements expose `width`/`height` (Card, Button, StacK) while
 * the base UIElement interface does not — containers need to probe for it.
 */
export function getNumericProp(obj: unknown, key: 'width' | 'height'): number | undefined {
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'number' ? v : undefined;
}

// ============================================================================
// WrappedText
// ============================================================================

/**
 * WrappedText - text with automatic word wrapping
 *
 * Uses display.measureText() to split text at word boundaries
 * when it exceeds maxWidth. Exposes getHeight() for parent layouts.
 */
export class WrappedText implements UIElement {
  x: number;
  y: number;
  text: string;
  maxWidth: number;
  visible: boolean = true;

  size: TextSize;
  color: TextColor;
  align: TextAlign;
  lineHeight: number;

  private cachedLines: string[] | null = null;
  private cachedText: string = '';
  private cachedMaxWidth: number = 0;
  private cachedFont: string = '';

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(
    x: number,
    y: number,
    text: string,
    maxWidth: number,
    options: {
      size?: TextSize;
      color?: TextColor;
      align?: TextAlign;
      lineHeight?: number;
    } = {}
  ) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.maxWidth = maxWidth;
    this.size = options.size ?? 'sm';
    this.color = options.color ?? 'muted';
    this.align = options.align ?? 'left';
    this.lineHeight = options.lineHeight ?? 1.3;
  }

  private getFontSize(): number {
    const sizes = {
      sm: UI_THEME.font.sizeSm,
      md: UI_THEME.font.sizeMd,
      lg: UI_THEME.font.sizeLg,
    };
    return sizes[this.size];
  }

  private getFont(): string {
    return `${this.getFontSize()}px ${UI_THEME.font.family}`;
  }

  private getColor(): string {
    const colors = {
      text: UI_THEME.text,
      muted: UI_THEME.textMuted,
      dim: UI_THEME.textDim,
    };
    return colors[this.color];
  }

  private wrapLines(): string[] {
    const font = this.getFont();
    if (
      this.cachedLines &&
      this.cachedText === this.text &&
      this.cachedMaxWidth === this.maxWidth &&
      this.cachedFont === font
    ) {
      return this.cachedLines;
    }

    const display = MakkoEngine.display;
    const words = this.text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = display.measureText(testLine, { font }).width;

      if (width > this.maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    this.cachedLines = lines;
    this.cachedText = this.text;
    this.cachedMaxWidth = this.maxWidth;
    this.cachedFont = font;
    return lines;
  }

  getWidth(): number {
    return this.maxWidth;
  }

  getHeight(): number {
    const lines = this.wrapLines();
    const fontSize = this.getFontSize();
    return Math.max(1, lines.length) * fontSize * this.lineHeight;
  }

  render(): void {
    if (!this.visible) return;
    const display = MakkoEngine.display;
    const lines = this.wrapLines();
    const fontSize = this.getFontSize();
    const font = this.getFont();
    const fill = this.getColor();
    const spacing = fontSize * this.lineHeight;

    for (let i = 0; i < lines.length; i++) {
      display.drawText(lines[i], this.x, this.y + i * spacing, {
        font,
        fill,
        align: this.align,
        baseline: 'top',
      });
    }
  }
}

// ============================================================================
// HStack
// ============================================================================

export type HStackAlign = 'start' | 'center' | 'end';
export type HStackDistribute = 'even' | 'space-between' | 'space-around';

/**
 * HStack - horizontal row layout
 *
 * Distributes children evenly across the width with consistent gaps.
 * Repositions children on each render() call for dynamic add/remove.
 */
export class HStack implements UIElement {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean = true;

  private children: UIElement[] = [];
  private gap: number;
  private align: HStackAlign;
  private distribute: HStackDistribute;

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      gap?: number;
      align?: HStackAlign;
      distribute?: HStackDistribute;
    } = {}
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.gap = options.gap ?? UI_THEME.spacing.md;
    this.align = options.align ?? 'center';
    this.distribute = options.distribute ?? 'even';
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  add(element: UIElement): void {
    this.children.push(element);
  }

  clear(): void {
    this.children.length = 0;
  }

  private layoutChildren(): void {
    const count = this.children.length;
    if (count === 0) return;

    // Calculate x positions based on distribute mode
    let positions: number[];

    if (this.distribute === 'space-between') {
      if (count === 1) {
        positions = [this.x];
      } else {
        const step = this.width / (count - 1);
        positions = [];
        for (let i = 0; i < count; i++) {
          positions.push(this.x + i * step);
        }
      }
    } else if (this.distribute === 'space-around') {
      const segment = this.width / count;
      positions = [];
      for (let i = 0; i < count; i++) {
        positions.push(this.x + segment * i + segment / 2);
      }
    } else {
      // even: equal spacing with gap
      const totalGap = (count - 1) * this.gap;
      const slotWidth = (this.width - totalGap) / count;
      positions = [];
      for (let i = 0; i < count; i++) {
        positions.push(this.x + i * (slotWidth + this.gap));
      }
    }

    // Apply y alignment
    for (let i = 0; i < count; i++) {
      const child = this.children[i];
      child.x = positions[i];

      // Account for child height when aligning vertically.
      // Rect-based elements (StatusBar, Button) render from top-left,
      // so we must offset by their height to center properly.
      const childH = getNumericProp(child, 'height') ?? 0;

      if (this.align === 'start') {
        child.y = this.y;
      } else if (this.align === 'end') {
        child.y = this.y + this.height - childH;
      } else {
        child.y = this.y + (this.height - childH) / 2;
      }
    }
  }

  update(dt: number): void {
    for (const child of this.children) {
      if (child.visible && child.update) {
        child.update(dt);
      }
    }
  }

  render(): void {
    if (!this.visible) return;
    this.layoutChildren();
    for (const child of this.children) {
      if (child.visible) {
        child.render();
      }
    }
  }
}

// ============================================================================
// VStack
// ============================================================================


/**
 * Measurable element — extends UIElement with a getHeight() method
 * so VStack can query the rendered height of each child.
 */
export interface MeasurableElement extends UIElement {
  getHeight(): number;
}

export function isMeasurable(el: UIElement): el is MeasurableElement {
  return typeof (el as MeasurableElement).getHeight === 'function';
}

/**
 * VStack - vertical stack layout
 *
 * Positions each child below the previous one with consistent gap spacing.
 * Exposes getHeight() — sum of children heights plus gaps.
 */
export class VStack implements UIElement {
  x: number;
  y: number;
  width: number;
  visible: boolean = true;

  private children: UIElement[] = [];
  private gap: number;
  private padding: number;
  private childHeights: number[];

  /**
   * @param x Top-left X position (screen-space pixels)
   * @param y Top-left Y position (screen-space pixels)
   */
  constructor(
    x: number,
    y: number,
    width: number,
    options: {
      gap?: number;
      padding?: number;
    } = {}
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.gap = options.gap ?? UI_THEME.spacing.sm;
    this.padding = options.padding ?? 0;
    this.childHeights = [];
  }

  add(element: UIElement | MeasurableElement): void {
    this.children.push(element);
  }

  clear(): void {
    this.children.length = 0;
    this.childHeights.length = 0;
  }

  getWidth(): number {
    return this.width;
  }

  getChildren(): UIElement[] {
    return this.children;
  }

  private layoutChildren(): void {
    const count = this.children.length;
    if (count === 0) return;

    const contentWidth = this.width - this.padding * 2;
    let currentY = this.y + this.padding;
    this.childHeights.length = 0;

    for (let i = 0; i < count; i++) {
      const child = this.children[i];

      // Always position at left edge — children use their own width
      // property to resolve internal alignment (e.g. Text centering)
      child.x = this.x + this.padding;
      child.y = currentY;

      // Propagate container width so children can self-align
      if (getNumericProp(child, 'width') !== undefined) {
        (child as unknown as { width: number }).width = contentWidth;
      }

      // Get height for next child positioning
      const h = isMeasurable(child) ? child.getHeight() : 20;
      this.childHeights.push(h);
      currentY += h + this.gap;
    }
  }

  getHeight(): number {
    if (this.children.length === 0) return this.padding * 2;

    let total = this.padding * 2;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      total += isMeasurable(child) ? child.getHeight() : 20;
      if (i < this.children.length - 1) total += this.gap;
    }
    return total;
  }

  update(dt: number): void {
    for (const child of this.children) {
      if (child.visible && child.update) {
        child.update(dt);
      }
    }
  }

  render(): void {
    if (!this.visible) return;
    this.layoutChildren();
    for (const child of this.children) {
      if (child.visible) {
        child.render();
      }
    }
  }
}

