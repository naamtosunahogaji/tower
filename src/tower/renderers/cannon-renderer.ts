/**
 * Cannon Tower Renderer
 *
 * Heavy mortar: square base plate + rivets (static), barrel + muzzle (rotates toward target).
 * Upgrades add side armor and barrel heat glow.
 *
 * 2.5D: base sits at (x, y), barrel elevated by heightOffset with a soft drop shadow.
 */

import { MakkoEngine } from '@makko/engine';
import { TowerRenderer, TowerRenderContext } from './tower-renderer';

export class CannonRenderer implements TowerRenderer {
  render(ctx: TowerRenderContext): void {
    const display = MakkoEngine.display;
    const { x, y, color, level, angle } = ctx;
    const h = ctx.heightOffset ?? 0;
    const turretY = y - h;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    // === DROP SHADOW ===
    if (h > 0) {
      display.drawEllipse(x, y + 2, 18, 6, {
        fill: '#000000',
        alpha: 0.4,
      });
    }

    // === STATIC BASE ===
    display.drawRoundRect(x - 14, y - 14, 28, 28, 3, { fill: '#1a1a1a' });
    display.drawRoundRect(x - 11, y - 11, 22, 22, 2, { fill: color });

    display.drawLine(x - 10, y - 10, x + 10, y + 10, { stroke: '#2a2a2a', lineWidth: 2, alpha: 0.4 });
    display.drawLine(x + 10, y - 10, x - 10, y + 10, { stroke: '#2a2a2a', lineWidth: 2, alpha: 0.4 });

    const rivetOff = 9;
    const rivetR = 1.5;
    display.drawCircle(x - rivetOff, y - rivetOff, rivetR, { fill: '#888888' });
    display.drawCircle(x + rivetOff, y - rivetOff, rivetR, { fill: '#888888' });
    display.drawCircle(x - rivetOff, y + rivetOff, rivetR, { fill: '#888888' });
    display.drawCircle(x + rivetOff, y + rivetOff, rivetR, { fill: '#888888' });

    // === ROTATING TURRET (elevated) ===
    const tx = x;
    const ty = turretY;

    // Vertical post connecting base to turret (gives a real sense of height)
    if (h > 0) {
      display.drawRect(x - 2, y - h, 4, h, { fill: '#2a2a2a' });
    }

    // Central turret ring (at elevated turret position)
    display.drawCircle(tx, ty, 7, { fill: '#2a2a2a' });
    display.drawCircle(tx, ty, 5, { fill: color });

    // Barrel
    const barrelEndX = tx + 14 * c;
    const barrelEndY = ty + 14 * s;
    display.drawLine(tx, ty, barrelEndX, barrelEndY, { stroke: '#2a2a2a', lineWidth: 6, lineCap: 'round' });
    display.drawLine(tx, ty, barrelEndX, barrelEndY, { stroke: color, lineWidth: 4, lineCap: 'round' });

    // Muzzle
    const mzL_x = tx + 14 * c - -4 * s;
    const mzL_y = ty + 14 * s + -4 * c;
    const mzR_x = tx + 14 * c - 4 * s;
    const mzR_y = ty + 14 * s + 4 * c;
    display.drawLine(mzL_x, mzL_y, mzR_x, mzR_y, { stroke: '#3a3a3a', lineWidth: 2 });

    // === UPGRADE INDICATORS ===
    if (level >= 1) {
      display.drawRoundRect(x - 16, y - 6, 4, 12, 1, { fill: '#888888', alpha: 0.6 });
      display.drawRoundRect(x + 12, y - 6, 4, 12, 1, { fill: '#888888', alpha: 0.6 });
    }

    if (level >= 2) {
      const glowX = tx + 13 * c;
      const glowY = ty + 13 * s;
      display.drawCircle(glowX, glowY, 3, { fill: '#FF6644', alpha: 0.4 });
      display.drawRoundRect(x - 16, y - 16, 32, 32, 4, { stroke: '#FF6644', lineWidth: 1.5, alpha: 0.4 });
    }
  }
}
