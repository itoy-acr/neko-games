import { initKaplay, setupMobileViewport } from "../../../shared/kaplay";
import { showRetryOverlay } from "../../../shared/game-ui";
import { onTapOrClick } from "../../../shared/input";

export function startGameC(mount?: HTMLElement) {
  setupMobileViewport();

  if (mount) {
    mount.innerHTML = `<div id="kaplay-root" style="width:100%; height:100%; display:grid; place-items:center;"></div>`;
  }

  const k = initKaplay({
    root: mount ? (mount.querySelector("#kaplay-root") as HTMLElement) : undefined,
    letterbox: true,
  });

  const { add, rect, pos, anchor, color, text, width, height, dt, onKeyPress, destroyAll } = k;

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

    let score = 0;
    let t = 0;
    let running = true;

    add([text("10秒クリックチャレンジ", { size: 22 }), pos(20, 20), color(255, 255, 255), "game"]);
    const sc = add([text("0", { size: 26 }), pos(width() / 2, 110), anchor("center"), color(120, 220, 255), "game"]);
    const timer = add([text("10.0", { size: 20 }), pos(width() / 2, 150), anchor("center"), color(230, 230, 230), "game"]);

    add([
      rect(220, 120),
      pos(width() / 2, height() / 2),
      anchor("center"),
      color(255, 180, 120),
      k.area(),
      "btn",
      "game",
    ]);

    add([text("TAP!", { size: 38 }), pos(width() / 2, height() / 2), anchor("center"), color(20, 20, 20), "game"]);

    function hit() {
      if (!running) return;
      score += 1;
      sc.text = String(score);
    }

    onTapOrClick(k, () => {
      hit();
    }).forEach(track);
    track(onKeyPress("space", () => hit()));

    track(k.onUpdate(() => {
      if (!running) return;
      t += dt();
      const remain = Math.max(0, 10 - t);
      timer.text = remain.toFixed(1);
      if (remain <= 0) {
        running = false;
        end();
      }
    }));

    function end() {
      const controllers = showRetryOverlay(
        k,
        { title: "TIME UP!", lines: [`score: ${score}`] },
        boot,
      );
      controllers.forEach(track);
    }
  }

  boot();
  return k;
}
