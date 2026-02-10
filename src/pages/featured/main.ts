// Change this to feature a different game without touching LP (iframe src stays /featured/).
import { startGameD } from "../games/game-d/game";

const mount = document.getElementById("mount")!;
startGameD(mount);
