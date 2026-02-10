import type { KAPLAYCtx, KEventController } from "kaplay";

export type RetryOverlayOptions = {
  title: string;
  lines?: string[];
  buttonLabel?: string;
  waitSeconds?: number;
  tag?: string;
  dialogScale?: number;
  buttonWidth?: number;
  buttonHeight?: number;
};

export function showRetryOverlay(
  k: KAPLAYCtx,
  options: RetryOverlayOptions,
  onRetry: () => void,
): KEventController[] {
  const {
    title,
    lines = [],
    buttonLabel = "リトライ",
    waitSeconds = 0.25,
    tag = "game",
    dialogScale = 0.82,
    buttonWidth,
    buttonHeight = 56,
  } = options;

  const { add, rect, pos, color, text, anchor, width, height, area } = k;

  add([rect(width(), height()), pos(0, 0), color(0, 0, 0), k.opacity(0.55), tag]);

  const dialogW = Math.round(width() * dialogScale);
  const dialogH = Math.round(height() * dialogScale);
  const dialogX = width() / 2;
  const dialogY = height() / 2;
  const dialogTop = dialogY - dialogH / 2;
  const buttonW = buttonWidth ?? Math.min(dialogW - 80, 320);
  const buttonY = dialogY + dialogH / 2 - 48;

  add([
    rect(dialogW, dialogH),
    pos(dialogX, dialogY),
    anchor("center"),
    color(20, 24, 32),
    k.opacity(0.96),
    tag,
  ]);

  add([
    text(title, { size: 28 }),
    pos(dialogX, dialogTop + 52),
    anchor("center"),
    color(255, 255, 255),
    tag,
  ]);

  if (lines.length > 0) {
    add([
      text(lines.join("\n"), { size: 18 }),
      pos(dialogX, dialogTop + 96),
      anchor("center"),
      color(230, 230, 230),
      tag,
    ]);
  }

  const button = add([
    rect(buttonW, buttonHeight),
    pos(dialogX, buttonY),
    anchor("center"),
    color(90, 110, 140),
    area(),
    tag,
  ]);

  add([
    text(buttonLabel, { size: 20 }),
    pos(dialogX, buttonY),
    anchor("center"),
    color(255, 255, 255),
    tag,
  ]);

  let retryReady = waitSeconds <= 0;
  let retried = false;
  const controllers: KEventController[] = [];

  if (!retryReady) {
    controllers.push(
      k.wait(waitSeconds, () => {
        retryReady = true;
      }),
    );
  }

  const retry = () => {
    if (!retryReady || retried) return;
    retried = true;
    onRetry();
  };

  controllers.push(
    button.onClick(retry),
    k.onTouchStart((p) => {
      if (!retryReady || retried) return;
      if (button.hasPoint(p)) retry();
    }),
    k.onKeyPress("enter", retry),
  );

  return controllers;
}
