# CLAUDE.md

## Lint & Type Check

コード変更後は必ず以下を実行すること:

```bash
npm run check    # biome check + tsc --noEmit (確認のみ)
npm run fix      # biome check --write + tsc --noEmit (自動修正)
```

## Dev Server

```bash
npm run dev      # Vite dev server (localhost:5173)
```

- 一覧ページ: `http://localhost:5173/apps/`
- ゲーム個別: `http://localhost:5173/apps/games/game-d/`
- フィーチャー（単体公開用）: `http://localhost:5173/apps/featured/` (現在 game-d)
