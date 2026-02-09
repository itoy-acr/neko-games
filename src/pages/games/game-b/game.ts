import { initKaplay, setupMobileViewport } from "../../../shared/kaplay";
import { onTapOrClick } from "../../../shared/input";

export function startGameB(mount?: HTMLElement) {
  setupMobileViewport();

  if (mount) {
    mount.innerHTML = `<div id="kaplay-root" style="width:100%;height:100%;display:grid;place-items:center;"></div>`;
  }

  const k = initKaplay({
    root: mount ? (mount.querySelector("#kaplay-root") as HTMLElement) : undefined,
  });

  const { add, rect, pos, anchor, color, text, width, height, dt, onKeyPress, destroyAll, rand } = k;

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
    let speed = 1.25;
    let dir = 1;
    let x = 40;

    add([text("中央でタップ！", { size: 22 }), pos(20, 20), color(255, 255, 255), "game"]);
    const sc = add([text("0", { size: 22 }), pos(width() - 60, 20), color(255, 255, 255), "game"]);

    add([rect(width() - 80, 16), pos(40, height() / 2), color(60, 70, 90), "game"]);
    add([rect(6, 28), pos(width() / 2 - 3, height() / 2 - 6), color(120, 220, 255), "game"]);
    const cursor = add([rect(18, 36), pos(x, height() / 2 - 10), color(255, 180, 120), "game"]);

    function tap() {
      // scoring window near center
      const cx = cursor.pos.x + 9;
      const dist = Math.abs(cx - width() / 2);
      const ok = dist < 22;

      if (ok) {
        score += 10;
        speed = Math.min(3.0, speed + 0.08);
      } else {
        score = Math.max(0, score - 5);
        speed = Math.max(1.0, speed - 0.12);
      }

      sc.text = String(score);

      // small random nudge
      cursor.pos.x += rand(-10, 10);
    }

    onTapOrClick(k, () => {
      tap();
    }).forEach(track);
    track(onKeyPress("space", () => tap()));
    track(onKeyPress("enter", () => tap()));

    track(k.onUpdate(() => {
      x += dir * 320 * speed * dt();
      if (x < 40) { x = 40; dir = 1; }
      if (x > width() - 80 - 18) { x = width() - 80 - 18; dir = -1; }
      cursor.pos.x = x;
    }));

    add([text("Tapで判定 / SpaceでもOK\n外すと減点", { size: 16 }), pos(20, height() - 70), color(230, 230, 230), "game"]);
  }

  boot();
  return k;
}
