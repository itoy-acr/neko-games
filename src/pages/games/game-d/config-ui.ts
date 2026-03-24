import { type GameDConfig, loadConfig, resetConfig, saveConfig } from "./config";

export type ConfigUICallbacks = {
  onPause: () => void;
  onClose: () => void;
  onRestart: () => void;
};

const FIELD_DEFS: { key: keyof GameDConfig; label: string; step?: number }[] = [
  { key: "gravity", label: "重力" },
  { key: "jumpForce", label: "ジャンプ力" },
  { key: "maxJumps", label: "最大ジャンプ回数", step: 1 },
  { key: "maxLives", label: "ライフ数", step: 1 },
  { key: "invincibleDuration", label: "無敵時間(秒)", step: 0.1 },
  { key: "playerHeight", label: "プレイヤー高さ" },
  { key: "playerCollisionW", label: "当たり判定 幅率", step: 0.05 },
  { key: "playerCollisionH", label: "当たり判定 高さ率", step: 0.05 },
  { key: "bgScrollSpeed", label: "背景スクロール速度" },
  { key: "obstacleBaseHeight", label: "障害物 基本高さ" },
  { key: "obstacleSizeMin", label: "障害物 最小倍率", step: 0.1 },
  { key: "obstacleSizeMax", label: "障害物 最大倍率", step: 0.1 },
  { key: "obstacleCollisionW", label: "障害物 当たり判定 幅率", step: 0.05 },
  { key: "obstacleCollisionH", label: "障害物 当たり判定 高さ率", step: 0.05 },
  { key: "obstacleSpeedInitial", label: "障害物 初期速度" },
  { key: "obstacleSpeedMax", label: "障害物 最大速度" },
  { key: "obstacleSpeedAccel", label: "障害物 加速度", step: 1 },
  { key: "spawnInitialDelay", label: "初回出現待ち(秒)", step: 0.1 },
  { key: "spawnIntervalMin", label: "出現間隔 最小(秒)", step: 0.1 },
  { key: "spawnIntervalMax", label: "出現間隔 最大(秒)", step: 0.1 },
  { key: "scorePerSecond", label: "スコア/秒", step: 1 },
  { key: "groundYRatio", label: "地面位置(画面比率)", step: 0.01 },
];

export function createConfigUI(
  container: HTMLElement,
  callbacks: ConfigUICallbacks,
): { open: () => void; close: () => void; element: HTMLElement } {
  const overlay = document.createElement("div");
  overlay.id = "config-overlay";
  overlay.style.cssText = `
    display:none; position:absolute; inset:0; z-index:1000;
    background:rgba(0,0,0,0.7); overflow-y:auto;
    font-family:sans-serif; color:#eee;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    max-width:420px; margin:auto; background:#1a1e28;
    border-radius:12px; padding:20px; box-sizing:border-box;
    height:95vh; display:flex; flex-direction:column;
  `;

  panel.innerHTML = `
    <h2 style="margin:0 0 12px; font-size:18px; text-align:center;">パラメータ調整</h2>
    <div style="display:flex; gap:8px; margin-bottom:12px;">
      <button id="cfg-close" style="${btnStyle("#4a6a9a")}">▶ 続き</button>
      <button id="cfg-restart" style="${btnStyle("#6a4a4a")}">↺ リスタート</button>
    </div>
    <div id="config-fields" style="flex:1; overflow-y:auto;"></div>
    <div style="display:flex; gap:8px; margin-top:12px;">
      <button id="cfg-save" style="${btnStyle("#4a7a4a")}">保存</button>
      <button id="cfg-reset" style="${btnStyle("#666")}">リセット</button>
    </div>
    <p id="cfg-status" style="text-align:center; font-size:12px; color:#aaa; margin:8px 0 0;"></p>
  `;

  overlay.appendChild(panel);
  container.style.position = "relative";
  container.appendChild(overlay);

  // Settings button (gear icon)
  const gearBtn = document.createElement("button");
  gearBtn.textContent = "⚙";
  gearBtn.style.cssText = `
    position:absolute; bottom:8px; right:8px; z-index:999;
    background:rgba(0,0,0,0.4); border:none; color:#fff;
    font-size:24px; width:40px; height:40px; border-radius:8px;
    cursor:pointer; line-height:1;
  `;
  container.appendChild(gearBtn);

  const fieldsContainer = panel.querySelector("#config-fields") as HTMLElement;
  const statusEl = panel.querySelector("#cfg-status") as HTMLElement;

  function render() {
    const cfg = loadConfig();
    fieldsContainer.innerHTML = "";
    for (const def of FIELD_DEFS) {
      const row = document.createElement("div");
      row.style.cssText =
        "display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;";
      const label = document.createElement("label");
      label.textContent = def.label;
      label.style.cssText = "font-size:13px; flex:1;";
      const input = document.createElement("input");
      input.type = "number";
      input.step = String(def.step ?? 1);
      input.value = String(cfg[def.key]);
      input.dataset.key = def.key;
      input.style.cssText =
        "width:80px; padding:4px 6px; border:1px solid #555; border-radius:4px; background:#2a2e38; color:#eee; font-size:13px; text-align:right;";
      row.appendChild(label);
      row.appendChild(input);
      fieldsContainer.appendChild(row);
    }
  }

  function getValues(): Partial<GameDConfig> {
    const values: Record<string, number> = {};
    const inputs = fieldsContainer.querySelectorAll("input");
    for (const input of inputs) {
      const key = input.dataset.key;
      if (key) values[key] = Number(input.value);
    }
    return values as Partial<GameDConfig>;
  }

  function showStatus(msg: string) {
    statusEl.textContent = msg;
    setTimeout(() => {
      statusEl.textContent = "";
    }, 2000);
  }

  const open = () => {
    render();
    overlay.style.display = "block";
  };

  const close = () => {
    overlay.style.display = "none";
  };

  gearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    callbacks.onPause();
    open();
  });
  gearBtn.addEventListener("touchstart", (e) => {
    e.stopPropagation();
  });

  panel.querySelector("#cfg-close")!.addEventListener("click", () => {
    close();
    callbacks.onClose();
  });

  panel.querySelector("#cfg-restart")!.addEventListener("click", () => {
    close();
    callbacks.onRestart();
  });

  panel.querySelector("#cfg-save")!.addEventListener("click", () => {
    saveConfig(getValues());
    showStatus("保存しました（次回リスタート時に反映）");
  });

  panel.querySelector("#cfg-reset")!.addEventListener("click", () => {
    resetConfig();
    render();
    showStatus("デフォルトに戻しました");
  });

  return { open, close, element: overlay };
}

function btnStyle(bg: string): string {
  return `flex:1; padding:10px; border:none; border-radius:6px; background:${bg}; color:#fff; font-size:14px; cursor:pointer;`;
}
