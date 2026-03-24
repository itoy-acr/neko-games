import { showRetryOverlay } from "../../../shared/game-ui";
import { onTapOrClick } from "../../../shared/input";
import { initKaplay, setupMobileViewport } from "../../../shared/kaplay";
import bgUrl from "./assets/bg.png";
import hinokiAUrl from "./assets/hinoki_a.png";
import hinokiBUrl from "./assets/hinoki_b.png";
import huyunyanAUrl from "./assets/huyunyan_a.png";
import huyunyanBUrl from "./assets/huyunyan_b.png";
import ichigodaihukuAUrl from "./assets/ichigodaihuku_a.png";
import ichigodaihukuBUrl from "./assets/ichigodaihuku_b.png";
import katsuoAUrl from "./assets/katsuo_a.png";
import katsuoBUrl from "./assets/katsuo_b.png";
import sansyokudangoAUrl from "./assets/sansyokudango.png";
import sansyokudangoBUrl from "./assets/sansyokudango_b.png";
import tyamaAUrl from "./assets/tyama_a.png";
import tyamaBUrl from "./assets/tyama_b.png";
import watageAUrl from "./assets/watage_a.png";
import watageBUrl from "./assets/watage_b.png";
import { loadConfig } from "./config";
import { createConfigUI } from "./config-ui";

// Obstacle definitions: name, aspect ratio (w/h), two frame URLs
const OBSTACLES = [
  { name: "ichigodaihuku", ratio: 629 / 574, frames: [ichigodaihukuAUrl, ichigodaihukuBUrl] },
  { name: "katsuo", ratio: 563 / 709, frames: [katsuoAUrl, katsuoBUrl] },
  { name: "tyama", ratio: 528 / 696, frames: [tyamaAUrl, tyamaBUrl] },
  { name: "hinoki", ratio: 457 / 698, frames: [hinokiAUrl, hinokiBUrl] },
  { name: "huyunyan", ratio: 436 / 693, frames: [huyunyanAUrl, huyunyanBUrl] },
  { name: "sansyokudango", ratio: 654 / 623, frames: [sansyokudangoAUrl, sansyokudangoBUrl] },
] as const;

const PLAYER_RATIO = 556 / 702; // watage w/h

