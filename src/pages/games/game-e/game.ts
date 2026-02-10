import type { GameObj, PosComp } from "kaplay";
import { showRetryOverlay } from "../../../shared/game-ui";
import { onTapOrClickPos } from "../../../shared/input";
import { initKaplay, setupMobileViewport } from "../../../shared/kaplay";

type CatVisualObj = GameObj<PosComp>;

type Cat = {
  id: number;
  level: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornAt: number;
  ball: CatVisualObj;
  face: CatVisualObj;
};

const CAT_FACES = ["🐱", "😸", "😺", "😻", "😽", "🙀", "😿", "😾", "🐯"];
const CAT_RADII = [24, 34, 46, 60, 74, 88, 102, 116, 130];
const CAT_COLORS: Array<[number, number, number]> = [
  [251, 231, 196],
  [252, 207, 153],
  [255, 184, 148],
  [246, 160, 139],
  [238, 149, 161],
  [212, 158, 210],
  [170, 172, 229],
  [138, 190, 235],
  [112, 210, 208],
];
const CAT_POINTS = [10, 20, 40, 80, 160, 320, 640, 1280, 2560];

const GRAVITY = 0.34;
const AIR_FRICTION = 0.995;
const WALL_BOUNCE = 0.42;
const GROUND_BOUNCE = 0.2;
const RESTITUTION = 0.22;
const MAX_VELOCITY = 9;
const SOLVER_PASSES = 6;
const DROP_INTERVAL_SECONDS = 0.48;

