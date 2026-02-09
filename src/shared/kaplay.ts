import kaplay, { type KAPLAYOpt } from "kaplay";

export const DEFAULT_GAME_WIDTH = 360;
export const DEFAULT_GAME_HEIGHT = 780;

export function initKaplay(extra?: Partial<KAPLAYOpt>) {
  const dpr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);

  // "touchToMouse" helps unify touch/mouse in many cases.
  return kaplay({
    width: DEFAULT_GAME_WIDTH,
    height: DEFAULT_GAME_HEIGHT,
    letterbox: true,
    scale: 1,
    pixelDensity: dpr,
    background: [16, 18, 24],
    touchToMouse: true,
    ...extra,
  });
}

export function setupMobileViewport() {
  // Prevent iOS elastic scroll within the iframe/page
  document.documentElement.style.overscrollBehavior = "none";
  document.body.style.overscrollBehavior = "none";
}
