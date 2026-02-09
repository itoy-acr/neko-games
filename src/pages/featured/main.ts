// Change this to feature a different game without touching LP (iframe src stays /featured/).
import { startGameA } from "../games/game-a/game";

const mount = document.getElementById("mount")!;
startGameA(mount);
