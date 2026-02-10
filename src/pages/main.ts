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
  { id: "game-d", title: "Game D: Jump Runner", desc: "ジャンプで障害物を避け続けるランゲーム。", href: "games/game-d/" },
];

const grid = document.getElementById("grid")!;

grid.innerHTML = games
  .map(
    g => `
  <a class="block rounded-xl border border-sky-300 bg-sky-200 p-3.5 text-slate-900 no-underline shadow-[0_8px_30px_rgba(2,6,23,0.25)] transition duration-150 ease-out hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-300" href="${g.href}">
    <div class="mb-1.5 font-bold">${g.title}</div>
    <div class="text-sm leading-[1.35] text-slate-700">${g.desc}</div>
  </a>
`
  )
  .join("");
