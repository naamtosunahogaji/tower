/**
 * Ice Tower Renderer
 *
 * Crystal spire: hexagonal base + crystal (static), frost beam (rotates toward target).
 * Upgrades add orbiting crystal facets and a frost aura.
 *
 * 2.5D: crystal drawn elevated by heightOffset with a drop shadow ellipse.
 */

import { MakkoEngine } from '@makko/engine';
import { TowerRenderer, TowerRenderContext } from './tower-renderer';

const HEX_UNIT = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 3) * i - Math.PI / 2;
  return { x: Math.cos(a), y: Math.sin(a) };
});

const CRYSTAL_UNIT = [
  { x: 0, y: -1.4 },
  { x: 0.6, y: 0 },
  { x: 0, y: 0.8 },
  { x: -0.6, y: 0 },
];

const FACET_POSITIONS = Array.from({ length: 3 }, (_, i) => {
  const a = (Math.PI * 2 / 3) * i - Math.PI / 6;
  return { x: 12 * Math.cos(a), y: 12 * Math.sin(a) };
});

export class IceRenderer implements TowerRenderer {
  private hexPoints = Array.from({ length: 6 }, () => ({ x: 0, y: 0 }));
  private crystalPoints = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));

  render(ctx: TowerRenderContext): void {
    const display = MakkoEngine.display;
    const { x, y, color, level, angle } = ctx;
    const h = ctx.heightOffset ?? 0;
    const turretY = y - h;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    // === DROP SHADOW ===
    if (h > 0) {
      display.drawEllipse(x, y + 2, 16, 5, {
        fill: '#000000',
        alpha: 0.35,
      });
    }

    // === STATIC BASE ===
    for (let i = 0; i < 6; i++) {
      this.hexPoints[i].x = x + 14 * HEX_UNIT[i].x;
      this.hexPoints[i].y = y + 14 * HEX_UNIT[i].y;
    }
    display.drawPolygon(this.hexPoints, { fill: '#1a2a3a' });

    for (let i = 0; i < 6; i++) {
      this.hexPoints[i].x = x + 11 * HEX_UNIT[i].x;
      this.hexPoints[i].y = y + 11 * HEX_UNIT[i].y;
    }
    display.drawPolygon(this.hexPoints, { fill: color, alpha: 0.8 });

    for (let i = 0; i < 6; i++) {
      display.drawLine(x, y, x + 9 * HEX_UNIT[i].x, y + 9 * HEX_UNIT[i].y, {
        stroke: '#AADDFF',
        lineWidth: 1,
        alpha: 0.2,
      });
    }

    // Vertical pedestal
    if (h > 0) {
      display.drawRect(x - 1.5, y - h, 3, h, { fill: '#2a3a4a' });
    }

    // Central crystal (elevated)
    for (let i = 0; i < 4; i++) {
      this.crystalPoints[i].x = x + 8 * CRYSTAL_UNIT[i].x;
      this.crystalPoints[i].y = turretY + 8 * CRYSTAL_UNIT[i].y;
    }
    display.drawPolygon(this.crystalPoints, { fill: '#AADDFF', alpha: 0.9 });
    display.drawCircle(x, turretY - 2, 3, { fill: '#FFFFFF', alpha: 0.3 });

    // === ROTATING PART ===
    const beamStartX = x + 4 * c;
    const beamStartY = turretY + 4 * s;
    const beamEndX = x + 14 * c;
    const beamEndY = turretY + 14 * s;
    display.drawLine(beamStartX, beamStartY, beamEndX, beamEndY, {
      stroke: '#AADDFF',
      lineWidth: 2.5,
      alpha: 0.6,
      lineCap: 'round',
    });

    const flareX = x + 13 * c;
    const flareY = turretY + 13 * s;
    display.drawCircle(flareX, flareY, 2.5, { fill: '#AADDFF', alpha: 0.4 });

    const hlFromX = x + 2 * c - -5 * s;
    const hlFromY = turretY + 2 * s + -5 * c;
    const hlToX = x + -2 * c - -2 * s;
    const hlToY = turretY + -2 * s + -2 * c;
    display.drawLine(hlFromX, hlFromY, hlToX, hlToY, { stroke: '#FFFFFF', lineWidth: 1, alpha: 0.4 });

    // === UPGRADE INDICATORS ===
    if (level >= 1) {
      for (let i = 0; i < 3; i++) {
        display.drawCircle(x + FACET_POSITIONS[i].x, y + FACET_POSITIONS[i].y, 2, { fill: '#AADDFF', alpha: 0.5 });
      }
    }

    if (level >= 2) {
      display.drawCircle(x, y, 17, { stroke: '#88CCFF', lineWidth: 1.5, alpha: 0.4 });
      display.drawCircle(x, y, 5, { fill: '#FFFFFF', alpha: 0.2, shadow: { color: '#88CCFF', blur: 6 } });
    }
  }
}
