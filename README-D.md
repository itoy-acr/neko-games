# Game D: Jump Runner パラメータガイド

ネコを避けてスコアを伸ばすジャンプランゲーム。

## パラメータ調整方法

ゲーム画面右下の **⚙ ボタン** を押すとパラメータ調整パネルが開く（ゲームはポーズ）。

- **保存**: 値を `localStorage` に保存。次のリスタート時に反映される。
- **リセット**: デフォルト値に戻す。
- **続き**: パネルを閉じてゲーム再開。
- **リスタート**: パネルを閉じて最初からやり直し。

`localStorage` キー: `game-d-config`

コンソールから直接設定する場合:
```js
localStorage.setItem("game-d-config", JSON.stringify({ maxLives: 5, jumpForce: 900 }))
```

## パラメータ一覧

### 物理

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `gravity` | 1800 | 重力加速度 (px/s²)。大きいほど早く落ちる |
| `jumpForce` | 720 | ジャンプの初速。大きいほど高く跳ぶ |
| `maxJumps` | 2 | 着地せずにジャンプできる回数（2 = 二段ジャンプ） |

### プレイヤー

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `playerStartX` | 88 | プレイヤーの横位置 (px) |
| `playerHeight` | 96 | プレイヤーのスプライト高さ (px) |
| `playerAnimInterval` | 0.25 | 歩きアニメのフレーム切替間隔 (秒) |

### ライフ

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `maxLives` | 3 | ミス許容回数。0 になるとゲームオーバー |
| `invincibleDuration` | 2.0 | ミス後の無敵時間 (秒)。点滅して当たり判定が無効になる |

### 背景

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `bgScrollSpeed` | 40 | 背景のスクロール速度 (px/s) |

### 障害物（ネコ）

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `obstacleBaseHeight` | 96 | 障害物の基本高さ (px)。サイズ倍率で掛け算される |
| `obstacleSizeMin` | 0.6 | 障害物サイズの最小倍率 |
| `obstacleSizeMax` | 1.8 | 障害物サイズの最大倍率 |
| `obstacleAnimInterval` | 0.3 | 障害物の歩きアニメ切替間隔 (秒) |
| `obstacleSpeedInitial` | 320 | 障害物の初期移動速度 (px/s) |
| `obstacleSpeedMax` | 620 | 障害物の最大移動速度 (px/s) |
| `obstacleSpeedAccel` | 4 | 障害物が1体出現するごとに速度が増加する量 (px/s) |
| `obstacleDespawnX` | -80 | この X 座標を超えたら障害物を削除 (px) |

### 出現タイミング

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `spawnInitialDelay` | 2.0 | ゲーム開始から最初の障害物が出るまでの待ち (秒) |
| `spawnIntervalMin` | 1.5 | 障害物の出現間隔の最小値 (秒) |
| `spawnIntervalMax` | 2.5 | 障害物の出現間隔の最大値 (秒) |
| `spawnCheckInterval` | 0.12 | 出現タイマーのチェック間隔 (秒)。通常変更不要 |

### スコア

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `scorePerSecond` | 50 | 1秒あたりの獲得スコア |

### レイアウト

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `groundYRatio` | 0.72 | 地面の位置（画面高さに対する比率。0.72 = 上から72%の位置） |

## 調整のコツ

- **難易度を下げたい**: `maxLives` を増やす、`obstacleSpeedMax` を下げる、`obstacleSizeMax` を下げる
- **難易度を上げたい**: `maxLives` を1にする、`spawnIntervalMax` を下げる、`obstacleSpeedAccel` を上げる
- **ジャンプ感を変えたい**: `gravity` と `jumpForce` のバランスで調整。重力を下げるとふわっと、上げるとキビキビした動きになる
- **当たり判定**: スプライトの透過部分から自動生成されるポリゴンを使用
