## 準備

- Codexを使う場合、事前にホスト側で以下のフォルダを作成しておくと、認証情報が永続化される
```bash
 mkdir -p ~/.agent/codex/test-games/.codex
```

# kaplay-arcade (multi-page)

- / : game list
- /featured/ : embed-friendly "featured game" (change in src/pages/featured/main.ts)
- /games/game-a/ ~ /games/game-e/ : standalone pages

## Setup
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy notes
If your hosting serves under a subpath (e.g. GitLab Pages project path), set `base` in `vite.config.ts`.
