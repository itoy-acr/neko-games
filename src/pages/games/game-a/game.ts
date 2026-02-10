import { initKaplay, setupMobileViewport } from "../../../shared/kaplay";
import { showRetryOverlay } from "../../../shared/game-ui";
import { onTapOrClickPos } from "../../../shared/input";

export function startGameA(mount?: HTMLElement) {
  setupMobileViewport();

  if (mount) {
    mount.innerHTML = `<div id="kaplay-root" style="width:100%; height:100%; display:grid; place-items:center;"></div>`;
  }

  const k = initKaplay({
    // Mount canvas into provided element if present; otherwise body.
    root: mount ? (mount.querySelector("#kaplay-root") as HTMLElement) : undefined,
  });

  const { add, rect, pos, area, body, anchor, color, text, vec2, width, height, dt, rand, onKeyPress, onUpdate, destroyAll, camPos, setGravity } = k;

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
    setGravity(1600);
    camPos(vec2(width() / 2, height() / 2));

    add([
      text("Tap / ← → で移動\n落下物を避ける（30秒）", { size: 18 }),
      pos(20, 20),
      color(230, 230, 230),
      "game",
    ]);

    const player = add([
      text("🐱", { size: 40 }),
      pos(width() / 2, height() - 90),
      area(),
      body({ isStatic: true }),
      anchor("center"),
      "player",
      "game",
      { dir: 0 as -1 | 0 | 1 },
    ]);

    const groundY = height() - 30;

    let t = 0;
    let alive = true;

    const timer = add([
      text("30.0", { size: 20 }),
      pos(width() - 80, 20),
      color(255, 255, 255),
      "game",
    ]);

    function spawnRock() {
      const x = rand(30, width() - 30);
      add([
        rect(22, 22),
        pos(x, -20),
        area(),
        body(),
        anchor("center"),
        color(255, 160, 120),
        "rock",
        "game",
      ]);
    }

    // input
    track(onKeyPress("left", () => (player.dir = -1)));
    track(onKeyPress("right", () => (player.dir = 1)));
    track(onKeyPress("space", () => (player.dir = 0)));

    onTapOrClickPos(k, (p) => {
      const dx = p.x - player.pos.x;
      if (Math.abs(dx) <= 6) {
        player.dir = 0;
      } else {
        player.dir = dx < 0 ? -1 : 1;
      }
    }).forEach(track);
    track(k.onMouseRelease(() => {
      player.dir = 0;
    }));
    track(k.onTouchEnd(() => {
      player.dir = 0;
    }));

    const spawnInterval = 0.45;
    let nextSpawnIn = rand(0.5, 1.0);

    track(onUpdate(() => {
      if (!alive) return;

      // move
      const speed = 360;
      player.pos.x += player.dir * speed * dt();
      player.pos.x = Math.max(30, Math.min(width() - 30, player.pos.x));

      // spawn with a short grace period after boot / retry
      nextSpawnIn -= dt();
      if (nextSpawnIn <= 0) {
        spawnRock();
        nextSpawnIn = spawnInterval;
      }

      // rocks cleanup
      k.get("rock").forEach((r) => {
        if (r.pos.y > groundY) r.destroy();
      });

      // countdown
      t += dt();
      const remain = Math.max(0, 30 - t);
      timer.text = remain.toFixed(1);
      if (remain <= 0) {
        alive = false;
        end("CLEAR! 30秒生存");
      }
    }));

    track(k.onCollide("player", "rock", () => {
      if (!alive) return;
      alive = false;
      end("GAME OVER");
    }));

    function end(msg: string) {
      const controllers = showRetryOverlay(k, { title: msg }, boot);
      controllers.forEach(track);

      // reset dir so it doesn't drift on restart
      player.dir = 0;
    }
  }

  boot();
  return k;
}
