import { startGameE } from "./game";

const mount = document.getElementById("mount");
if (!(mount instanceof HTMLElement)) {
  throw new Error("#mount element not found");
}
startGameE(mount);
