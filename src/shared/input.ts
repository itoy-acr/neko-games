import type { KAPLAYCtx, KEventController, Vec2 } from "kaplay";

export function onTapOrClick(k: KAPLAYCtx, handler: () => void): KEventController[] {
  const controllers: KEventController[] = [];

  controllers.push(
    k.onTouchStart(() => {
      handler();
    }),
  );

  if (!k.isTouchscreen()) {
    controllers.push(
      k.onMousePress(() => {
        handler();
      }),
    );
  }

  return controllers;
}

export function onTapOrClickPos(k: KAPLAYCtx, handler: (pos: Vec2) => void): KEventController[] {
  const controllers: KEventController[] = [];

  controllers.push(
    k.onTouchStart((p) => {
      handler(p);
    }),
  );

  if (!k.isTouchscreen()) {
    controllers.push(
      k.onMousePress(() => {
        handler(k.mousePos());
      }),
    );
  }

  return controllers;
}