export function startGameE(mount?: HTMLElement) {
  setupMobileViewport();

  if (mount) {
    mount.innerHTML = `<div id="kaplay-root" style="width:100%; height:100%; display:grid; place-items:center;"></div>`;
  }

  const k = initKaplay({
    root: mount ? (mount.querySelector("#kaplay-root") as HTMLElement) : undefined,
  });

  const {
    add,
    rect,
    circle,
    pos,
    anchor,
    color,
    text,
    opacity,
    z,
    width,
    height,
    rand,
    dt,
    destroyAll,
  } = k;

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
    resetHandlers();
    destroyAll("game");

    const wall = 20;
    const fieldTop = 118;
    const fieldBottom = height() - 42;
    const dangerY = fieldTop + 56;
    const spawnY = fieldTop - 24;

    let score = 0;
    let peakLevel = 0;
    let alive = true;
    let timeElapsed = 0;
    let dropCooldown = 0;
    let overDangerTime = 0;
    let nextId = 1;

    let cursorX = width() / 2;
    let nextLevel = randSmallLevel();

    const cats: Cat[] = [];

    add([
      text("ネコスイカ: 同じネコを合体", { size: 19 }),
      pos(16, 10),
      color(255, 255, 255),
      "game",
    ]);
    add([
      text("Tap/Space: 落とす  ←→: 位置調整", { size: 14 }),
      pos(16, 34),
      color(210, 216, 230),
      "game",
    ]);

    const scoreLabel = add([
      text("Score 0", { size: 20 }),
      pos(width() - 12, 14),
      anchor("topright"),
      color(255, 255, 255),
      z(200),
      "game",
    ]);

    const nextLabel = add([
      text("NEXT", { size: 14 }),
      pos(width() - 12, 42),
      anchor("topright"),
      color(220, 225, 235),
      z(200),
      "game",
    ]);

    const nextBall = add([
      circle(18),
      pos(width() - 42, 76),
      color(...CAT_COLORS[nextLevel]),
      opacity(0.9),
      z(200),
      "game",
    ]);

    const nextFace = add([
      text(CAT_FACES[nextLevel], { size: 18 }),
      pos(width() - 42, 76),
      anchor("center"),
      z(201),
      "game",
    ]);

    add([
      rect(width(), 2),
      pos(0, dangerY),
      anchor("topleft"),
      color(245, 112, 112),
      opacity(0.65),
      "game",
    ]);
    add([
      rect(width() - wall * 2, fieldBottom - fieldTop),
      pos(wall, fieldTop),
      anchor("topleft"),
      color(30, 36, 52),
      opacity(0.9),
      "game",
    ]);
    add([
      rect(wall, fieldBottom - fieldTop + 44),
      pos(0, fieldTop),
      anchor("topleft"),
      color(78, 86, 112),
      "game",
    ]);
    add([
      rect(wall, fieldBottom - fieldTop + 44),
      pos(width() - wall, fieldTop),
      anchor("topleft"),
      color(78, 86, 112),
      "game",
    ]);
    add([
      rect(width() - wall * 2, 36),
      pos(wall, fieldBottom),
      anchor("topleft"),
      color(96, 108, 140),
      "game",
    ]);
    add([
      rect(width() - wall * 2, 8),
      pos(wall, fieldBottom),
      anchor("topleft"),
      color(120, 132, 164),
      opacity(0.9),
      "game",
    ]);

    const guide = add([
      rect(4, fieldBottom - fieldTop + 4),
      pos(cursorX, fieldTop - 2),
      anchor("top"),
      color(200, 220, 255),
      opacity(0.55),
      "game",
    ]);

    function randSmallLevel() {
      const r = rand(0, 1);
      if (r < 0.35) return 0;
      if (r < 0.65) return 1;
      if (r < 0.87) return 2;
      return 3;
    }

    function clamp(v: number, min: number, max: number) {
      return Math.max(min, Math.min(max, v));
    }

    function clampX(x: number, radius: number) {
      return clamp(x, wall + radius + 2, width() - wall - radius - 2);
    }

    function updateNextPreview() {
      nextLabel.text = "NEXT";
      nextBall.radius = Math.max(14, CAT_RADII[nextLevel] * 0.55);
      nextBall.color = k.rgb(...CAT_COLORS[nextLevel]);
      nextFace.text = CAT_FACES[nextLevel];
    }

    function refreshScore() {
      scoreLabel.text = `Score ${score}`;
    }

    function createCat(level: number, x: number, y: number, vx = 0, vy = 0) {
      const radius = CAT_RADII[level];
      const ball = add([
        circle(radius),
        pos(clampX(x, radius), y),
        anchor("center"),
        color(...CAT_COLORS[level]),
        "game",
      ]) as CatVisualObj;

      const face = add([
        text(CAT_FACES[level], { size: Math.max(20, radius * 0.95) }),
        pos(ball.pos.x, ball.pos.y),
        anchor("center"),
        "game",
      ]) as CatVisualObj;

      const cat: Cat = {
        id: nextId++,
        level,
        x: ball.pos.x,
        y,
        vx,
        vy,
        bornAt: timeElapsed,
        ball,
        face,
      };
      cats.push(cat);
      return cat;
    }

    function destroyCat(cat: Cat) {
      cat.ball.destroy();
      cat.face.destroy();
      const idx = cats.findIndex((c) => c.id === cat.id);
      if (idx >= 0) cats.splice(idx, 1);
    }

    function mergeCats(a: Cat, b: Cat) {
      const mergedLevel = Math.min(CAT_FACES.length - 1, a.level + 1);
      const x = (a.x + b.x) * 0.5;
      const y = Math.min(a.y, b.y);

      destroyCat(a);
      destroyCat(b);
      createCat(mergedLevel, x, y, 0, 0);

      score += CAT_POINTS[mergedLevel] ?? (mergedLevel + 1) * (mergedLevel + 1) * 5;
      peakLevel = Math.max(peakLevel, mergedLevel);
      refreshScore();
    }

    function endGame() {
      alive = false;
      showRetryOverlay(
        k,
        {
          title: "GAME OVER",
          lines: [`score: ${score}`, `largest cat: Lv.${peakLevel + 1}`],
        },
        boot,
      ).forEach(track);
    }

    function tryDrop(x?: number) {
      if (!alive || dropCooldown > 0) return;
      const radius = CAT_RADII[nextLevel];
      if (typeof x === "number") cursorX = clampX(x, radius);

      createCat(nextLevel, cursorX, spawnY, 0, 0);
      nextLevel = randSmallLevel();
      updateNextPreview();
      dropCooldown = DROP_INTERVAL_SECONDS;
    }

    function updatePhysics(step: number) {
      for (const cat of cats) {
        cat.vy += GRAVITY * step;
        cat.vx *= AIR_FRICTION ** step;
        cat.vx = clamp(cat.vx, -MAX_VELOCITY, MAX_VELOCITY);
        cat.vy = clamp(cat.vy, -MAX_VELOCITY, MAX_VELOCITY);

        cat.x += cat.vx * step;
        cat.y += cat.vy * step;

        const r = CAT_RADII[cat.level];

        if (cat.x - r < wall) {
          cat.x = wall + r;
          cat.vx = Math.abs(cat.vx) * WALL_BOUNCE;
        }
        if (cat.x + r > width() - wall) {
          cat.x = width() - wall - r;
          cat.vx = -Math.abs(cat.vx) * WALL_BOUNCE;
        }
        if (cat.y + r > fieldBottom) {
          cat.y = fieldBottom - r;
          cat.vy = -Math.abs(cat.vy) * GROUND_BOUNCE;
          if (Math.abs(cat.vy) < 0.28) cat.vy = 0;
        }
      }
    }

    function resolveCollisionsAndMerge() {
      let mergeCandidate: [Cat, Cat] | null = null;

      for (let pass = 0; pass < SOLVER_PASSES; pass += 1) {
        for (let i = 0; i < cats.length; i += 1) {
          for (let j = i + 1; j < cats.length; j += 1) {
            const a = cats[i];
            const b = cats[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const ra = CAT_RADII[a.level];
            const rb = CAT_RADII[b.level];
            const minDist = ra + rb;

            if (dist >= minDist) continue;

            if (!mergeCandidate && a.level === b.level && a.level < CAT_FACES.length - 1) {
              const relVx = a.vx - b.vx;
              const relVy = a.vy - b.vy;
              const relSpeed = Math.hypot(relVx, relVy);
              if (relSpeed < 4.5) {
                mergeCandidate = [a, b];
              }
            }

            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            const ma = ra * ra;
            const mb = rb * rb;
            const totalMass = ma + mb;

            // Slightly over-correct overlap to reduce persistent sinking.
            const separation = overlap * 1.04;
            a.x += nx * separation * (mb / totalMass);
            a.y += ny * separation * (mb / totalMass);
            b.x -= nx * separation * (ma / totalMass);
            b.y -= ny * separation * (ma / totalMass);

            const rvx = a.vx - b.vx;
            const rvy = a.vy - b.vy;
            const velAlongNormal = rvx * nx + rvy * ny;
            if (velAlongNormal > 0) continue;

            const impulse = (-(1 + RESTITUTION) * velAlongNormal) / (1 / ma + 1 / mb);
            const ix = impulse * nx;
            const iy = impulse * ny;

            a.vx += ix / ma;
            a.vy += iy / ma;
            b.vx -= ix / mb;
            b.vy -= iy / mb;
          }
        }
      }

      // Constrain at the very end to avoid unnatural "teleport" during pair resolution.
      for (const cat of cats) {
        const r = CAT_RADII[cat.level];
        if (cat.x - r < wall) {
          cat.x = wall + r;
          if (cat.vx < 0) cat.vx *= -0.35;
        }
        if (cat.x + r > width() - wall) {
          cat.x = width() - wall - r;
          if (cat.vx > 0) cat.vx *= -0.35;
        }
        if (cat.y + r > fieldBottom) {
          cat.y = fieldBottom - r;
          if (cat.vy > 0) cat.vy *= -0.2;
        }
      }

      if (mergeCandidate) {
        mergeCats(mergeCandidate[0], mergeCandidate[1]);
      }
    }

    function syncVisuals() {
      for (const cat of cats) {
        cat.ball.pos = k.vec2(cat.x, cat.y);
        cat.face.pos = k.vec2(cat.x, cat.y);
      }
    }

    onTapOrClickPos(k, (p) => tryDrop(p.x)).forEach(track);

    track(
      k.onMouseMove((p) => {
        if (!alive) return;
        cursorX = clampX(p.x, CAT_RADII[nextLevel]);
      }),
    );

    track(
      k.onTouchMove((p) => {
        if (!alive) return;
        cursorX = clampX(p.x, CAT_RADII[nextLevel]);
      }),
    );

    track(
      k.onKeyDown("left", () => {
        if (!alive) return;
        cursorX = clampX(cursorX - 320 * dt(), CAT_RADII[nextLevel]);
      }),
    );

    track(
      k.onKeyDown("right", () => {
        if (!alive) return;
        cursorX = clampX(cursorX + 320 * dt(), CAT_RADII[nextLevel]);
      }),
    );

    track(k.onKeyPress("space", () => tryDrop()));
    track(k.onKeyPress("enter", () => tryDrop()));

    track(
      k.onUpdate(() => {
        if (!alive) return;

        const step = Math.min(2.2, dt() * 60);
        timeElapsed += dt();
        dropCooldown = Math.max(0, dropCooldown - dt());
        guide.pos.x = clampX(cursorX, CAT_RADII[nextLevel]);

        updatePhysics(step);
        resolveCollisionsAndMerge();
        syncVisuals();

        let dangerFound = false;
        for (const cat of cats) {
          const radius = CAT_RADII[cat.level];
          if (timeElapsed - cat.bornAt > 1.0 && cat.y - radius < dangerY) {
            dangerFound = true;
            break;
          }
        }

        overDangerTime = dangerFound
          ? overDangerTime + dt()
          : Math.max(0, overDangerTime - dt() * 2);

        if (overDangerTime >= 1.2) endGame();
      }),
    );

    refreshScore();
    updateNextPreview();
  }

  boot();
  return k;
}
