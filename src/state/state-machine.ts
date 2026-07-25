/**
 * State Machine System
 *
 * Finite state machine for managing game flow, enemy AI, and complex state transitions.
 * States encapsulate enter/exit logic and update behavior, making code modular and extensible.
 *
 * Usage:
 *   const gameState = new StateMachine<Game>();
 *   gameState.add('menu', { enter(game) { showMenu(); }, update(dt, game) { if (startClicked) return 'playing'; } });
 *   gameState.add('playing', { enter(game) { game.reset(); }, update(dt, game) { ... } });
 *   gameState.transition('menu', game);
 *   // In game loop: gameState.update(dt, game);
 */

export type StateId = string;

/**
 * State interface - implement for each state in your machine.
 * All methods are optional. Return a StateId from update() to trigger automatic transition.
 */
export interface State<T> {
  /** Called when entering this state */
  enter?(context: T): void;
  /** Called when exiting this state */
  exit?(context: T): void;
  /** Called every frame. Return new StateId to transition, or void to stay */
  update?(dt: number, context: T): StateId | void;
}

/**
 * Generic StateMachine - manages states and transitions.
 * Type parameter T is the context object passed to all state methods.
 */
export class StateMachine<T> {
  private states = new Map<StateId, State<T>>();
  private current: StateId | null = null;

  /** Register a state with an ID */
  add(id: StateId, state: State<T>): void {
    this.states.set(id, state);
  }

  /** Transition to a new state, calling exit on current and enter on new */
  transition(id: StateId, context: T): void {
    if (this.current) {
      this.states.get(this.current)?.exit?.(context);
    }
    this.current = id;
    this.states.get(id)?.enter?.(context);
  }

  /** Update current state. Automatically transitions if update returns a new StateId */
  update(dt: number, context: T): void {
    if (!this.current) return;
    const next = this.states.get(this.current)?.update?.(dt, context);
    if (next && next !== this.current) {
      this.transition(next, context);
    }
  }

  /** Get current state ID */
  getCurrent(): StateId | null {
    return this.current;
  }

  /** Check if currently in a specific state */
  isIn(id: StateId): boolean {
    return this.current === id;
  }
}

// ============================================================================
// Example: Game Flow States
// ============================================================================

/**
 * Common game states - use these IDs or define your own
 */
export const GameStates = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover',
} as const;

export type GameStateId = (typeof GameStates)[keyof typeof GameStates];

/**
 * Example game flow state machine setup.
 * Customize the state implementations for your game.
 *
 * Usage:
 *   const gameFlow = createGameFlowMachine();
 *   gameFlow.transition('menu', game);
 *   // In game loop: gameFlow.update(dt, game);
 */
export function createGameFlowMachine<TGame extends { reset?(): void }>(): StateMachine<TGame> {
  const machine = new StateMachine<TGame>();

  machine.add(GameStates.MENU, {
    enter() {
      // Show menu UI
    },
    update(dt, game) {
      // Return 'playing' when start button clicked
      // if (startButtonClicked()) return GameStates.PLAYING;
    },
  });

  machine.add(GameStates.PLAYING, {
    enter(game) {
      game.reset?.();
    },
    update(dt, game) {
      // Return 'gameover' when player dies
      // Return 'paused' when pause pressed
    },
  });

  machine.add(GameStates.PAUSED, {
    enter() {
      // Show pause menu
    },
    update(dt, game) {
      // Return 'playing' to resume
      // Return 'menu' to quit
    },
  });

  machine.add(GameStates.GAMEOVER, {
    enter() {
      // Show game over screen
    },
    update(dt, game) {
      // Return 'playing' to restart
      // Return 'menu' to quit
    },
  });

  return machine;
}
