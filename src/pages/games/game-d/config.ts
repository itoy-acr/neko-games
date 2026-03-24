/** Game-D tunable parameters. Defaults can be overridden via localStorage "game-d-config". */

export type GameDConfig = {
  // Physics
  gravity: number;
  jumpForce: number;
  maxJumps: number;

  // Player
  playerStartX: number;
  playerHeight: number;
  playerCollisionW: number; // ratio of sprite width
  playerCollisionH: number; // ratio of sprite height
  playerAnimInterval: number;

  // Lives
  maxLives: number;
  invincibleDuration: number; // seconds of invincibility after hit

  // Background
  bgScrollSpeed: number;

  // Obstacles
  obstacleBaseHeight: number;
  obstacleSizeMin: number;
  obstacleSizeMax: number;
  obstacleCollisionW: number; // ratio of sprite width
  obstacleCollisionH: number; // ratio of sprite height
  obstacleAnimInterval: number;
  obstacleSpeedInitial: number;
  obstacleSpeedMax: number;
  obstacleSpeedAccel: number; // increase per spawn
  obstacleDespawnX: number;

  // Spawn timing
  spawnInitialDelay: number;
  spawnIntervalMin: number;
  spawnIntervalMax: number;
  spawnCheckInterval: number;

  // Scoring
  scorePerSecond: number;

  // Layout
  groundYRatio: number; // ratio of game height
};

const DEFAULTS: GameDConfig = {
  gravity: 1800,
  jumpForce: 720,
  maxJumps: 2,

  playerStartX: 88,
  playerHeight: 96,
  playerCollisionW: 0.6,
  playerCollisionH: 0.8,
  playerAnimInterval: 0.25,

  maxLives: 3,
  invincibleDuration: 2.0,

  bgScrollSpeed: 40,

  obstacleBaseHeight: 96,
  obstacleSizeMin: 0.6,
  obstacleSizeMax: 1.8,
  obstacleCollisionW: 0.8,
  obstacleCollisionH: 0.9,
  obstacleAnimInterval: 0.3,
  obstacleSpeedInitial: 320,
  obstacleSpeedMax: 620,
  obstacleSpeedAccel: 4,
  obstacleDespawnX: -80,

  spawnInitialDelay: 2.0,
  spawnIntervalMin: 1.5,
  spawnIntervalMax: 2.5,
  spawnCheckInterval: 0.12,

  scorePerSecond: 50,

  groundYRatio: 0.72,
};

const LS_KEY = "game-d-config";

/** Load config: defaults merged with any localStorage overrides. */
export function loadConfig(): GameDConfig {
  const config = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const overrides = JSON.parse(raw);
      for (const key of Object.keys(overrides)) {
        if (key in config) {
          (config as Record<string, unknown>)[key] = overrides[key];
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
}

/** Save current config to localStorage for tuning. */
export function saveConfig(config: Partial<GameDConfig>): void {
  localStorage.setItem(LS_KEY, JSON.stringify(config));
}

/** Reset localStorage overrides to defaults. */
export function resetConfig(): void {
  localStorage.removeItem(LS_KEY);
}
