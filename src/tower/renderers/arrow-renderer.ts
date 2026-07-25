/**
 * Arrow Tower Renderer
 *
 * Wooden crossbow turret: octagonal base (static), bowstring + arrow (rotates toward target).
 * Upgrades add carved notches and a golden crown.
 *
 * 2.5D: base sits at (x, y), turret parts elevated by heightOffset with a soft drop shadow.
 */

import { MakkoEngine } from '@makko/engine';
import { TowerRenderer, TowerRenderContext } from './tower-renderer';

/** Pre-computed unit octagon vertices */
const OCTAGON_UNIT = Array.from({ length: 8 }, (_, i) => {
  const a = (Math.PI / 4) * i - Math.PI / 8;
  return { x: Math.cos(a), y: Math.sin(a) };
});

export class ArrowRenderer implements TowerRenderer {
  private octPoints = Array.from({ length: 8 }, () => ({ x: 0, y: 0 }));

  render(ctx: TowerRenderContext): void {
    const display = MakkoEngine.display;
    const { x, y, color, level, angle } = ctx;
    const h = ctx.heightOffset ?? 0;
    const turretY = y - h;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    // === DROP SHADOW (under the elevated turret) ===
    if (h > 0) {
      display.drawEllipse(x, y + 2, 16, 5, {
        fill: '#000000',
        alpha: 0.35,
      });
    }

    // === STATIC BASE ===
    for (let i = 0; i < 8; i++) {
      this.octPoints[i].x = x + 14 * OCTAGON_UNIT[i].x;
      this.octPoints[i].y = y + 14 * OCTAGON_UNIT[i].y;
    }
    display.drawPolygon(this.octPoints, { fill: '#2a1a0a' });

    for (let i = 0; i < 8; i++) {
      this.octPoints[i].x = x + 11 * OCTAGON_UNIT[i].x;
      this.octPoints[i].y = y + 11 * OCTAGON_UNIT[i].y;
    }
    display.drawPolygon(this.octPoints, { fill: color });

    display.drawLine(x - 8, y - 2, x + 8, y - 2, { stroke: '#1a0e05', lineWidth: 1, alpha: 0.2 });
    display.drawLine(x - 6, y + 3, x + 6, y + 3, { stroke: '#1a0e05', lineWidth: 1, alpha: 0.2 });

    // === ROTATING TURRET (elevated) ===
    const tx = x;
    const ty = turretY;

    // Bow arms
    const alx = tx + -5 * c - -6 * s;
    const aly = ty + -5 * s + -6 * c;
    const arx = tx + -5 * c - 6 * s;
    const ary = ty + -5 * s + 6 * c;
    const fwdX = tx + 7 * c;
    const fwdY = ty + 7 * s;
    display.drawLine(alx, aly, fwdX, fwdY, { stroke: '#D4A96A', lineWidth: 2 });
    display.drawLine(arx, ary, fwdX, fwdY, { stroke: '#D4A96A', lineWidth: 2 });

    // Bowstring
    display.drawLine(alx, aly, arx, ary, { stroke: '#CCAA77', lineWidth: 1, alpha: 0.7 });

    // Arrow shaft
    const shaftBackX = tx + -3 * c;
    const shaftBackY = ty + -3 * s;
    const shaftFwdX = tx + 8 * c;
    const shaftFwdY = ty + 8 * s;
    display.drawLine(shaftBackX, shaftBackY, shaftFwdX, shaftFwdY, { stroke: '#D4A96A', lineWidth: 1.5 });

    // Arrow tip
    const tipX = tx + 11 * c;
    const tipY = ty + 11 * s;
    const flL_x = tx + 8 * c - -2.5 * s;
    const flL_y = ty + 8 * s + -2.5 * c;
    const flR_x = tx + 8 * c - 2.5 * s;
    const flR_y = ty + 8 * s + 2.5 * c;
    display.drawLine(tipX, tipY, flL_x, flL_y, { stroke: '#FFD700', lineWidth: 1.5 });
    display.drawLine(tipX, tipY, flR_x, flR_y, { stroke: '#FFD700', lineWidth: 1.5 });

    // === UPGRADE INDICATORS ===
    if (level >= 1) {
      display.drawLine(x - 12, y - 8, x - 8, y - 8, { stroke: '#FFD700', lineWidth: 1.5, alpha: 0.7 });
      display.drawLine(x + 8, y - 8, x + 12, y - 8, { stroke: '#FFD700', lineWidth: 1.5, alpha: 0.7 });
    }

    if (level >= 2) {
      for (let i = 0; i < 8; i++) {
        this.octPoints[i].x = x + 16 * OCTAGON_UNIT[i].x;
        this.octPoints[i].y = y + 16 * OCTAGON_UNIT[i].y;
      }
      display.drawPolygon(this.octPoints, { stroke: '#FFD700', lineWidth: 1.5, alpha: 0.6 });
      display.drawCircle(x, y, 6, { fill: '#FFD700', alpha: 0.15 });
    }
  }
}