export function startGameD(mount?: HTMLElement) {
  setupMobileViewport();

  if (mount) {
    mount.innerHTML = `<div id="kaplay-root" style="width:100%; height:100%; display:grid; place-items:center;"></div>`;
  }

  // Use device aspect ratio to fill screen width
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const gameH = 780;
  const gameW = Math.round(gameH * (screenW / screenH));

  const k = initKaplay({
    root: mount ? (mount.querySelector("#kaplay-root") as HTMLElement) : undefined,
    width: gameW,
    height: gameH,
  });

  const {
    add,
    rect,
    pos,
    area,
    body,
    anchor,
    color,
    sprite,
    scale,
    text,
    width,
    height,
    dt,
    rand,
    randi,
    destroyAll,
    setGravity,
  } = k;

  // Load background
  k.loadSprite("bg", bgUrl);

  // Load player (watage) as 2-frame sprite sheet
  k.loadSprite("player", watageAUrl);
  k.loadSprite("player_b", watageBUrl);

  // Load obstacle sprites (each has 2 individual frames, we alternate them)
  for (const obs of OBSTACLES) {
    k.loadSprite(`${obs.name}_a`, obs.frames[0]);
    k.loadSprite(`${obs.name}_b`, obs.frames[1]);
  }

  let cleanup: Array<{ cancel: () => void }> = [];

  const track = <T extends { cancel: () => void }>(controller: T) => {
    cleanup.push(controller);
    return controller;
  };

  function resetHandlers() {
    cleanup.forEach((c) => {
      c.cancel();
    });
    cleanup = [];
  }

  function boot() {
    // Reload config each game start so localStorage tweaks apply immediately
    const cfg = loadConfig();

    resetHandlers();
    destroyAll("game");
    setGravity(cfg.gravity);

    const groundY = height() * cfg.groundYRatio;
    const playerH = cfg.playerHeight;
    const playerW = playerH * PLAYER_RATIO;

    let score = 0;
    let alive = true;
    let lives = cfg.maxLives;
    let invincibleTimer = 0;

    // Background: height-fit, horizontal scroll, looping
    const bgRatio = 3664 / 2061;
    const bgH = height();
    const bgW = bgH * bgRatio;

    const bg1 = add([sprite("bg", { width: bgW, height: bgH }), pos(0, 0), "game"]);
    const bg2 = add([sprite("bg", { width: bgW, height: bgH }), pos(bgW, 0), "game"]);

    track(
      k.onUpdate(() => {
        const move = cfg.bgScrollSpeed * dt();
        bg1.pos.x -= move;
        bg2.pos.x -= move;
        if (bg1.pos.x <= -bgW) bg1.pos.x = bg2.pos.x + bgW;
        if (bg2.pos.x <= -bgW) bg2.pos.x = bg1.pos.x + bgW;
      }),
    );

    add([
      text("Tap / Space / ↑ でジャンプ\nネコを避けてスコアを伸ばそう", { size: 16 }),
      pos(16, 16),
      color(80, 80, 80),
      "game",
    ]);

    const scoreLabel = add([
      text("0", { size: 24 }),
      pos(width() - 16, 56),
      anchor("topright"),
      color(80, 80, 80),
      "game",
    ]);

    // Lives display (hearts)
    const livesLabel = add([
      text(heartsText(lives), { size: 32 }),
      pos(width() - 16, 16),
      anchor("topright"),
      color(220, 60, 80),
      "game",
    ]);

    add([
      rect(width(), 6),
      pos(0, groundY + playerH / 2),
      anchor("topleft"),
      color(180, 200, 220),
      area(),
      body({ isStatic: true }),
      "ground",
      "game",
    ]);

    const player = add([
      sprite("player", { width: playerW, height: playerH }),
      pos(cfg.playerStartX, groundY),
      anchor("center"),
      area({
        shape: new k.Rect(
          k.vec2(0),
          playerW * cfg.playerCollisionW,
          playerH * cfg.playerCollisionH,
        ),
      }),
      body(),
      k.opacity(1),
      "player",
      "game",
      { jumpsLeft: cfg.maxJumps, frameToggle: false },
    ]);

    // Player walk animation: alternate between a/b frames
    let playerAnimTimer = 0;
    track(
      k.onUpdate(() => {
        if (!alive) return;
        playerAnimTimer += dt();
        if (playerAnimTimer >= cfg.playerAnimInterval) {
          playerAnimTimer = 0;
          player.frameToggle = !player.frameToggle;
          player.use(
            sprite(player.frameToggle ? "player_b" : "player", {
              width: playerW,
              height: playerH,
            }),
          );
        }
      }),
    );

    // Invincibility blink effect
    track(
      k.onUpdate(() => {
        if (invincibleTimer <= 0) return;
        invincibleTimer -= dt();
        // Blink: toggle opacity rapidly
        player.opacity = Math.sin(invincibleTimer * 12) > 0 ? 1 : 0.3;
        if (invincibleTimer <= 0) {
          invincibleTimer = 0;
          player.opacity = 1;
        }
      }),
    );

    let wasGrounded = false;

    function jump() {
      if (!alive || player.jumpsLeft <= 0) return;
      player.jump(cfg.jumpForce);
      player.jumpsLeft -= 1;
    }

    onTapOrClick(k, () => jump()).forEach(track);
    track(k.onKeyPress("space", jump));
    track(k.onKeyPress("up", jump));

    let spawnEvery = cfg.spawnInitialDelay;
    let obstacleSpeed = cfg.obstacleSpeedInitial;

    track(
      k.loop(cfg.spawnCheckInterval, () => {
        if (!alive) return;
        spawnEvery -= cfg.spawnCheckInterval;
        if (spawnEvery > 0) return;

        const obs = OBSTACLES[randi(0, OBSTACLES.length)];
        const s = rand(cfg.obstacleSizeMin, cfg.obstacleSizeMax);
        const obsH = cfg.obstacleBaseHeight * s;
        const obsW = obsH * obs.ratio;

        const cat = add([
          sprite(`${obs.name}_a`, { width: obsW, height: obsH }),
          pos(width() + obsW, groundY + playerH / 2),
          anchor("bot"),
          area({
            shape: new k.Rect(
              k.vec2(0),
              obsW * cfg.obstacleCollisionW,
              obsH * cfg.obstacleCollisionH,
            ),
          }),
          scale(1),
          "obstacle",
          "game",
          { animToggle: false, animTimer: 0, obsName: obs.name, obsW, obsH },
        ]);

        // Per-obstacle walk animation
        track(
          k.onUpdate(() => {
            if (!alive || !cat.exists()) return;
            cat.animTimer += dt();
            if (cat.animTimer >= cfg.obstacleAnimInterval) {
              cat.animTimer = 0;
              cat.animToggle = !cat.animToggle;
              cat.use(
                sprite(cat.animToggle ? `${cat.obsName}_b` : `${cat.obsName}_a`, {
                  width: cat.obsW,
                  height: cat.obsH,
                }),
              );
            }
          }),
        );

        spawnEvery = rand(cfg.spawnIntervalMin, cfg.spawnIntervalMax);
        obstacleSpeed = Math.min(cfg.obstacleSpeedMax, obstacleSpeed + cfg.obstacleSpeedAccel);
      }),
    );

    track(
      k.onUpdate(() => {
        if (!alive) return;

        const grounded = player.isGrounded();
        if (grounded && !wasGrounded) {
          player.jumpsLeft = cfg.maxJumps;
        }
        wasGrounded = grounded;

        score += Math.round(cfg.scorePerSecond * dt());
        scoreLabel.text = String(score);

        k.get("obstacle").forEach((o) => {
          o.move(-obstacleSpeed, 0);
          if (o.pos.x < cfg.obstacleDespawnX) o.destroy();
        });
      }),
    );

    track(
      k.onCollide("player", "obstacle", (_p, obs) => {
        if (!alive || invincibleTimer > 0) return;

        lives -= 1;
        livesLabel.text = heartsText(lives);

        // Destroy the obstacle that hit
        obs.destroy();

        if (lives <= 0) {
          alive = false;
          end();
        } else {
          // Start invincibility period
          invincibleTimer = cfg.invincibleDuration;
        }
      }),
    );

    function end() {
      const controllers = showRetryOverlay(
        k,
        { title: "GAME OVER", lines: [`score: ${score}`] },
        boot,
      );
      controllers.forEach(track);
    }
  }

  // Config UI overlay (HTML on top of canvas)
  const uiContainer = mount ? (mount.querySelector("#kaplay-root") as HTMLElement) : document.body;

  const pause = () => {
    k.debug.paused = true;
  };
  const resume = () => {
    k.debug.paused = false;
  };

  const configUI = createConfigUI(uiContainer, {
    onPause: pause,
    onClose: () => {
      configUI.close();
      resume();
    },
    onRestart: () => {
      configUI.close();
      resume();
      boot();
    },
  });

  boot();
  return k;
}

function heartsText(lives: number): string {
  return "♥".repeat(Math.max(0, lives));
}
