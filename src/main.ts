/**
 * Entry point — boots MakkoEngine and starts the Game.
 *
 * Use this file as-is when scaffolding a new project. Do NOT hand-roll a
 * separate canvas/game-loop bootstrapper — `MakkoEngine.initEngine()` already
 * wires up the display, asset manifests, and input capture; adding parallel
 * boot logic desynchronises the engine from your scenes.
 *
 * Integration:
 *   - Pass your sprite / static-asset manifest paths to `manifests` so textures
 *     resolve before the first render.
 *   - Register any gameplay keys through `MakkoEngine.input.capture([...])`
 *     here so they're intercepted before the browser handles them.
 *   - All scene wiring belongs in `Game` (./game/game); this file stays a
 *     thin boot shim — resist adding gameplay logic here.
 */
import { MakkoEngine } from '@makko/engine';
import { Game } from './game/game';

async function main() {
  // Initialize MakkoEngine with canvas and assets
  await MakkoEngine.initEngine({
    manifests: ['/sprites-manifest.json', '/static-asset-manifest.json', '.makko/animations-manifest.json'],
    canvas: document.getElementById('gameCanvas') as HTMLCanvasElement,
    width: 1920,
    height: 1080
  });

  MakkoEngine.display.setImageSmoothing(false);  // Pixel art

  // Capture game keys
  MakkoEngine.input.capture(['Space', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

  // Initialize and start game
  const game = new Game();
  await game.init();
  game.start();
}

main().catch(console.error);
