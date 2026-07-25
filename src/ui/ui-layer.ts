/**
 * UI Layer System — screen-space UI rendered on top of the game world.
 *
 * Use this for ALL on-canvas UI (buttons, modals, panels, HUD, menus). Hand-rolling these
 * widgets is a defect — every common widget already lives in this template. Compose layouts
 * with HStack/VStack and always read colors/spacing from UI_THEME instead of hardcoding.
 *
 * Integration:
 *   - Instantiate once per scene: `const ui = new UILayer(display)`.
 *   - Add widgets via `ui.add(new Button({...}))`.
 *   - Call `ui.update(dt)` and `ui.render()` from the scene's update/render hooks
 *     (render AFTER the game world, with camera reset so UI stays in screen space).
 *
 * Layout: wrap multi-widget clusters in HStack/VStack. Don't hardcode x/y for groups —
 *         let stacks flow them.
 * Theming: read `UI_THEME.colors.*`, `UI_THEME.spacing.*`, `UI_THEME.fontSize.*` rather
 *          than literal values; override the theme object to re-skin the whole UI.
 * Modals: use Modal for any blocking interaction (confirm, pause, game-over). The backdrop
 *         swallows input beneath — don't reimplement dimming/centering.
 */

import { MakkoEngine } from '@makko/engine';

/**
 * UI Element interface - all UI components implement this
 */
export interface UIElement {
  /** Screen X position (top-left corner of the element, in pixels) */
  x: number;
  /** Screen Y position (top-left corner of the element, in pixels) */
  y: number;
  /** Whether element is visible and should update/render */
  visible: boolean;
  /** Optional update method for interactive elements */
  update?(dt: number): void;
  /** Required render method */
  render(): void;
}

/**
 * UILayer - manages a collection of UI elements
 * Render this AFTER the game world, with camera offset reset
 */
export class UILayer {
  private elements: UIElement[] = [];

  /**
   * Add a UI element to the layer
   */
  add(element: UIElement): void {
    this.elements.push(element);
  }

  /**
   * Remove a UI element from the layer
   */
  remove(element: UIElement): void {
    this.elements = this.elements.filter((e) => e !== element);
  }

  /**
   * Update all visible elements
   */
  update(dt: number): void {
    for (const el of this.elements) {
      if (el.visible && el.update) {
        el.update(dt);
      }
    }
  }

  /**
   * Render all visible elements
   * Call AFTER resetting camera transform
   */
  render(): void {
    const display = MakkoEngine.display;

    // Ensure we're in screen-space (no camera offset)
    display.setGlobalOffset(0, 0);

    for (const el of this.elements) {
      if (el.visible) {
        el.render();
      }
    }
  }

  /**
   * Show all elements
   */
  showAll(): void {
    for (const el of this.elements) {
      el.visible = true;
    }
  }

  /**
   * Hide all elements
   */
  hideAll(): void {
    for (const el of this.elements) {
      el.visible = false;
    }
  }

  /**
   * Clear all elements
   */
  clear(): void {
    this.elements = [];
  }

  /**
   * Get element count
   */
  getCount(): number {
    return this.elements.length;
  }
}

// ============================================================================
// UI Theme Constants
// ============================================================================

/**
 * Default UI theme colors
 * Customize for your game by spreading and overriding values
 */
export const UI_THEME = {
  // Backgrounds
  background: '#111827',
  surface: '#1f2937',
  surfaceHover: '#374151',

  // Borders
  border: '#374151',
  borderLight: '#4b5563',

  // Text
  text: '#f9fafb',
  textMuted: '#9ca3af',
  textDim: '#6b7280',

  // Primary (buttons, highlights)
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryActive: '#1d4ed8',

  // Status bars (semantic colors)
  health: '#22c55e',
  healthLow: '#ef4444',
  mana: '#3b82f6',
  stamina: '#eab308',
  xp: '#a855f7',

  // Font
  font: {
    family: 'system-ui, -apple-system, sans-serif',
    sizeXs: 10,
    sizeSm: 12,
    sizeMd: 14,
    sizeLg: 18,
    sizeXl: 24,
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },

  // Border radius
  radius: {
    sm: 4,
    md: 6,
    lg: 8,
    full: 9999,
  },
} as const;

export type UITheme = typeof UI_THEME;
