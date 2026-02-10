import { initKaplay, setupMobileViewport } from "../../../shared/kaplay";
import { showRetryOverlay } from "../../../shared/game-ui";
import { onTapOrClick } from "../../../shared/input";

export function startGameD(mount?: HTMLElement) {
  setupMobileViewport();

  if (mount) {
    mount.innerHTML = `<div id="kaplay-root" style="width:100%; height:100%; display:grid; place-items:center;"></div>`;
  }

  const k = initKaplay({
    root: mount ? (mount.querySelector("#kaplay-root") as HTMLElement) : undefined,
  });

  const { add, rect, pos, area, body, anchor, color, text, width, height, dt, rand, destroyAll, setGravity } = k;

  let cleanup: Array<{ cancel: () => void }> = [];

  const track = <T extends { cancel: () => void }>(controller: T) => {
    cleanup.push(controller);
    return controller;
  };

  function resetHandlers() {
    cleanup.forEach((c) => c.cancel());
    cleanup = [];
  }

  function boot() {
    resetHandlers();
    destroyAll("game");
    setGravity(1800);

    const groundY = height() - 90;
    const playerStartX = 88;
    const playerSize = 40;

    let score = 0;
    let alive = true;

    add([
      text("Tap / Space / ↑ でジャンプ\n障害物を避けてスコアを伸ばそう", { size: 16 }),
      pos(16, 16),
      color(230, 230, 230),
      "game",
    ]);

    const scoreLabel = add([
      text("0", { size: 24 }),
      pos(width() - 16, 56),
      anchor("topright"),
      color(255, 255, 255),
      "game",
    ]);

    add([
      rect(width(), 6),
      pos(0, groundY + playerSize / 2),
      anchor("topleft"),
      color(70, 88, 120),
      area(),
      body({ isStatic: true }),
      "ground",
      "game",
    ]);

    const player = add([
      text("🐱", { size: 40 }),
      pos(playerStartX, groundY),
      anchor("center"),
      area(),
      body(),
      "player",
      "game",
      { jumpsLeft: 2 },
    ]);

    let wasGrounded = false;

    function jump() {
      if (!alive || player.jumpsLeft <= 0) return;
      player.jump(720);
      player.jumpsLeft -= 1;
    }

    onTapOrClick(k, () => jump()).forEach(track);
    track(k.onKeyPress("space", jump));
    track(k.onKeyPress("up", jump));

    const spawnBase = 1.1;
    let spawnEvery = spawnBase;
    let obstacleSpeed = 320;

    track(k.loop(0.12, () => {
      if (!alive) return;
      spawnEvery -= 0.12;
      if (spawnEvery > 0) return;

      const h = rand(42, 96);
      const w = rand(24, 38);

      add([
        rect(w, h),
        pos(width() + w, groundY + playerSize / 2),
        anchor("botleft"),
        area(),
        color(255, 170, 120),
        "obstacle",
        "game",
      ]);

      spawnEvery = rand(0.75, 1.25);
      obstacleSpeed = Math.min(620, obstacleSpeed + 4);
    }));

    track(k.onUpdate(() => {
      if (!alive) return;

      const grounded = player.isGrounded();
      if (grounded && !wasGrounded) {
        player.jumpsLeft = 2;
      }
      wasGrounded = grounded;

      score += Math.round(50 * dt());
      scoreLabel.text = String(score);

      k.get("obstacle").forEach((o) => {
        o.move(-obstacleSpeed, 0);
        if (o.pos.x < -80) o.destroy();
      });
    }));

    track(k.onCollide("player", "obstacle", () => {
      if (!alive) return;
      alive = false;
      end();
    }));

    function end() {
      const controllers = showRetryOverlay(
        k,
        { title: "GAME OVER", lines: [`score: ${score}`] },
        boot,
      );
      controllers.forEach(track);
    }
  }

  boot();
  return k;
}
