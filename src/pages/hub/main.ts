type GameDef = {
  id: string;
  title: string;
  desc: string;
  href: string;
};

const games: GameDef[] = [
  { id: "game-a", title: "Game A: Tap Dodge", desc: "タップで左右移動して落下物を避ける。30秒生存で勝ち。", href: "games/game-a/" },
  { id: "game-b", title: "Game B: Timing", desc: "バーが中央に来た瞬間にタップ。連続成功で加点。", href: "games/game-b/" },
  { id: "game-c", title: "Game C: Clicker", desc: "10秒間でどれだけ稼げるか。連打でOK。", href: "games/game-c/" },
];

const grid = document.getElementById("grid")!;

grid.innerHTML = games.map(g => `
  <a class="card" href="${g.href}">
    <div class="title">${g.title}</div>
    <div class="desc">${g.desc}</div>
  </a>
`).join("");
