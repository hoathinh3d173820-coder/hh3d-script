// ==UserScript==
// @name         HH3D
// @namespace    https://github.com/hoathinh3d173820-coder
// @version      3.0
// @description  Cập nhật nhận hdhn
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/hoathinh3d173820-coder/hh3d-script/main/hh3d.user.js
// @downloadURL  https://raw.githubusercontent.com/hoathinh3d173820-coder/hh3d-script/main/hh3d.user.js
// ==/UserScript==
// ❌ nếu đang ở trong iframe thì không chạy menu
if (window.self !== window.top) {
    return;
}
const hh3d = typeof unsafeWindow !== "undefined" ? unsafeWindow.hh3dData : window.hh3dData;
// ===== INIT AUTO KHOANG (GLOBAL) =====
window.initAutoKhoang = function () {
  'use strict';

   function sleep(ms) {
  return new Promise(resolve => REAL_SET_TIMEOUT(resolve, ms));
}
    const REAL_SET_TIMEOUT = window.setTimeout.bind(window);
    let TUVI_DATA = {};
const TUVI_URL = "https://raw.githubusercontent.com/hoathinh3d173820-coder/tuvikktt/main/data.json";
let MODE = null;
function setMode(m) {
  MODE = m;
  localStorage.setItem("hh3d_mode", m);

  const attackBtn = document.getElementById("modeAttack");
  const insertBtn = document.getElementById("modeInsert");

  attackBtn.classList.remove("active");
  insertBtn.classList.remove("active");

  if (m === "attack") attackBtn.classList.add("active");
  if (m === "insert") insertBtn.classList.add("active");

  log("🎯 Mode: " + (m === "attack" ? "Đánh" : "Chèn"));
}
  // ================= CẤU HÌNH =================
  const STORAGE_LOG = "hh3d_log";
  const STORAGE_MINES = "hh3d_selected_mines";
const STORAGE_GROUPS = "hh3d_selected_groups";
let SELECTED_GROUPS = JSON.parse(localStorage.getItem(STORAGE_GROUPS) || "[]");
const STORAGE_CHECK_SEC = "hh3d_check_sec";
const AK = {
  running: false,
  timer: null,
  checkSeconds: 60 // mặc định 60s
};

const AK_SEC = {
  token: null,
  actions: {},
  nonces: {},
  lastScan: 0
};

  let SELECTED_MINES = JSON.parse(localStorage.getItem(STORAGE_MINES) || "[]");
  let khoangFetchPromise = null;

const ACTION_PATTERNS = {
  enter_mine:         /(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmEnter\s*:\s*)?['"]enter_mine['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  get_users_in_mine:  /(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmUsers\s*:\s*)?['"]get_users_in_mine['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  claim_mycred_reward:/['"]claim_mycred_reward['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  attack_user_in_mine:/['"]attack_user_in_mine['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  load_mines_by_type: /(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmList\s*:\s*)?['"]load_mines_by_type['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  refresh_attack_count:/(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmRefresh\s*:\s*)?['"]refresh_attack_count['"][\s\S]{0,400}?nonce:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
};
  // ================= UI =================
function createUI() {
  if (document.getElementById("akPanel")) return;
  const panel = document.createElement("div");
  panel.id = "akPanel";
 panel.innerHTML = `
  <div id="akHeader">
    THEO DÕI KHOÁNG
    <span id="akClose">✖</span>
  </div>
    <div class="akRow">
      <button id="akStartBtn">START</button>
      <button id="akStopBtn">STOP</button>
    </div>
    <div class="akRow">
      <label>Check:</label>
      <input id="akSec" type="number" min="1" value="60"/> giây
      <button id="akSave">Lưu</button>
    </div>
    <div class="akRow">
      <button id="akLoadMine">Chọn Mỏ</button>
    </div>
    <div class="akRow">
      <label>Mode:</label>
      <button id="modeAttack"> Đánh</button>
      <button id="modeInsert"> Chèn</button>
    </div>
    <div class="akBox">
      <div class="title">📦 Danh sách mỏ</div>
      <div id="akMineList"></div>
    </div>
    <div class="akBox">
      <div class="title">⭐ Mỏ đã chọn</div>
      <div id="akSelected"></div>
    </div>
    <div class="akBox">
      <div class="title">⚔️ Tông theo dõi</div>
      <div id="akGroupList"></div>
    </div>
    <div id="akLogBox"></div>
  `;
  document.body.appendChild(panel);
    // 🔥 nút mở lại
const toggleBtn = document.createElement("div");
toggleBtn.id = "akToggleBtn";
toggleBtn.innerText = "⚙";
document.body.appendChild(toggleBtn);

// ẩn panel
document.getElementById("akClose").onclick = () => {
  panel.style.display = "none";
  toggleBtn.style.display = "flex";
};

// hiện panel
toggleBtn.onclick = () => {
  panel.style.display = "block";
  toggleBtn.style.display = "none";
};
  // 🔥 LOAD LẠI SỐ GIÂY
  const savedSec = localStorage.getItem("hh3d_check_sec");
  if (savedSec) {
    AK.checkSeconds = Number(savedSec);
    document.getElementById("akSec").value = savedSec;
  }
  // 🔥 EVENTS
  document.getElementById("akStartBtn").onclick = startAuto;
  document.getElementById("akStopBtn").onclick = stopAuto;
  document.getElementById("akSave").onclick = saveSetting;
  document.getElementById("akLoadMine").onclick = loadMineList;
  document.getElementById("modeAttack").onclick = () => setMode("attack");
  document.getElementById("modeInsert").onclick = () => setMode("insert");
 renderSelected();
renderGroups();

// ===== DRAG PANEL (RIGHT CLICK) =====
(function enableDrag(){
  const panel = document.getElementById("akPanel");

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const savedPos = JSON.parse(localStorage.getItem("akPanel_pos") || "null");
  if (savedPos) {
    panel.style.top = savedPos.top + "px";
    panel.style.left = savedPos.left + "px";
    panel.style.right = "auto";
  }

  panel.addEventListener("contextmenu", (e) => {
    if (isDragging) e.preventDefault();
  });

  panel.addEventListener("mousedown", function(e){
    if (e.button !== 0) return;

    if (
      e.target.closest("button") ||
      e.target.closest("input") ||
      e.target.closest("#akLogBox")
    ) return;

    isDragging = true;

    const rect = panel.getBoundingClientRect();

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    panel.style.right = "auto";

    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", function(e){
    if (!isDragging) return;

    panel.style.left = (e.clientX - offsetX) + "px";
    panel.style.top = (e.clientY - offsetY) + "px";
  });

  document.addEventListener("mouseup", function(){
    if (!isDragging) return;

    isDragging = false;
    document.body.style.userSelect = "";

    const rect = panel.getBoundingClientRect();
    localStorage.setItem("akPanel_pos", JSON.stringify({
      top: rect.top,
      left: rect.left
    }));
  });
})();
}
 const style = document.createElement("style");
style.innerHTML = `

/* PANEL */
#akPanel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 380px;
  background: #1a1a1a;
  color: #e0e0e0;
  border: 1px solid #444;
  z-index: 999999;
  padding: 12px;
  border-radius: 10px;
  font-family: monospace;
}

/* HEADER */
#akPanel #akHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  margin-bottom: 8px;
  color: #00d4ff;
}

/* CLOSE */
#akPanel #akClose {
  cursor: pointer;
  color: #f33;
  font-weight: bold;
}

/* BOX */
#akPanel .akBox {
  border: 1px solid #333;
  margin-top: 8px;
  padding: 6px;
  background: #111;
  max-height: 140px;
  overflow-y: auto;
  border-radius: 6px;
}

/* SCROLL */
#akPanel .akBox::-webkit-scrollbar {
  width: 6px;
}
#akPanel .akBox::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

/* TITLE */
#akPanel .title {
  color: #00d4ff;
  margin-bottom: 4px;
  font-size: 12px;
}

/* ITEM */
#akPanel .mineItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 6px;
  background: #1f1f1f;
  border: 1px solid #333;
  border-radius: 6px;
  font-size: 12px;
}

#akPanel .mineItem span {
  flex: 1;
  color: #ddd;
}

/* BUTTON */
#akPanel button {
  background: #222 !important;
  color: #ddd !important;
  border: 1px solid #555 !important;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 4px;
}

#akPanel button:hover {
  background: #00d4ff !important;
  color: #000 !important;
}

/* ACTIVE*/
#akPanel button.active {
  background: #00d4ff !important;
  color: #000 !important;
  font-weight: bold;
}

/* ADD */
#akPanel .btn-add {
  background: #0a7d2c !important;
  color: #fff !important;
  width: 24px;
  height: 24px;
  padding: 0;
  font-weight: bold;
}

#akPanel .btn-add:hover {
  background: #0f0 !important;
  color: #000 !important;
}

/* DELETE */
#akPanel .btn-del {
  background: #a11 !important;
  color: #fff !important;
  width: 24px;
  height: 24px;
  padding: 0;
  font-weight: bold;
}

#akPanel .btn-del:hover {
  background: #f33 !important;
}

/* INPUT*/
#akPanel input {
  width: 50px;
  background: #111 !important;
  color: #fff !important;
  border: 1px solid #555 !important;
}

/* LOG */
#akPanel #akLogBox {
  height: 120px;
  overflow-y: auto;
  background: #111;
  border: 1px solid #333;
  margin-top: 6px;
  padding: 4px;
  font-size: 11px;
}

/* TOGGLE BUTTON*/
#akToggleBtn {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: #00d4ff;
  border-radius: 50%;
  display: none;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 999999;
  color: #000;
  font-weight: bold;
}

/* START / STOP */
#akPanel #akStartBtn.active {
  background: #00d4ff !important;
  color: #000 !important;
}

#akPanel #akStopBtn.active {
  background: #ff4444 !important;
  color: #fff !important;
}

/* MODE */
#akPanel #modeAttack.active,
#akPanel #modeInsert.active {
  background: #00d4ff !important;
  color: #000 !important;
  font-weight: bold;
}
/* cursor kéo */
#akPanel {
  cursor: grab;
}

#akPanel:active {
  cursor: grabbing;
}

/* không áp dụng cho nút & input */
#akPanel button,
#akPanel input,
#akPanel #akLogBox {
  cursor: default !important;
}
`;
document.head.appendChild(style);
function setActive(btnId) {
  document.getElementById("akStartBtn").classList.remove("active");
  document.getElementById("akStopBtn").classList.remove("active");

  if (btnId === "akStartBtn") {
    document.getElementById("akStartBtn").classList.add("active");
  }

  if (btnId === "akStopBtn") {
    document.getElementById("akStopBtn").classList.add("active");
  }
}

function saveSetting() {
  const val = document.getElementById("akSec").value;

  if (!val || val < 1) {
    log("❌ Số giây không hợp lệ");
    return;
  }

  localStorage.setItem(STORAGE_CHECK_SEC, val);
  AK.checkSeconds = Number(val);

  log("💾 Đã lưu: " + val + " giây");
}

  // ================= LOG =================
  function log(msg) {
    const time = `[${new Date().toLocaleTimeString()}] ${msg}`;
    const box = document.getElementById("akLogBox");
    if (box) {
      const div = document.createElement("div");
      div.textContent = time;
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }
  }
  // ================= SECURITY =================
  async function fetchKhoangMachAll(force = false) {
    const now = Date.now();

    if (!force && now - AK_SEC.lastScan < 30 * 60 * 1000) {
      log("⏱ Cache security");
      return;
    }

    if (khoangFetchPromise) return khoangFetchPromise;

    khoangFetchPromise = (async () => {
      log("🔄 quét security...");

      const html = await fetch("/khoang-mach", {
        credentials: "include",
        cache: "no-store"
      }).then(r => r.text());

      for (const [action, regex] of Object.entries(ACTION_PATTERNS)) {
        const m = html.match(regex);
        if (m?.[1]) {
          AK_SEC.actions[action] = m[1];
        } else {
          log(`❌ ${action}`);
        }
      }
// ===== NONCE refresh attack =====
const m2 = html.match(/action:\s*['"]refresh_attack_count['"][\s\S]*?nonce:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i);

if (m2?.[1]) {
  AK_SEC.nonces.refresh_attack_count = m2[1];
}
      const token =
        html.match(/"securityToken"\s*:\s*"([^"]+)"/i)?.[1] ||
        html.match(/security_token["']?\s*[:=]\s*["']([^"']+)/i)?.[1];

      if (!token) {
        log("❌ TOKEN NULL");
        return;
      }

      AK_SEC.token = token;

      AK_SEC.lastScan = Date.now();
    })();

    try { await khoangFetchPromise; }
    finally { khoangFetchPromise = null; }
  }
    async function ensureValidSecurity() {
  if (
    !AK_SEC.token ||
    !AK_SEC.actions.attack_user_in_mine ||
    Date.now() - AK_SEC.lastScan > 5 * 60 * 1000
  ) {
    log("♻️ Token hết hạn → scan lại...");
    await fetchKhoangMachAll(true);
  }
}
// ================= GROUP =================
function addGroup(name) {
  if (SELECTED_GROUPS.includes(name)) return;

  SELECTED_GROUPS.push(name);
  localStorage.setItem(STORAGE_GROUPS, JSON.stringify(SELECTED_GROUPS));

  log("➕ Tông " + name);
  renderGroups();
}

function removeGroup(name) {
  SELECTED_GROUPS = SELECTED_GROUPS.filter(g => g !== name);
  localStorage.setItem(STORAGE_GROUPS, JSON.stringify(SELECTED_GROUPS));

  log("🗑 Xoá tông " + name);
  renderGroups();
}

function renderGroups(extraGroups = []) {
  const box = document.getElementById("akGroupList");
  if (!box) return;

  box.innerHTML = "";

  // ===== TÔNG ĐÃ CHỌN =====
  SELECTED_GROUPS.forEach(g => {
    const div = document.createElement("div");
    div.className = "mineItem";

    div.innerHTML = `
      <span>✔ ${g}</span>
      <button class="btn-del">X</button>
    `;

    div.querySelector("button").onclick = () => removeGroup(g);
    box.appendChild(div);
  });

  // ===== TÔNG MỚI (detect từ mỏ) =====
  extraGroups.forEach(g => {
    if (SELECTED_GROUPS.includes(g)) return;

    const div = document.createElement("div");
    div.className = "mineItem";

    div.innerHTML = `
      <span>${g}</span>
     <button class="btn-add">+</button>
    `;

    div.querySelector("button").onclick = () => addGroup(g);
    box.appendChild(div);
  });
}
async function loadTuVi() {
  try {
    log("🌐 Load Tu Vi GitHub...");
    const res = await fetch(TUVI_URL + "?t=" + Date.now()); // tránh cache
    TUVI_DATA = await res.json();
    log("✅ TuVi: " + Object.keys(TUVI_DATA).length + " người");
    // cache local (phòng lỗi mạng)
    localStorage.setItem("tuvi_cache", JSON.stringify(TUVI_DATA));
  } catch (e) {
    log("❌ Lỗi load GitHub -> dùng cache");

    const cache = localStorage.getItem("tuvi_cache");
    if (cache) {
      TUVI_DATA = JSON.parse(cache);
      log("📦 Load cache OK");
    }
  }
}
    async function buyAttackTurn() {
        await ensureValidSecurity();
  // ===== CHECK TOKEN =====
  if (
    !AK_SEC.nonces.refresh_attack_count ||
    !AK_SEC.token ||
    Date.now() - AK_SEC.lastScan > 5 * 60 * 1000
  ) {
    log("🔄 Scan lại nonce...");
    await fetchKhoangMachAll(true);
  }

  if (!AK_SEC.nonces.refresh_attack_count || !AK_SEC.token) {
    log("❌ Thiếu nonce/token");
    return null;
  }

  log("🛒 Mua lượt đánh...");

const res = await callAPI({
  action: "refresh_attack_count",
  nonce: AK_SEC.nonces.refresh_attack_count,
  security_token: AK_SEC.token
});

  const msg =
    res?.data?.message ||
    res?.message ||
    "Mua lượt thất bại";

  log("🛒 " + msg);

  return res;
}
async function attackUser(mineId, target, retry = false) {
    await ensureValidSecurity();
  log(`⚔️ Đánh ${target.name}`);

const res = await callAPI({
  action: "attack_user_in_mine",
  mine_id: mineId,
  attack_token: target.token,
  security: AK_SEC.actions.attack_user_in_mine,
  security_token: AK_SEC.token
});

  const msg = res?.data?.message || res?.message || "";

  // ================= WIN =================
  if (msg.includes("đã đánh bại")) {
    log("🏆 WIN");
    return true;
  }

  // ================= LOSE → RETRY =================
  if (msg.includes("thiếu chút nữa")) {
    if (retry) {
      log("❌ Đã retry nhưng vẫn thua");
      return false;
    }

    log("💀 Thua → đánh lại");

    const delay = 5000 + Math.random() * 1000;
    log(`⏳ Đợi ${Math.round(delay/1000)}s rồi đánh lại`);
    await sleep(delay);

    return await attackUser(mineId, target, true);
  }

  // ================= HẾT LƯỢT =================
if (
  msg.includes("giới hạn tấn công") ||
  msg.includes("0 lượt")
) {
  if (retry) {
    log("❌ Retry rồi vẫn hết lượt");
    return false;
  }

  // 🔥 delay TRƯỚC khi mua ( quan trọng)
  const delayBefore = 5000 + Math.random() * 1000;
  log(`⏳ Hết lượt → đợi ${Math.round(delayBefore/1000)}s rồi mua`);
  await new Promise(r => setTimeout(r, delayBefore));

  log("🛒 Mua lượt...");

  const buyRes = await buyAttackTurn();
  const ok = buyRes?.success || buyRes?.data?.success;

  if (!ok) {
    log("❌ Mua lượt thất bại");
    return false;
  }

  // 🔥 delay SAU khi mua
  const delayAfter = 1000 + Math.random() * 1000;
  log(`⏳ Đợi ${Math.round(delayAfter/1000)}s rồi đánh lại`);
  await new Promise(r => setTimeout(r, delayAfter));

  log("🔁 Đánh lại sau khi mua lượt");

  return await attackUser(mineId, target, true);
}
  // ================= COOLDOWN =================
  if (res?.data?.cooldown) {
    const time = res?.data?.remaining_time || 0;
    log(`⛔ Bị phong ấn ${Math.round(time / 60)} phút`);
    stopAuto();
    return false;
  }

  // ================= CHƯA NHẬN THƯỞNG =================
  if (msg.includes("phần thưởng") || msg.includes("nhận thưởng")) {
    if (retry) {
      log("❌ Retry rồi vẫn fail");
      return false;
    }

    log("🎁 Chưa nhận thưởng → nhận...");
    await claimReward();

    const delay = 6000 + Math.random() * 1000;
    log(`⏳ Đợi ${Math.round(delay/1000)}s rồi đánh lại`);
    await sleep(delay);
    return await attackUser(mineId, target, true);
  }

  // ================= FALLBACK =================
  if (res?.success) {
    log("✅ Thành công");
    return true;
  }

  log("❌ Fail: " + msg);
  return false;
}
async function enterMine(mineId, target = null) {
  await ensureValidSecurity();
  log("🧱 Vào mỏ...");

  const res = await callAPI({
    action: "enter_mine",
    mine_id: mineId,
    security: AK_SEC.actions.enter_mine,
    security_token: AK_SEC.token
  });

  const msg = res?.data?.message || res?.message || "";

  // 🔥 luôn hiện message server
  if (msg) {
    log("📩 " + msg);
  }

  // ================= SUCCESS =================
  if (res?.success) {
    log("✅ Thành công");
    return true;
  }

  // ================= BỊ ĐÁNH BẠI =================
  if (msg.includes("bị đánh bại") || msg.includes("hồi phục")) {
    log("⚠️ Không vào được → chuyển sang đánh");

    if (!target) {
      log("❌ Không có target");
      return false;
    }

    await sleep(3000);
    return await attackUser(mineId, target);
  }

  // ================= CHƯA NHẬN THƯỞNG =================
  if (msg.includes("phần thưởng") || msg.includes("nhận thưởng")) {
    log("🎁 Chưa nhận thưởng → nhận...");
    await claimReward();

    await sleep(4000);
    return await enterMine(mineId, target);
  }

  // ================= KHÁC =================
  log("❌ Enter fail");
  return false;
}
    async function claimReward() {
        await ensureValidSecurity();
  log("🎁 Nhận thưởng...");

const res = await callAPI({
  action: "claim_reward_km",
  security: AK_SEC.actions.claim_reward_km,
  security_token: AK_SEC.token
});

  if (res?.success) {
    log("✅ Đã nhận thưởng");
  }
}
async function checkMine(mine) {
    await ensureValidSecurity();
  const mineId = mine.id;

  log(`🔎 ${mine.name} (#${mineId})`);

  if (!MODE) {
    log("⚠️ Chưa chọn mode");
    return;
  }
const res = await callAPI({
  action: "get_users_in_mine",
  mine_id: mineId,
  security: AK_SEC.actions.get_users_in_mine,
  security_token: AK_SEC.token
});

  if (!res?.data?.users) {
    log("❌ Không có user");
    return;
  }
  const users = res.data.users;
  const groups = {};
  const players = [];
  users.forEach(u => {
    const name = (u.name || u.username || "").trim();
    const html = u.group_role_html || "";
    const match = html.match(/<a[^>]*>(.*?)<\/a>/);
    const groupName = match ? match[1].trim() : "Không rõ";
    const tuvi = TUVI_DATA[normalize(name)] || 0;
    groups[groupName] = (groups[groupName] || 0) + 1;

    players.push({
      name,
      group: groupName,
      tuvi,
      token: u.id
    });
  });
  const groupNames = Object.keys(groups);
  // ===== LOG GROUP =====
  groupNames.forEach(g => {
    log(`👉 ${g}: ${groups[g]} người`);
  });

  // ===== LOG PLAYER (GIỮ NGUYÊN) =====
players.forEach(p => {
  const tv = formatNumber(p.tuvi);
  logHTML(`👤 ${p.name} | <span style="color:#00ff00">${tv}</span> | ${p.group}`);
});
  // ================= LOGIC =================
  // ❗ tất cả tông phải nằm trong danh sách theo dõi
  const allValid = groupNames.every(g => SELECTED_GROUPS.includes(g));

  if (!allValid) {
    log("⛔ Có tông khác → bỏ qua");
    renderGroups(groupNames);
    return;
  }
  const alertMsg = `🔥 MỎ CÓ VẤN ĐỀ<br>${mine.name} (#${mineId})<br>${new Date().toLocaleTimeString()}`;

log("🔥  hợp lệ (đúng tông theo dõi vào ngay)");
showAlertBox(alertMsg);
  // ===== CHỌN TARGET (GIỮ LOG CHI TIẾT) =====
  const validTargets = players.filter(p => p.tuvi > 0);
  if (!validTargets.length) {
    log("😴 Không có target");
    renderGroups(groupNames);
    return;
  }

  validTargets.sort((a, b) => a.tuvi - b.tuvi);
  const target = validTargets[0];
  log(`🎯 Chọn: ${target.name} (${target.tuvi})`);
  // ===== ACTION =====
  if (MODE === "attack") {
    await attackUser(mineId, target);
  }
if (MODE === "insert") {
  await enterMine(mineId, target);
}

  renderGroups(groupNames);
}
// ================= LOAD MINE =================
async function loadMineList() {
  log("📦 Tải  mỏ...");
  await fetchKhoangMachAll(true);

  if (!AK_SEC.actions.load_mines_by_type || !AK_SEC.token) {
    log("❌ Thiếu security/token");
    return;
  }
  const res = await fetch("/wp-content/themes/halimmovies-child/hh3d-ajax.php", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      action: "load_mines_by_type",
      mine_type: "silver",
      security: AK_SEC.actions.load_mines_by_type
    })
  }).then(r => r.json());
  const list = document.getElementById("akMineList");
  list.innerHTML = "";
  if (!res?.data) {
    log("❌ Không có dữ liệu mỏ");
    return;
  }
  res.data.forEach(m => {
    const div = document.createElement("div");
    div.className = "mineItem";
    const name = (m.name || "").trim();
    div.innerHTML = `
      <span>${name} (#${m.id})</span>
      <button class="btn-add">+</button>
    `;
    div.querySelector("button").onclick = () => addMine(m.id, name);
    list.appendChild(div);
  });
  log("✅ Load xong " + res.data.length + " mỏ");
}
// ================= MINE =================
function addMine(id, name) {
  if (SELECTED_MINES.find(m => m.id == id)) return;
  SELECTED_MINES.push({ id, name });
  localStorage.setItem(STORAGE_MINES, JSON.stringify(SELECTED_MINES));
  log("➕ " + name + " (#" + id + ")");
  renderSelected();
}
function removeMine(id) {
  SELECTED_MINES = SELECTED_MINES.filter(m => m.id != id);
  localStorage.setItem(STORAGE_MINES, JSON.stringify(SELECTED_MINES));
  log("🗑 Xoá mỏ " + id);
  renderSelected();
}
function renderSelected() {
  const box = document.getElementById("akSelected");
  if (!box) return;
  box.innerHTML = "";
  SELECTED_MINES.forEach(m => {
    const div = document.createElement("div");
    div.className = "mineItem";
    div.innerHTML = `
      <span>${m.name} (#${m.id})</span>
      <button class="btn-del">X</button>
    `;
    div.querySelector("button").onclick = () => removeMine(m.id);
    box.appendChild(div);
  });
}
// ================= START STOP =================
async function startAuto() {
  if (AK.running) return;

  AK.running = true;
  setActive("akStartBtn");

  await fetchKhoangMachAll(true);
  await loadTuVi();

  loop(); // không await
}
function stopAuto() {
  AK.running = false;
  setActive("akStopBtn");

  if (AK.timer) {
    clearTimeout(AK.timer);
    AK.timer = null;
  }
  log("🛑 STOP");
}
function logHTML(msg) {
  const time = `[${new Date().toLocaleTimeString()}] `;
  const box = document.getElementById("akLogBox");

  if (box) {
    const div = document.createElement("div");
    div.innerHTML = time + msg;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }
}
   async function callAPI(params, retry = false) {
  let res;
  try {
    res = await fetch("/wp-content/themes/halimmovies-child/hh3d-ajax.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params)
    }).then(r => r.json());
  } catch (e) {
    log("❌ API lỗi mạng → retry...");
    if (!retry) {
      await new Promise(r => setTimeout(r, 2000));
      return callAPI(params, true);
    }
    return null;
  }
  const msg = res?.data?.message || res?.message || "";
  // 🔥 detect hết phiên / security
  if (
    msg.includes("phiên") ||
    msg.includes("hết hạn") ||
    msg.includes("invalid") ||
    msg.includes("security") ||
    msg.includes("token")
  ) {
    if (retry) {
      log("❌ Retry rồi vẫn lỗi phiên");
      return res;
    }

    log("♻️ Hết phiên → fetch lại security...");
    await fetchKhoangMachAll(true);
    const delay = 2000 + Math.random() * 1000;
    await sleep(delay);

    return await callAPI(params, true);
  }
  return res;
}
    function formatNumber(num) {
  if (!num) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
    function normalize(name) {
  return name.toLowerCase().trim();
}
async function loop() {
  while (AK.running) {
    const startTime = Date.now();

    for (const m of SELECTED_MINES) {
      try {
        log(`👉 Kiểm tra ${m.name} (#${m.id})`);
        await checkMine(m);
      } catch (e) {
        log("❌ Lỗi checkMine: " + e.message);
      }

      await sleep(1000);
    }

    // 🔥 đảm bảo đúng chu kỳ check
    const elapsed = Date.now() - startTime;
    const waitTime = Math.max(0, AK.checkSeconds * 1000 - elapsed);

    log(`⏳ Đợi ${Math.round(waitTime/1000)}s vòng tiếp`);
    await sleep(waitTime);
  }
}
  // ================= INIT =================
function init() {
  createUI();
  const savedMode = localStorage.getItem("hh3d_mode");
  if (savedMode) {
    setMode(savedMode);
  }
  log("✅ Sẵn Sàng");
}
init();
function initAlertBox() {
  if (document.getElementById("akAlertBox")) return;

  const box = document.createElement("div");
  box.id = "akAlertBox";

  box.style.position = "fixed";
  box.style.top = "80px";
  box.style.left = "20px";
  box.style.width = "260px";
  box.style.background = "#111";
  box.style.border = "1px solid #333";
  box.style.borderRadius = "10px";
  box.style.zIndex = 999999;
  box.style.fontSize = "12px";
  box.style.fontFamily = "monospace";
  box.style.cursor = "pointer";

  box.innerHTML = `
    <div id="akAlertHeader" style="padding:8px;color:#fff;background:#222;border-radius:10px">
      🔥 Chưa có cảnh báo
    </div>
    <div id="akAlertList" style="display:none;max-height:250px;overflow-y:auto"></div>
  `;

  document.body.appendChild(box);

  // toggle mở / đóng
  box.onclick = () => {
    const list = document.getElementById("akAlertList");
    list.style.display = list.style.display === "none" ? "block" : "none";
  };
}
function showAlertBox(text) {
  initAlertBox();

  const header = document.getElementById("akAlertHeader");
  const list = document.getElementById("akAlertList");

  const time = new Date().toLocaleTimeString();

  // 👉 update header (chỉ hiện cái mới nhất)
  header.innerHTML = `🔥 ${text} <br><span style="font-size:10px;color:#aaa">${time}</span>`;

  // 👉 thêm vào list (lịch sử)
  const item = document.createElement("div");

  item.style.padding = "6px";
  item.style.borderTop = "1px solid #222";
  item.style.color = "#ddd";

  item.innerHTML = `🔥 ${time} - ${text}`;

  list.prepend(item);

  // giới hạn 12 dòng
  while (list.children.length > 12) {
    list.removeChild(list.lastChild);
  }
}
};
(function() {
'use strict';

if (!location.hostname.includes("hoathinh3d.")) return;
const DOMAIN_KEY = "HH3D_CUSTOM_DOMAIN";
(function autoSyncDomain() {
      const STORAGE_KEY = "hh3d_auto_login";
  const current = location.hostname;
  const saved = localStorage.getItem(DOMAIN_KEY);
  // Nếu miền web đổi → tự cập nhật theo miền mới
  if (saved !== current) {
    localStorage.setItem(DOMAIN_KEY, current);
  }})();
function getCurrentDomain() {
  return localStorage.getItem(DOMAIN_KEY) || location.hostname;
}
function buildUrl(path) {
  return `${location.protocol}//${getCurrentDomain()}${path}`;
}
// = UTIL =
const API_URL = buildUrl("/wp-content/themes/halimmovies-child/hh3d-ajax.php");
const getBCNonce = () => localStorage.getItem("HH3D_NONCE_BC") || "";
const formatTime = ms => {
const m = Math.floor(ms / 60000), s = Math.round(ms / 1000) % 60;
return `${m}:${s.toString().padStart(2,"0")}s`;
};
// PUop khắc trận văn
let popupSeal = document.createElement("div");
popupSeal.id = "popupSeal";
popupSeal.style.cssText =
"position:fixed;top:120px;right:20px;width:300px;background:linear-gradient(180deg,#1b1b1b,#0f0f0f);border:1px solid #333;border-radius:12px;padding:12px;color:#eaeaea;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.04);z-index:100002;display:none";

popupSeal.innerHTML = `
<div style="font-weight:600;font-size:14px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #333;display:flex;align-items:center;gap:6px">
🧿 Khắc Trận Văn
</div>

<div id="sealInfo" style="background:#0b0b0b;border-radius:8px;padding:10px;line-height:1.7;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)">
⏳ Đang tải...
</div>

<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">

<button id="btnClaimTurns"
style="flex:1 1 48%;background:linear-gradient(180deg,#1565c0,#0d47a1);border:1px solid #1565c0;border-radius:8px;color:#e3f2fd;font-weight:600;padding:6px 0;cursor:pointer">
🎁 Nhận lượt
</button>

<button id="btnActivateSeal"
style="flex:1 1 48%;background:linear-gradient(180deg,#2e7d32,#1b5e20);border:1px solid #2e7d32;border-radius:8px;color:#eaffea;font-weight:600;padding:6px 0;cursor:pointer">
🔥 Khắc
</button>

<button id="btnCompleteSummon"
style="flex:1 1 48%;background:linear-gradient(180deg,#7b1fa2,#4a148c);border:1px solid #7b1fa2;border-radius:8px;color:#f3e5f5;font-weight:600;padding:6px 0;cursor:pointer">
🧿 Mở PT
</button>

<button id="btnCloseSeal"
style="flex:1 1 48%;background:linear-gradient(180deg,#333,#1f1f1f);border:1px solid #444;border-radius:8px;color:#ddd;padding:6px 0;cursor:pointer">
✖ Đóng
</button>
</div>
`;

document.body.appendChild(popupSeal);

popupSeal.addEventListener("mouseover", e => {
if (e.target.id === "btnActivateSeal") {
e.target.style.filter = "brightness(1.15)";
  }
  if (e.target.id === "btnCloseSeal") {
    e.target.style.filter = "brightness(1.1)";
  }});
popupSeal.addEventListener("mouseout", e => {
  if (e.target.tagName === "BUTTON") {
    e.target.style.filter = "";
  }});
// =AUTO Tự Động CHÚC PHÚC - KHUNG GIỜ =
const t = (h, m) => h*60 + m;
const AUTO_CHUC_PHUC_WINDOWS = [
  { key: "CP_1150", start: t(11,50), end: t(11,55) },
  { key: "CP_1350", start: t(13,50), end: t(13,55) },
  { key: "CP_1850", start: t(18,50), end: t(18,55) },
  { key: "CP_2050", start: t(20,50), end: t(20,55) }
];
    // = TIME & STATE =
const todayKey = () => new Date().toISOString().slice(0,10);
const hasRun = key => localStorage.getItem(key) === todayKey();
const markRun = key => localStorage.setItem(key, todayKey());
const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
const randomMs = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDelay = (min=500,max=2000)=>
new Promise(r=>setTimeout(r,Math.floor(Math.random()*(max-min+1))+min));
  // = TOAST HISTORY ==
const TOAST_HISTORY_KEY = "HH3D_TOAST_HISTORY";
const MAX_TOAST_HISTORY = 200;
// load từ localStorage
let TOAST_HISTORY = [];try {
  TOAST_HISTORY = JSON.parse(localStorage.getItem(TOAST_HISTORY_KEY)) || [];} catch {
  TOAST_HISTORY = [];}
// ====== TOAST Dark  ======
function showToast(msg, preview = true, duration = 3000) {
  if (typeof preview === "number") {
    duration = preview;
    preview = true;

}
TOAST_HISTORY.push({
  msg,
  preview,
  time: new Date().toLocaleTimeString()
});
if (TOAST_HISTORY.length > MAX_TOAST_HISTORY) {
  TOAST_HISTORY.shift();
}saveToastHistory();
  let wrap = document.getElementById("toastContainer");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "toastContainer";
    wrap.style.cssText = `  position:fixed; top:18px;left:50%; transform:translateX(-50%);display:flex;flex-direction:column;align-items:center; gap:10px;z-index:999999;pointer-events:none;`;
    document.body.appendChild(wrap);
  }
  const icon = preview ? "" : "❌";
  const el = document.createElement("div");
  el.style.cssText = `
    background:#0f0f0f;color:#fff;padding:12px 16px; border-radius:10px;font-size:14px; min-width:260px;
    max-width:420px;box-shadow:0 10px 30px rgba(0,0,0,.75);border:1px solid rgba(255,255,255,.06); position:relative;overflow:hidden; opacity:0;transform:translateY(-12px);transition:all .25s ease;pointer-events:auto;
  `;
el.innerHTML = `
<div style="display:flex;align-items:center;gap:10px;">
${icon ? `<div style="font-size:16px;color:#ff4d4f">${icon}</div>` : ""} <div style="flex:1;line-height:1.4">${msg}</div><div class="close" style=" cursor:pointer;color:#777;font-size:18px; margin-left:8px;
      ">×</div></div><div class="bar" style="position:absolute;bottom:0;left:0;height:3px; background:${preview ? "#444" : "#ff4d4f"};width:100%;transition:width ${duration}ms linear; "></div>
  `;
  wrap.prepend(el);
  requestAnimationFrame(() => {el.style.opacity = "1";el.style.transform = "translateY(0)"; el.querySelector(".bar").style.width = "0%";
  });
    const btnLog = document.getElementById("btnToastHistory");
if (btnLog) {
  btnLog.textContent = TOAST_HISTORY.some(t => !t.preview) ? "📜" : "📜";
}
  const remove = () => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-12px)";
    setTimeout(() => el.remove(), 250);
  };
  el.querySelector(".close").onclick = remove;
  setTimeout(remove, duration);
}
// ====== CSS ======
GM_addStyle(`
#autoMenu{
  transition: transform .4s ease;
}
#autoMenu { will-change: left, top; }
#autoMenu {
  transition: all .35s cubic-bezier(.25,.8,.25,1);
  transform-origin: top right;
}

/* ===== THU NHỎ THÀNH NÚT TRÒN TRONG SUỐT ===== */
#autoMenu.collapsed {
  width:50px !important;
  height:50px !important;
  padding:0 !important;
  border-radius:50% !important;
  background:transparent !important;
  box-shadow:none !important;
  backdrop-filter:none !important;
  overflow:hidden;
  border:none !important;
}

/* Ẩn toàn bộ nội dung */
#autoMenu.collapsed > *:not(#collapseBtn){
  opacity:0;
  transform:scale(.3);
  pointer-events:none;
}

/* ===== NÚT + TRONG SUỐT ===== */
#collapseBtn {
  transition: all .3s ease;
}

/* khi thu */
#autoMenu.collapsed #collapseBtn {
  width:50px;
  height:50px;
  top:0;
  right:0;
  border-radius:50%;
  background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.2);
  font-size:22px;
}

/* hover cho đẹp */
#autoMenu.collapsed #collapseBtn:hover {
  background:rgba(255,255,255,0.15);
  transform:scale(1.1);
}

/* nội dung hiện lại */
#autoMenu > * {
  transition: all .25s ease;
}
#autoMenu{cursor:move;position:fixed;top:80px;right:10px;background:#222;border:1px solid #555;border-radius:8px;padding:10px;color:#fff;font-size:14px;z-index:99999}
#autoMenu label{display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin:4px 0;width:100%;box-sizing:border-box}
.switch{flex-shrink:0;position:relative;display:inline-block;width:50px;height:24px}
.switch input{opacity:0;width:0;height:0}
.slider{position:absolute;cursor:pointer;inset:0;background:#555;transition:.4s;border-radius:34px}
.slider:before{content:"";position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;transition:.4s;border-radius:50%}
input:checked+.slider{background:#2196F3}
input:checked+.slider:before{transform:translateX(26px)}
#autoProfileInfo .avatar-container-header{display:inline-block!important;position:relative!important;width:64px!important;height:64px!important;margin:0 auto 6px!important}
#autoProfileInfo .avatar-container-header img{width:64px!important;height:64px!important;border-radius:50%!important;object-fit:cover!important}
.toast-item{animation:fadein .3s}
@keyframes fadein{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
`);
// ================== MENU AUTO  ==================
const menu=document.createElement("div");
menu.id="autoMenu";
menu.style.cssText="position:fixed;top:60px;right:20px;z-index:99999;background:rgba(25,25,25,.95);padding:10px;border-radius:8px;width:220px;font-family:'Segoe UI',sans-serif;color:#eee;box-shadow:0 0 10px rgba(0,0,0,.5);backdrop-filter:blur(4px)";
menu.innerHTML =
`<div style="position:relative;text-align:center;margin-bottom:8px">

  <!-- ⚙  -->
  <button id="openAutoMenuBtn"
    style="
      position:absolute;
      top:6px;
      left:6px;
      width:28px;
      height:28px;
      border-radius:6px;
      border:none;
      background:rgba(0,0,0,0.6);
      color:#fff;
      cursor:pointer;
      font-size:14px;
      backdrop-filter:blur(4px);
      display:flex;
      align-items:center;
      justify-content:center;
    ">
    ⚙
  </button>

  <!-- LOGO -->
  <img src="${buildUrl("/wp-content/uploads/2025/05/logo.png")}"
       style="max-width:130px;border-radius:6px">

</div>

<div id="autoProfileInfo" style="margin:8px 0;padding:6px;background:#333;border-radius:6px;font-size:13px;line-height:1.4em">
  <div style="color:#bbb;text-align:center">⏳ Đang tải...</div>
</div>

${
  [["Phúc Lợi","PhucLoi",4],
   ["Thí Luyện","ThiLuyen",3],
   ["Hoang Vực","HoangVuc",5],
   ["Bí Cảnh","BiCanh",5]
  ].map(([t,k,m]) => `
  <label class="menu-row">
    <span class="menu-title">${t}
      <span id="count${k}" class="menu-count">0/${m}</span>
    </span>
    <div class="switch">
      <input type="checkbox" id="toggle${k}">
      <span class="slider"></span>
    </div>
  </label>
  `).join("")
}

<button id="hapThuBtn" class="hapthu-btn hapthu-hint">
  ✨ Hấp Thụ Linh Thạch
</button>

<label class="menu-row">
  <span class="menu-title">Tiến Độ</span>
  <div class="switch">
    <input type="checkbox" id="toggleTienDo">
    <span class="slider"></span>
  </div>
</label>

<div style="margin-top:6px;font-size:12px">
  <div style="color:#bbb;margin-bottom:2px">🌐 URL web</div>

  <div style="display:flex;align-items:center;gap:6px;width:100%">
    <input id="domainConfigInput" type="text"
      placeholder="vd: hoathinh3d.li"
      style="flex:1;min-width:0;box-sizing:border-box;padding:4px 6px;border-radius:4px;border:1px solid #555;background:#111;color:#fff;font-size:12px">

    <!-- 💎 NÚT KHOÁNG -->
    <button id="autoLoginSettingBtn"
      style="flex:0 0 auto;width:32px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px;border:1px solid #555;background:#222;color:#fff;cursor:pointer">
      <span class="material-icons">diamond</span>
    </button>
  </div>
</div>
`;

document.body.appendChild(menu);
    document.getElementById("openAutoMenuBtn")?.addEventListener("click", () => {
  // tránh mở nhiều lần
  if (document.getElementById("autoMenuBox")) return;

  createAutoMenu();
});
document.getElementById("autoLoginSettingBtn")
  ?.addEventListener("click", openKhoangMenu);

function openKhoangMenu() {
  if (typeof initAutoKhoang === "function") {
    initAutoKhoang();
  } else {
    alert("Chưa load script khoáng!");
  }
}

    function autoScaleMenu() {
  const rect = menu.getBoundingClientRect();
  const availableHeight = window.innerHeight - 80; // trừ top 60 + margin
  const scale = availableHeight / rect.height;

  if (scale < 1) {
    menu.style.transform = `scale(${scale})`;
    menu.style.transformOrigin = "top right";
  } else {
    menu.style.transform = "scale(1)";
  }
}
window.addEventListener("resize", autoScaleMenu);
setTimeout(autoScaleMenu, 200);
// =====NÚT MUA ĐAN DƯỢC =====
const hapThuBtn = document.getElementById("hapThuBtn");
const buyDanWrap = document.createElement("div");
buyDanWrap.style.cssText = `display:flex;gap:6px;margin-top:6px;`;
const buyDanBtn = document.createElement("button");
buyDanBtn.id = "buyDanBtn";
buyDanBtn.textContent = " MUA ĐAN DƯỢC";
buyDanBtn.style.cssText = `
  flex:1;padding:10px;border-radius:8px;border:1px solid #444;
  background:linear-gradient(90deg,#28a745,#1e7e34);color:#fff;
  font-size:14px;font-weight:600;cursor:pointer;
`;
buyDanWrap.append(buyDanBtn);
hapThuBtn.after(buyDanWrap);
// ===== POPUP =====
const popup = document.createElement("div");
popup.id = "buyDanPopup";
popup.style.cssText = `
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
  background:#111;border:1px solid #333;border-radius:12px;padding:12px;
  z-index:999999;min-width:300px;display:none;box-shadow:0 0 20px rgba(0,0,0,.6);
  color:#fff;font-family:Segoe UI, sans-serif;
`;

popup.innerHTML = `
  <div style="font-weight:700;margin-bottom:8px;text-align:center">💊 Mua Đan Dược</div>

  <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #333">
    <div style="font-weight:600;margin-bottom:6px">🏯 Tông Môn</div>
    <div style="display:grid;grid-template-columns:1fr;gap:6px">
      <button data-src="tongmon" data-item="dan_duoc_tu_pham">Tứ Phẩm</button>
      <button data-src="tongmon" data-item="dan_duoc_ngu_pham">Ngũ Phẩm</button>
      <button data-src="tongmon" data-item="dan_duoc_luc_pham">Lục Phẩm</button>
      <button data-src="tongmon" data-item="dan_duoc_that_pham">Thất Phẩm</button>
    </div>
  </div>
  <div>
    <div style="font-weight:600;margin-bottom:6px">🏪 Tụ Bảo Các</div>
    <div style="display:grid;grid-template-columns:1fr;gap:6px">
      <!-- đổi item_id theo item thực tế trong Tụ Bảo Các -->
      <button data-src="tubao" data-item="item_1732562155680">Đan Dược Đế Phẩm (1)(+3112 Tu Vi)</button>
        <button data-src="tubao" data-item="item_1739526256461">Đan Dược Đế Phẩm (2)(+3112 Tu Vi)</button>
          <button data-src="tubao" data-item="item_1748710720798">Đan Dược Đế Phẩm (3)(+3112 Tu Vi)</button>
            <button data-src="tubao" data-item="item_1748710720799">Đan Dược Đế Phẩm (4)(+3112 Tu Vi)</button>
       <button data-src="tubao" data-item="item_1748710720800">Đan Dược Thánh Phẩm (1)(+4360 Tu Vi)</button>
        <button data-src="tubao" data-item="item_1748710720801">Đan Dược Thánh Phẩm (2)(+4360 Tu Vi)</button>
    </div>
  </div>

  <div style="text-align:center;margin-top:10px">
    <button id="closeBuyDanPopup" style="background:#333;border:1px solid #444;color:#fff;padding:6px 12px;border-radius:8px;cursor:pointer">Đóng</button>
  </div>
`;
document.body.appendChild(popup);
// style nút
popup.querySelectorAll("button[data-item]").forEach(btn => {
  btn.style.cssText = `padding:8px;border-radius:8px;border:1px solid #444;background:#222;color:#fff;cursor:pointer;`;
});
// ===== TÔNG MÔN =====
async function buyDanTongMon(item_id) {
  const nonce = localStorage.getItem("HH3D_NONCE_WP") || "";
  if (!nonce) return alert("❌ Không có nonce Tông Môn!");

  const res = await fetch("/wp-json/tong-mon/v1/buy-dan-duoc-tm", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-WP-Nonce": nonce
    },
    body: JSON.stringify({ item_id })
  });

  const data = await res.json();
  console.log("TongMon:", data);
  if (data.success) alert("✅ Mua Đan Tông Môn thành công!");
  else alert(`⚠ ${data.message || "Mua Tông Môn thất bại!"}`);
}
// ================== ĐẢM BẢO CÓ Ajax_Shop ==================
function ensureTuBaoAjaxShop(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    // Nếu đã có sẵn (đang ở trang Tụ Bảo Các)
    const direct = (typeof unsafeWindow !== "undefined" && unsafeWindow.Ajax_Shop) || window.Ajax_Shop;
    if (direct?.nonce && direct?.ajaxurl) {
      return resolve(direct);
    }
    // Tạo iframe ẩn để load trang
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;";
    iframe.src = "/tu-bao-cac";
    document.body.appendChild(iframe);
    const start = Date.now();
    const timer = setInterval(() => {
      try {

        const win = iframe.contentWindow;
        const ajaxShop = win?.Ajax_Shop;
        if (ajaxShop?.nonce && ajaxShop?.ajaxurl) {
          clearInterval(timer);
          document.body.removeChild(iframe);
          resolve(ajaxShop);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          document.body.removeChild(iframe);
          reject(new Error("Timeout: Không lấy được Ajax_Shop từ /tu-bao-cac"));
        }
      } catch (e) {
        // cross-origin hoặc chưa load xong → chờ tiếp
      }
    }, 300);
  });
}
async function buyDanTuBao(item_id) {
  let ajaxShop;
  try {
    ajaxShop = await ensureTuBaoAjaxShop();
  } catch (e) {
    console.error(e);
    return alert("❌ Không thể load Tụ Bảo Các để lấy nonce. Hãy mở trang đó 1 lần rồi thử lại.");
  }
  const form = new URLSearchParams();
  form.set("action", "handle_buy_danduoc");
  form.set("danduoc_id", item_id);
  form.set("nonce", ajaxShop.nonce);
  const res = await fetch(ajaxShop.ajaxurl || "/wp-admin/admin-ajax.php", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: form.toString()
  });
  const data = await res.json();
  if (data.success) alert("✅ Mua Đan Tụ Bảo Các thành công!");
  else alert(`⚠ ${data.data?.message || data.message || "Mua Tụ Bảo Các thất bại!"}`);
}
// ===== SỰ KIỆN =====
buyDanBtn.onclick = () => popup.style.display = "block";
popup.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-item]");
  if (!btn) return;
  const src = btn.getAttribute("data-src");
  const item = btn.getAttribute("data-item");
  if (src === "tongmon") buyDanTongMon(item);
  if (src === "tubao") buyDanTuBao(item);
});
document.getElementById("closeBuyDanPopup").onclick = () => {
  popup.style.display = "none";
};
GM_addStyle(`
/* ===== NÚT HẤP THỤ ===== */
.hapthu-btn{width:100%;padding:10px;border-radius:8px;border:1px solid #444;background:linear-gradient(90deg,#222,#2a2a2a);color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:.25s;}
.hapthu-btn.hapthu-hint{animation: hapthuPulse 1.6s infinite;}
@keyframes hapthuPulse{0%{box-shadow:0 0 0 rgba(255,215,0,0)}50%{box-shadow:0 0 12px rgba(255,215,0,.5)}100%{box-shadow:0 0 0 rgba(255,215,0,0)}}
.hapthu-btn.hapthu-running{background:linear-gradient(90deg,#0f5132,#198754);box-shadow:0 0 14px rgba(40,167,69,.8); animation:none;cursor:wait;}
.hapthu-btn:disabled{opacity:.6;cursor:not-allowed;}
.menu-row{display:flex;justify-content:space-between;align-items:center;padding:6px;font-size:14px;user-select:none;color:#fff}
.menu-title{display:flex;align-items:center;gap:6px}
.menu-count{font-size:11px;padding:1px 6px;border-radius:10px;font-weight:600;display:none;}
.menu-count.incomplete{background:#7a1e1e;color:#ffb3b3;}
.menu-count.complete{ background:#1f8f4a;color:#b8ffd2;}
.switch{position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0}
.switch input{opacity:0;width:0;height:0}
.slider{position:absolute;inset:0;background:#555;border-radius:24px;cursor:pointer;transition:.22s
}.slider:before{content:"";position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%; transition:.22s
}input:checked+.slider{background:#28a745}input:checked+.slider:before{transform:translateX(18px)}
`);
// =LOGIC ĐẾM ==
const menuMax = {
  PhucLoi: 4,
  ThiLuyen: 3,
  HoangVuc: 5,
  BiCanh: 5
};

function getMenuData(){
  return JSON.parse(localStorage.getItem("AUTO_MENU_COUNT") || "{}");
}
function saveMenuData(d){
  localStorage.setItem("AUTO_MENU_COUNT", JSON.stringify(d));
}
function incMenu(key){
  const d = getMenuData();
  d[key] = (d[key] || 0) + 1;
  if (d[key] > menuMax[key]) d[key] = menuMax[key];
  saveMenuData(d);
  renderMenuCount(key);
}
function renderMenuCount(key){
  const d = getMenuData();
  const el = document.getElementById("count"+key);
  if (!el) return;
  // chưa chạy lần nào trong ngày → ẨN
  if (d[key] == null) {
    el.style.display = "none";
    el.className = "menu-count";
    return;
  }
  const cur = d[key];
  const max = menuMax[key];
  el.style.display = "inline-block";
  el.textContent = `${cur}/${max}`;
  // reset class
  el.className = "menu-count";
  // đủ hay chưa đủ
  if (cur >= max) {
    el.classList.add("complete");
  } else {
    el.classList.add("incomplete");
  }
}
function renderAllMenu(){
  Object.keys(menuMax).forEach(renderMenuCount);
}

// == RESET QUA NGÀY =
(function autoResetByDay(){
  const today = new Date().toDateString();
  const last = localStorage.getItem("AUTO_MENU_DAY");
  if (last !== today) {
    localStorage.removeItem("AUTO_MENU_COUNT");
    localStorage.setItem("AUTO_MENU_DAY", today);
  }
})();
renderAllMenu();
// HOOK HH3D TOAST
(function hookHH3DToast(){
  if (window.__hh3dToastHooked) return;
  window.__hh3dToastHooked = true;
  function handleToastText(text){
    if (!text) return;
    text = text.trim();
    const thiLuyenRegex =
      /^🎉\s*Chúc mừng đạo hữu mở Thí Luyện Tông Môn cấp\s+\d+\s+nhận được\s+\d+\s+Tinh Thạch\.$/i;
    if (thiLuyenRegex.test(text)) {
      incMenu("ThiLuyen");
      return;
    }
const phucLoiConRuongRegex =
  /^📢\s*Chúc mừng nhận được\s+\d+\s+Tu Vi,\s*quay lại sau thời gian đếm ngược để mở rương\s+(Phàm Giới|Địa Nguyên|Thiên Cơ|Chí Tôn)!$/i;
const phucLoiHoanThanhRegex =
  /^📢\s*Chúc mừng nhận được\s+\d+\s+Tu Vi\s+và đã hoàn thành Phúc Lợi ngày hôm nay\.$/i;
if (phucLoiConRuongRegex.test(text)) {
  incMenu("PhucLoi");
  return;
}
if (phucLoiHoanThanhRegex.test(text)) {
  incMenu("PhucLoi");
  return;}
    if (/Đang tấn công Boss/i.test(text)) {
      incMenu("HoangVuc");
      return;}
    const biCanhMatch = text.match(/Còn\s*(\d+)\s*\/\s*(\d+)\s*lượt/i);
    if (biCanhMatch && /\+3 điểm tông khố/i.test(text)) {
      const con = parseInt(biCanhMatch[1], 10);
      const tong = parseInt(biCanhMatch[2], 10);
      const daDung = tong - con;
      if (daDung >= 0) {
        const d = getMenuData();
        d.BiCanh = Math.min(daDung, menuMax.BiCanh);
        saveMenuData(d);
        renderMenuCount("BiCanh");
      }
      return;
    }}function observe(container){
    const obs = new MutationObserver(muts=>{
      muts.forEach(m=>{
        m.addedNodes.forEach(n=>{
          if (!(n instanceof HTMLElement)) return;
          const textEl =
            n.querySelector?.("div[style*='flex:1']") ||
            n.querySelector?.("div");

          if (textEl) {
            handleToastText(textEl.innerText || "");
          }
        });
      });
    });

    obs.observe(container,{ childList:true });
  }const wait = setInterval(()=>{
    const c = document.getElementById("toastContainer");
    if (c) {
      clearInterval(wait);
      observe(c);
    }
  },300);})();
// ========== DRAG & DROP MENU ==========
(function enableMenuDrag(){
  const menu = document.getElementById("autoMenu");
  if(!menu) return;

  // load vị trí đã lưu
  let x = localStorage.getItem("autoMenuX");
  let y = localStorage.getItem("autoMenuY");

  if(x && y){
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.style.right = "auto";
    menu.style.position = "fixed";
  }

  let drag = false;
  let moved = false;
  let off = [0,0];
  let startX = 0, startY = 0;

  let ticking = false;

  const getClient = e =>
    e.touches && e.touches.length
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };

  // ===== START =====
  const start = e => {
    if(["INPUT","BUTTON","LABEL","SPAN"].includes(e.target.tagName)) return;

    const p = getClient(e);

    drag = true;
    moved = false;

    startX = p.x;
    startY = p.y;

    off = [menu.offsetLeft - p.x, menu.offsetTop - p.y];

    e.preventDefault();
  };

  // ===== MOVE (SMOOTH) =====
  const move = e => {
    if(!drag) return;

    const p = getClient(e);
    // chống nhạy
    if(!moved){
      if(Math.abs(p.x - startX) < 4 && Math.abs(p.y - startY) < 4){
        return;
      }
      moved = true;
    }
    if (!ticking) {
      requestAnimationFrame(() => {
        menu.style.left = (p.x + off[0]) + "px";
        menu.style.top = (p.y + off[1]) + "px";
        menu.style.right = "auto";
        menu.style.position = "fixed";
        ticking = false;
      });
      ticking = true;
    }
  };
  // ===== STOP =====
  const stop = () => {
    if(drag && moved){
      localStorage.setItem("autoMenuX", menu.offsetLeft);
      localStorage.setItem("autoMenuY", menu.offsetTop);
    }
    drag = false;
  };
  // ===== EVENTS (bỏ capture để mượt hơn) =====
  menu.addEventListener("mousedown", start);
  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", stop);
  menu.addEventListener("touchstart", start);
  document.addEventListener("touchmove", move);
  document.addEventListener("touchend", stop);
})();
const togglePL=document.getElementById("togglePhucLoi"),
      toggleTL=document.getElementById("toggleThiLuyen"),
      toggleHV=document.getElementById("toggleHoangVuc"),
      toggleBC=document.getElementById("toggleBiCanh"),
      toggleTD=document.getElementById("toggleTienDo");
// ==================== NÚT NHỎ DƯỚI MENU ====================
const bottomTools=document.createElement("div");
bottomTools.style="margin-top:10px;padding-top:8px;border-top:1px solid #555;display:flex;flex-direction:column;gap:6px;width:100%";
GM_addStyle(`
#autoMenu .menu-btn{background:#444;color:#fff;border:none;padding:6px;border-radius:6px;cursor:pointer;font-size:12px;flex:1;text-align:center}
#autoMenu .menu-btn.green{background:#27ae60}
`);
bottomTools.innerHTML = `
    <!-- Hàng 1 -->
    <div style="display:flex; gap:6px; flex-wrap:nowrap;">
        <button id="btnRewardLV" class="menu-btn" title="Thưởng Luận Võ">🎁</button>
        <button id="btnFlower" class="menu-btn" title="Tặng Hoa">🌹</button>
        <button id="btnActivityReward" class="menu-btn" title="Thưởng Hoạt Động">📦</button>
        <button id="btnSpin" class="menu-btn" title="Vòng Quay">🎡</button>
    </div>
    <!-- Hàng 2 -->
    <div style="display:flex; gap:6px; flex-wrap:nowrap;">
        <button id="btnRuongLB" class="menu-btn" title="Mua Rương Linh Bảo HV">🛒</button>
        <button id="btnWedding" class="menu-btn" title="Phòng Cưới">❤️</button>
        <button id="btnKhoang" class="menu-btn" title="Khoáng Mạch">⛏️</button>
        <button id="btnDoThach" class="menu-btn" title="Đổ Thạch">💎</button>
    </div>
<!-- Hàng 3 -->
<div style="display:flex; gap:6px; flex-wrap:nowrap;">
  <button id="btnDiemDanh" class="menu-btn" title="Điểm Danh + Tế Lễ Vấn Đáp">📅</button>
<button id="btnLuanVo" class="menu-btn" title="Mê Cung" style="padding:2px">
  <div class="icon" style="background:rgba(224,201,127,.16)">
    <span class="material-icons" style="color:#e0c97f">auto_awesome</span>
  </div>
</button>
    <button id="btnSeal" class="menu-btn" title="Khắc Trận Văn">🧿</button>
  <button id="btnToastHistory" class="menu-btn" title="Lịch sử thông báo">📜</button>
</div>
`;
menu.appendChild(bottomTools);
// Popup tặng bông
const popupDiv=document.createElement("div");
popupDiv.style="position:fixed;top:120px;right:20px;background:#1e1e1e;border:1px solid #555;border-radius:8px;padding:10px;color:#fff;font-size:14px;z-index:100000;display:none;min-width:200px;";
const savedState = localStorage.getItem("menuCollapsed") === "1";
/// THU MENU
const collapseBtn = document.createElement("button");
collapseBtn.id = "collapseBtn";
collapseBtn.textContent = savedState ? "+" : "–";

collapseBtn.style = `
position:absolute;
top:6px;
right:6px;
width:26px;
height:26px;
border-radius:50%;
border:none;
background:rgba(0,0,0,.6);
color:#fff;
cursor:pointer;
font-size:16px;
display:flex;
align-items:center;
justify-content:center;
z-index:100000;
`;

menu.appendChild(collapseBtn);

let collapsed = false;

function applyMenuState(state){
  collapsed = state;

  if(collapsed){
    menu.classList.add("collapsed");
    collapseBtn.textContent = "+";
  }else{
    menu.classList.remove("collapsed");
    collapseBtn.textContent = "–";
  }

  localStorage.setItem("menuCollapsed", collapsed ? "1" : "0");
}

applyMenuState(savedState);

collapseBtn.onclick = () => {
  applyMenuState(!collapsed);
};
document.body.appendChild(popupDiv);
    const domainInput = document.getElementById("domainConfigInput");
// load domain đã lưu
domainInput.value = getCurrentDomain();
domainInput.addEventListener("change", () => {
  let val = domainInput.value.trim();
  val = val.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!val) {
    showToast("❌ Domain không hợp lệ", "error");
    return;
  }
  localStorage.setItem(DOMAIN_KEY, val);
  showToast("✅ Đã lưu url reload lại trang để tiếp tục: " + val, "success");
});
const btnReward = document.getElementById("btnActivityReward");
btnReward.addEventListener("click", async () => {
  if (activityRewardRunning) {
    showToast("⏳ Đang xử lý, đừng bấm liên tục");
    return;
  }
  activityRewardRunning = true;
  btnReward.disabled = true;
  btnReward.style.opacity = "0.6";
  try {
    // 🎁 Nhận toàn bộ hoạt động
    await claimAllActivityRewards();
    // ⏱️ chờ nhẹ

    await new Promise(r => setTimeout(r, 500));
    await spinLottery();
    showToast("✅ Đã nhận hoạt động + Vòng Quay");
  } catch (e) {
    console.error("[ACTIVITY+LUANVO]", e);
    showToast("❌ Lỗi khi nhận thưởng");
  }
  btnReward.disabled = false;
  btnReward.style.opacity = "1";
  activityRewardRunning = false;
});
let activityRewardRunning = false;
document.getElementById("btnToastHistory")?.addEventListener("click", showToastHistory);
document.getElementById("btnKhoang").addEventListener("click", showKhoangPopup);
document.getElementById("btnDoThach").addEventListener("click", autoDoThachSilent);
document.getElementById("btnSpin").addEventListener("click", spinLottery);
document.getElementById("btnDiemDanh").addEventListener("click", async () => {await dailyCheckIn(); await doTeLe(); await autoQuiz();});
document.getElementById("btnRewardLV").addEventListener("click", async () => {

    const PAGE_URL = "https://hoathinh3d.co/chuc-phuc-cuong-gia";
    const AJAX_URL = "/wp-content/themes/halimmovies-child/hh3d-ajax.php";

    showToast("🚀 Bắt đầu chúc phúc...");

    // ===== FETCH HTML =====
    const res = await fetch(PAGE_URL, {
        credentials: "include",
        cache: "no-store"
    });

    const html = await res.text();

    // ===== SECURITY =====
    let SECURITY = null;

    const patterns = [
        /security["']?\s*[:=]\s*["']([a-z0-9]{6,})/i,
        /["']security["']\s*,\s*["']([a-z0-9]{6,})/i,
        /\b([a-f0-9]{8,12})\b/i
    ];

    for (let p of patterns) {
        const match = html.match(p);
        if (match) {
            SECURITY = match[1] || match[0];
            break;
        }
    }


    // ===== HMAC (CHUẨN) =====
    let HMAC = null;

    const hmacMatch = html.match(/BP_HMAC\s*=\s*["']([a-f0-9]{64})["']/i);

    if (hmacMatch) {
        HMAC = hmacMatch[1];
        localStorage.setItem("HH3D_HMAC", HMAC);
    } else {
        // fallback cache
        HMAC = localStorage.getItem("HH3D_HMAC");
    }


    if (!SECURITY || !HMAC) {
        showToast("❌ Thiếu token!");
        return;
    }

// ===== PARSE HTML ĐỂ LẤY ID =====
const parser = new DOMParser();
const doc = parser.parseFromString(html, "text/html");

const rows = doc.querySelectorAll(".bp-row");

let ids = [];

rows.forEach(row => {
    const id = row.getAttribute("data-id");
    const btn = row.querySelector(".bp-btn-bless");

    // chưa chúc = không có class done
    if (btn && !btn.classList.contains("done")) {
        ids.push(id);
    }
});

showToast("📌 Tìm thấy " + ids.length + " người");

    // ===== LOOP =====
    for (let id of ids) {
        try {
            const body = new URLSearchParams({
                action: "bless_user",
                blessed_id: id,
                security: SECURITY,
                hmac_token: HMAC
            });

            const r = await fetch(AJAX_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body,
                credentials: "include"
            });

         const data = await r.json();

// FIX đọc message
const msg = data.message || data.data?.message || "???";

showToast(`✅ ${msg}`);

        } catch (e) {
            showToast(`❌ Lỗi ID ${id}`);
        }

        await new Promise(r => setTimeout(r, 800));
    }

    showToast("🎉 Chúc phúc xong!");

});
document.getElementById("btnRuongLB").addEventListener("click", buyRuongLB);
document.getElementById("btnFlower").addEventListener("click", async () => {
let friends = await getFriendsList();
if (friends.length === 0) {
  showToast("❌ Không có bạn nào để tặng");
  return;}
// reset popup
popupDiv.innerHTML = "";
popupDiv.style.maxHeight = "400px";
popupDiv.style.overflow = "hidden";
// ===== HEADER =====
let header = document.createElement("div");
header.style = `
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:6px;
  gap:6px;
`;
// 🌸 NÚT ƯỚC NGUYỆN
let wishBtn = document.createElement("div");
wishBtn.innerText = "🌸 Ước nguyện đạo lữ";
wishBtn.style = `
  padding:4px 8px;
  background:#d63384;
  border-radius:6px;
  cursor:pointer;
  font-weight:bold;
  font-size:12px;
`;
wishBtn.onclick = async () => {
  wishBtn.innerText = "⏳ Đang ước...";
  wishBtn.style.opacity = "0.7";
  wishBtn.style.pointerEvents = "none";
  await makeWishTree();
  setTimeout(() => {
    wishBtn.innerText = "🌸 Ước nguyện";
    wishBtn.style.opacity = "1";
    wishBtn.style.pointerEvents = "auto";
  }, 2000);
};
// ❌ NÚT ĐÓNG
let closeBtn = document.createElement("div");
closeBtn.innerText = "❌";
closeBtn.style = `
  cursor:pointer;
  color:#f55;
  font-size:14px;
`;
closeBtn.onclick = () => {
  popupDiv.style.display = "none";
};
header.appendChild(wishBtn);
header.appendChild(closeBtn);
popupDiv.appendChild(header);
// ===== TITLE =====
let title = document.createElement("div");
title.innerHTML = "🌹 <b>Chọn bạn để tặng (3 bông)</b>";
title.style = "margin-bottom:6px;font-size:13px;";
popupDiv.appendChild(title);
// ===== LIST FRIENDS  =====
let listWrap = document.createElement("div");
listWrap.style = `
  max-height:300px;
  overflow-y:auto;
`;
friends.forEach(f => {
  let btn = document.createElement("div");
  btn.style = `
    display:flex;
    align-items:center;
    gap:8px;
    padding:6px;
    margin:4px 0;
    background:#333;
    border-radius:6px;
    cursor:pointer;
  `;
  btn.innerHTML = `
    <img src="${f.avatar}" style="width:32px;height:32px;border-radius:50%;border:2px solid #666;">
    <div>
      <div style="font-weight:bold;color:#fff;">${f.display_name}</div>
      <div style="font-size:12px;color:#aaa;">Thân mật: ${f.than_mat}</div>
    </div>
  `;
  btn.onclick = () => giftFlower3(f);
  listWrap.appendChild(btn);
});

popupDiv.appendChild(listWrap);
popupDiv.style.display = "block";
});
function getWpNonce() {
  return localStorage.getItem("HH3D_NONCE_WP") || "";
}
    async function makeWishTree() {
  try {
    const nonce = localStorage.getItem("HH3D_NONCE_WP");
    if (!nonce) {
      showToast("❌ Chưa có nonce,", false);
      return;
    }
    const res = await fetch("/wp-json/hh3d/v1/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": nonce
      },
      body: JSON.stringify({
        action: "make_wish_tree"
      })
    });
    const data = await res.json();
    if (data?.success) {
      showToast("🌸 Ước nguyện thành công!", true);
    } else {
      showToast(data?.message || "❌ Ước nguyện thất bại", false);
    }
  } catch (e) {
    console.error("[MAKE WISH TREE]", e);
    showToast("❌ Lỗi kết nối khi ước nguyện", false);
  }
}
    function saveToastHistory() {
  localStorage.setItem(
    TOAST_HISTORY_KEY,
    JSON.stringify(TOAST_HISTORY.slice(-MAX_TOAST_HISTORY))
  );
}
 function showToastHistory() {
  // không mở trùng
  if (document.getElementById("toastHistoryOverlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "toastHistoryOverlay";
  overlay.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.75);
    z-index:1000000;
    display:flex;
    align-items:center;
    justify-content:center;
  `;
  const box = document.createElement("div");
  box.style.cssText = `
    width:520px;
    max-height:70vh;
    background:#0d0d0d;
    color:#fff;
    border-radius:12px;
    box-shadow:0 20px 60px rgba(0,0,0,.9);
    display:flex;
    flex-direction:column;
    overflow:hidden;
  `;
  box.innerHTML = `
    <div style="
      padding:14px 18px;
      border-bottom:1px solid rgba(255,255,255,.08);
      display:flex;
      justify-content:space-between;
      align-items:center;
    ">
      <b>📜 Lịch sử thông báo</b>
      <div>
        <button id="btnClearToastHistory" style="
          background:#222;
          color:#ff4d4f;
          border:none;
          padding:6px 10px;
          border-radius:6px;
          cursor:pointer;
          margin-right:6px;
        ">Clear</button>
        <button id="btnCloseToastHistory" style="
          background:#222;
          color:#aaa;
          border:none;
          padding:6px 10px;
          border-radius:6px;
          cursor:pointer;
        ">✕</button>
      </div>
    </div>
    <div id="toastHistoryList" style="
      padding:12px;
      overflow:auto;
      font-size:13px;
      line-height:1.45;
    "></div>
  `;
  const list = box.querySelector("#toastHistoryList");
  if (!TOAST_HISTORY.length) {
    list.innerHTML = `<div style="color:#777">Chưa có thông báo nào</div>`;
  } else {
    TOAST_HISTORY.slice().reverse().forEach(t => {
      list.innerHTML += `
        <div style="
          padding:8px 10px;
          margin-bottom:6px;
          background:#151515;
          border-left:4px solid ${t.preview ? "#444" : "#ff4d4f"};
          border-radius:6px;
        ">
          <div style="opacity:.55;font-size:11px">${t.time}</div>
          <div>${t.preview ? "" : "❌ "}${t.msg}</div>
        </div>
      `;
    });
  }
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  // events
  overlay.onclick = e => {
    if (e.target === overlay) overlay.remove();
  };
  box.querySelector("#btnCloseToastHistory").onclick = () => overlay.remove();
  box.querySelector("#btnClearToastHistory").onclick = () => {
    TOAST_HISTORY.length = 0;
    list.innerHTML = `<div style="color:#777">Đã xóa lịch sử</div>`;
  };
}

/* ================== PROFILE INFO ================== */
async function updateProfileInfo() {
  const infoBox = document.getElementById("autoProfileInfo");
  if (!infoBox) return;
  /* --- Avatar + Tên --- */
  const avatarBox =
    document.querySelector(".avatar-container-header")?.outerHTML ||
    `<div style="width:36px;height:36px;background:#333;border-radius:50%;"></div>`;
  const nameHtml =
    document.querySelector("#ch_head_name")?.innerHTML.trim() || "Tên NV ?";
  const statsHtml = [...document.querySelectorAll("#head_manage_acc div")].map(
    (e) => e.outerHTML
  );

  const tuvi = statsHtml.find((t) => t.includes("Tu Vi")) || `<div>✨ Tu Vi: ?</div>`;
  const thach =
    statsHtml.find((t) => t.includes("Tinh Thạch")) || `<div>💎 Tinh Thạch: ?</div>`;
  const ngoc =
    statsHtml.find((t) => t.includes("Tiên Ngọc")) || `<div>🔮 Tiên Ngọc: ?</div>`;
  infoBox.innerHTML = `
    <div style="text-align:center;margin-bottom:6px;">${avatarBox}</div>
    <div style="text-align:center;margin:4px 0;line-height:2.6em;">
      ${nameHtml}
    </div>
    ${tuvi}${thach}${ngoc}
    <div id="xu-info" style="margin-top:6px;font-size:13px;line-height:1.8em;"></div>
    <div id="reward-progress-wrap" style="margin-top:6px;"></div>
  `;
  const avatar = infoBox.querySelector(".avatar-container-header");
  if (avatar) {
    avatar.style.width = "36px";
    avatar.style.height = "36px";
  }
/* = Xu == */
try {
  const res = await fetch(buildUrl("/vip-hh3d"), { credentials: "include" });
  const html = await res.text();
  const xuRaw = html.match(/id="current-coins">([\d,\.]+)/)?.[1] || "?";
  const xukhoaRaw = html.match(/id="current-coins-locked">([\d,\.]+)/)?.[1] || "?";
  const xuNumber = xuRaw !== "?" ? parseInt(xuRaw.replace(/[.,]/g, ""), 10) : "?";
  const xukhoaNumber = xukhoaRaw !== "?" ? parseInt(xukhoaRaw.replace(/[.,]/g, ""), 10) : "?";
  const xuDisplay = xuNumber !== "?" ? xuNumber.toLocaleString("vi-VN").replace(/,/g, ".") : "?";
  const xukhoaDisplay = xukhoaNumber !== "?" ? xukhoaNumber.toLocaleString("vi-VN").replace(/,/g, ".") : "?";

  const xuBox = document.getElementById("xu-info");
  if (xuBox) {
    xuBox.innerHTML = `
      <div>🪙 Xu: ${xuDisplay}</div>
      <div>🔒 Xu Khóa: ${xukhoaDisplay}</div>
    `;
  }
} catch (err) {
}
await fetchActivityProgress();
startActivityAutoLoop();
}
setTimeout(updateProfileInfo, 100);
/* ==AUTO HẤP THỤ LINH THẠCH ==== */
(function () {
  'use strict';
  /* ========= CONFIG ========= */
  const HAPTHU_POST_ID = 60534;
  const HAPTHU_COMMENT_API =
    "/wp-content/plugins/wpdiscuz/utils/ajax/wpdiscuz-ajax.php";
  const HAPTHU_REDEEM_API =
    "/wp-content/themes/halimmovies-child/hh3d-ajax.php";
  const HAPTHU_PAGE_URL = "/linh-thach";
let hapThuNonce = null;
  let hapThuRunning = false;
  let hapThuTimer = null;
let hapThuData = {
  nonce: null,
  hold_timestamp: null,
  lt_token: null
};

/* ========= GET NONCE + TIMESTAMP ========= */
async function getSecurityNonce(url) {
  try {
    console.log("[HAPTHU] Fetch:", url);

    const html = await fetch(url, {
      credentials: "include",
      cache: "no-store"
    }).then(r => r.text());

    console.log("[HAPTHU] HTML length:", html.length);

    /* ========= NONCE ========= */
    const patterns = [
      /redeemNonce\s*=\s*['"]([a-f0-9]+)['"]/i,
      /["']redeemNonce["']\s*:\s*["']([a-f0-9]+)["']/i,
      /linh_thach_nonce\s*[:=]\s*['"]([a-f0-9]+)['"]/i,
      /["']nonce["']\s*:\s*["']([a-f0-9]+)["']/i
    ];

    let foundNonce = null;

    for (const regex of patterns) {
      const match = html.match(regex);
      if (match) {
        foundNonce = match[1];
        console.log("[HAPTHU] ✅ Nonce:", foundNonce);
        break;
      }
    }

    if (!foundNonce) {
      console.warn("[HAPTHU] ❌ Không tìm thấy nonce");
      return null;
    }

    /* ========= LT_TOKEN ========= */
    let foundToken = null;

    // 🔥 1. Ưu tiên parse từ HTML (CHUẨN NHẤT)
    let m =
      html.match(/securityToken["']?\s*:\s*["']([^"']+)/i) ||
      html.match(/"securityToken"\s*:\s*"([^"]+)"/i);

    if (m) {
      foundToken = m[1];
      console.log("[HAPTHU] ✅ lt_token từ HTML:", foundToken);
    }

    // 🔥 2. fallback window
    if (!foundToken && window.hh3dData?.securityToken) {
      foundToken = window.hh3dData.securityToken;
      console.log("[HAPTHU] ✅ lt_token từ window:", foundToken);
    }

    // 🔥 3. debug nếu vẫn null
    if (!foundToken) {
      console.warn("[HAPTHU] ❌ Không tìm thấy lt_token");
      console.log("[HAPTHU] DEBUG securityToken:", html.match(/securityToken/i));
      console.log("[HAPTHU] DEBUG hh3dData:", window.hh3dData);
    }

    /* ========= RETURN ========= */
    const timestamp = Math.floor(Date.now() / 1000);

    hapThuData = {
      nonce: foundNonce,
      hold_timestamp: timestamp,
      lt_token: foundToken
    };

    console.log("[HAPTHU] FINAL DATA:", hapThuData);

    return hapThuData;

  } catch (e) {
    console.error("[HAPTHU] getSecurityNonce error", e);
  }

  return null;
}
/* ========= FETCH NONCE ========= */
async function fetchHapThuNonce() {
  const url = HAPTHU_PAGE_URL + "?t=" + Date.now();

  const data = await getSecurityNonce(url);

  if (data && data.nonce) {
    hapThuNonce = data.nonce;

    localStorage.setItem("HH3D_REDEEM_NONCE", data.nonce);
    localStorage.setItem("HH3D_TS", data.hold_timestamp);
    return true;
  }

  console.error("[HAPTHU] ❌ Không lấy được nonce");
  showToast("❌ Không lấy được nonce Hấp Thụ");

  return false;
}

/* ========= REDEEM ========= */
async function redeemHapThu(code) {
  if (!hapThuData.nonce) {
    showToast("⚠️ Chưa có nonce");
    return false;
  }

  console.log("[HAPTHU] 🚀 Redeem với:", hapThuData, "code:", code);

  try {
    const resp = await fetch(HAPTHU_REDEEM_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      credentials: "include",
      body: new URLSearchParams({
        action: "redeem_linh_thach",
        code: code,
        nonce: hapThuData.nonce,
        lt_token: hapThuData.lt_token || "",
        hold_timestamp: hapThuData.hold_timestamp
      })
    });

    const res = await resp.json();

    console.log("[HAPTHU] 📥 Response:", res);

    if (res?.data?.message) {
      showToast(res.data.message);
    } else {
      showToast("⚠️ Không có message");
    }

    return !!res?.success;

  } catch (e) {
    console.error("[HAPTHU] ❌ Fetch lỗi:", e);
    showToast("❌ Lỗi mạng");
    return false;
  }
}
async function fetchLatestHapThuCode() {
  console.log("[HAPTHU] Fetch code...");

  const fd = new FormData();
  fd.append("action", "wpdLoadMoreComments");
  fd.append("sorting", "newest");
  fd.append("offset", "0");
  fd.append("isFirstLoad", "1");
  fd.append("wpdType", "post");
  fd.append("postId", HAPTHU_POST_ID);
  fd.append("lastParentId", "0");

  try {
    const res = await fetch(HAPTHU_COMMENT_API, {
      method: "POST",
      credentials: "include",
      body: fd
    }).then(r => r.json());

    if (!res?.data?.comment_list) {
      console.warn("[HAPTHU] Không có comment_list");
      return null;
    }

    const div = document.createElement("div");
    div.innerHTML = res.data.comment_list;

    const nodes = div.querySelectorAll(".wpd-comment, .wpd-comment-text");

    // 🔥 Hàm bắt code xịn
    function extractCode(text) {
      if (!text) return null;

      text = text.replace(/\u00a0/g, " ").trim();

      // ✅ 1. Ưu tiên keyword
      let m = text.match(/(?:code|mã)[^a-z0-9]{0,30}([A-Z0-9]{4,})/i);
      if (m) return m[1].toUpperCase();

      // ✅ 2. fallback: chuỗi IN HOA
      const matches = text.match(/\b[A-Z0-9]{6,}\b/g);
      if (matches && matches.length) {
        const filtered = matches
          .filter(x =>
            x.length >= 6 &&
            x.length <= 20 &&
            !/^(HTTP|HTTPS|HTML|ID|USER)/.test(x)
          )
          .sort((a, b) => b.length - a.length);

        if (filtered.length) return filtered[0];
      }

      return null;
    }

    // 🔥 duyệt comment
    for (const cmt of nodes) {
      const text = (cmt.innerText || "").trim();

      // 👉 bắt nhanh
      let code = extractCode(text);
      if (code) {
        showToast(`🎁 Code mới: ${code}`);
        console.log("[HAPTHU] ✅ Code nhanh:", code);
        return code;
      }

      // 👉 fetch full comment nếu cần
      const idMatch = (cmt.id || "").match(/wpd-comm-(\d+)_/);
      if (!idMatch) continue;

      const fullText = await fetchFullCommentById(idMatch[1]);
      if (!fullText) continue;

      code = extractCode(fullText);
      if (code) {
        showToast(`🎁 Code mới: ${code}`);
        console.log("[HAPTHU] ✅ Code full:", code);
        return code;
      }
    }

    console.warn("[HAPTHU] Không tìm thấy code");
    showToast("❌ Không tìm thấy code mới");
    return null;

  } catch (e) {
    console.error("[HAPTHU] Lỗi fetch:", e);
    showToast("❌ Lỗi lấy comment");
    return null;
  }
}
async function runAutoHapThuOnce() {
  if (hapThuRunning) {
    showToast("⏳ Hấp Thụ đang chạy, đừng bấm liên tục");
    return;
  }
  hapThuRunning = true;
  try {
    showToast("✨ Bắt đầu Hấp Thụ Linh Thạch");
    hapThuNonce = null;
    localStorage.removeItem("HH3D_REDEEM_NONCE");
    const ok = await fetchHapThuNonce();
    if (!ok) {
      showToast("❌ Không lấy được nonce");
      return;
    }
    // 📥 LẤY CODE MỚI NHẤT
    const code = await fetchLatestHapThuCode();
    if (!code) {
      showToast("⚠️ Không tìm thấy code mới");
      return;
    }
    // 🎁 REDEEM
    await redeemHapThu(code);
  } catch (e) {
    console.error("Hấp Thụ lỗi:", e);
    showToast("❌ Có lỗi xảy ra khi Hấp Thụ");
  } finally {
    hapThuRunning = false;
  }
}
async function fetchFullCommentById(commentId) {
  const fd = new FormData();
  fd.append("action", "wpdReadMore");
  fd.append("commentId", commentId);
  fd.append("postId", HAPTHU_POST_ID);
  try {
    const res = await fetch(HAPTHU_COMMENT_API, {
      method: "POST",
      credentials: "include",
      body: fd
    }).then(r => r.json());
    const html =
      res?.data?.message ||
      res?.data?.comment ||
      res?.data?.html ||
      "";
    if (!html) {
      console.warn("[HAPTHU] wpdReadMore không có html");
      return "";
    }
    const div = document.createElement("div");
    div.innerHTML = html;
    const text = (div.innerText || "").replace(/\u00a0/g, " ").trim();
    return text;
  } catch (e) {
    console.error("fetchFullCommentById error", e);
    return "";
  }
}
/* ========= CLICK → CHẠY 1 LẦN ========= */
(function bindHapThuButton(){
  const btn = document.getElementById("hapThuBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (hapThuRunning) return;
    btn.disabled = true;
    btn.classList.remove("hapthu-hint");
    btn.classList.add("hapthu-running");
    btn.textContent = "⏳ Đang Hấp Thụ...";
    await runAutoHapThuOnce();
    btn.textContent = "✨ Hấp Thụ Linh Thạch";
    btn.classList.remove("hapthu-running");
    btn.classList.add("hapthu-hint");
    btn.disabled = false;
  });
})();
})();
/* =AUTO ACTIVITY =*/
let autoBHDRunning = false;
let isFirstBHDRender = true;
let isUIOnlyFetch = true;
let activityLoopRunning = false;
/* --- reset qua ngày --- */
(function initActivityAuto() {
  const today = new Date().toDateString();
  const last = localStorage.getItem("ACTIVITY_DAY");
  if (last !== today) {
    localStorage.removeItem("ACTIVITY_DONE_DAY");
    localStorage.setItem("ACTIVITY_DAY", today);
  }
})();
/* --- random 0–60 phút --- */
function getRandomActivityDelay() {
  return Math.floor(Math.random() * 60 * 60 * 1000);
}
/* --- vòng lặp fetch nền --- */
function startActivityAutoLoop() {
  if (activityLoopRunning) return;
  activityLoopRunning = true;
  const scheduleNext = () => {
    const delay = getRandomActivityDelay();
    console.log("⏱️ Activity next fetch:", Math.round(delay / 1000), "s");
    setTimeout(async () => {
      const today = new Date().toDateString();
      if (localStorage.getItem("ACTIVITY_DONE_DAY") === today) {
        activityLoopRunning = false;
        return;
      }
      await fetchActivityProgress();
      scheduleNext(); // lên lịch lần sau
    }, delay);
  };
  // ⛔ Không fetch ngay
  // ✅ Chỉ lên lịch cho lần sau
  scheduleNext();
}
    function parseBHDProgressFromDoc(doc){
  const text = doc.body.innerText || "";
  const match = text.match(
    /Điểm danh\s*\d+%.*Luận Võ\s*\d+%.*Hoang Vực\s*\d+%.*Phúc Lợi\s*\d+%.*Vấn Đáp\s*\d+%/
  );
  if(!match) return null;
  const progress = {};
  const regex = /(Điểm danh|Luận Võ|Hoang Vực|Phúc Lợi|Vấn Đáp)\s*(\d+)%/g;
  let m;
  while((m = regex.exec(match[0])) !== null){
    progress[m[1]] = parseInt(m[2],10);
  }
  return progress;
}
async function fetchActivityProgress() {
  try {
    const res = await fetch(buildUrl("/nhiem-vu-hang-ngay"), {
      credentials: "include",
      cache: "no-store",
    });

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    /* ===== progress tổng ===== */
    const percent =
      doc.querySelector(".nv-ring-label")?.textContent.trim() || "0%";

    const wrap = document.getElementById("reward-progress-wrap");

    if (wrap) {
      wrap.innerHTML = `
        <div style="font-size:12px;margin-bottom:4px;color:#ccc;">
          Hoạt động <span style="float:right;">${percent}</span>
        </div>
        <div style="width:100%;height:6px;background:#2a2a2a;
                    border-radius:999px;overflow:hidden;">
          <div style="width:${percent};height:100%;
                      border-radius:999px;
                      background:linear-gradient(90deg,#ff4ecd,#b84cff);
                      box-shadow:0 0 6px rgba(255,78,205,.6);
                      transition:width .4s ease;"></div>
        </div>
      `;
    }

    /* ===== auto nhận thưởng ===== */
    if (!isUIOnlyFetch && percent === "100%") {
      await autoClaimActivityAll();
    }

    if (isUIOnlyFetch) {
      isFirstBHDRender = false;
      isUIOnlyFetch = false;
      return;
    }

    /* ===== parse nhiệm vụ ===== */
    const progress = {};

    doc.querySelectorAll(".nv-quest").forEach(q => {
      const name = q.querySelector("h4")?.innerText.trim();
      const prog = q.querySelector(".nv-prog-txt")?.innerText.trim();

      if (!name || !prog) return;

      const match = prog.match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) return;

      const cur = parseInt(match[1]);
      const max = parseInt(match[2]);

      progress[name] = max > 0 ? Math.round((cur / max) * 100) : 0;
    });

    if (autoBHDRunning) return;

    autoBHDRunning = true;

    try {
      const diemDanh = progress["Điểm Danh"] || progress["Điểm danh"] || 0;
      const vanDap = progress["Vấn Đáp"] || 0;

      /* ===== Điểm danh + Vấn đáp ===== */
      if (diemDanh < 100 || vanDap < 100) {

        if (typeof dailyCheckIn === "function") {
          await dailyCheckIn();
          await new Promise(r => setTimeout(r, 800));
        }

        if (typeof doTeLe === "function") {
          await doTeLe();
          await new Promise(r => setTimeout(r, 800));
        }

        if (typeof autoQuiz === "function") {
          await autoQuiz();
          await new Promise(r => setTimeout(r, 1500));
        }
      }

    } finally {
      autoBHDRunning = false;
    }

  } catch (e) {
    console.error("[ACTIVITY]", e);
  }
}
/* --- auto nhận thưởng --- */
async function autoClaimActivityAll() {
  const today = new Date().toDateString();
  if (localStorage.getItem("ACTIVITY_DONE_DAY") === today) return;
  if (activityRewardRunning) return;
  activityRewardRunning = true;
  try {
    showToast("🎁 Hoạt động đủ 100%, đang nhận...");
    await claimAllActivityRewards();
    await new Promise((r) => setTimeout(r, 500));
    await spinLottery();
    showToast("✅ Đã nhận Hoạt Động + Vòng Quay");
    localStorage.setItem("ACTIVITY_DONE_DAY", today);
  } catch {
    showToast("❌ Lỗi nhận hoạt động");
  }
  activityRewardRunning = false;
}
    // LẤy TOKEN PHÁP TƯỚNG
    let AUTO_SEAL = false;
let isSealing = false;
    let PT_TOKEN_CACHE = null;
async function getCachedPtToken(forceRefresh = false) {
  if (PT_TOKEN_CACHE && !forceRefresh) {
    return PT_TOKEN_CACHE;
  }
  const token = await getPtToken();
  if (token) {
    PT_TOKEN_CACHE = token;
  }
  return token;
}
    async function callPtApi(url, onSuccess) {
  let token = await getCachedPtToken(false);
  if (!token) {
    showToast("❌ Không lấy được PT token", false);
    return;
  }

  let data;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-wp-nonce": getWpNonce(),
        "x-pt-token": token
      },
      body: ""
    });
    data = await resp.json();
  } catch {
    showToast("❌ Lỗi kết nối", false);
    return;
  }

  // Nếu hết phiên → refresh token → gọi lại 1 lần
  if (
    data?.message &&
    data.message.includes("Phiên đã hết hạn")
  ) {
    console.warn("[PT] Token hết hạn, refresh lại...");

    PT_TOKEN_CACHE = null;
    token = await getCachedPtToken(true);
    if (!token) {
      showToast("❌ Không lấy lại được PT token", false);
      return;
    }

    try {
      const resp2 = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-wp-nonce": getWpNonce(),
          "x-pt-token": token
        },
        body: ""
      });
      data = await resp2.json();
    } catch {
      showToast("❌ Lỗi kết nối (retry)", false);
      return;
    }
  }

  onSuccess(data);
}

async function getPtToken() {
  const url = "/trieu-hoi-phap-tuong?t=" + Date.now();
  let html = null;
  try {
    const resp = await fetch(url, {
      cache: "no-store"
    });
    if (resp.ok) html = await resp.text();
  } catch {}

  if (!html) {
    console.warn("[PT] Không fetch được trang Pháp Tướng");
    return null;
  }

  const match = html.match(/\b[a-f0-9]{64}\b/i);
  if (!match) {
    console.warn("[PT] Không tìm thấy x-pt-token trong HTML");
    return null;
  }

  return match[0];
}
// Load thông tin
async function loadSealInfo() {
  const box = document.getElementById("sealInfo");
  const nonce = getWpNonce();

  if (!nonce) {
    box.innerHTML = "❌ Chưa có nonce";
    return;
  }

  try {
    const res = await fetch("/wp-json/phap-tuong/v1/get-seals", {
      headers: { "x-wp-nonce": nonce }
    });

    const data = await res.json();
    if (!data?.success) {
      box.innerHTML = "❌ Không lấy được dữ liệu";
      return;
    }

    box.innerHTML = `
      📦 Đã khắc: <b>${data.count}</b><br>
      💥 Xịt: <b>${data.pity_data.fail_count}</b><br>
      🎯 Tỉ lệ: <b>${data.pity_data.current_rate}%</b>
    `;
  } catch {
    box.innerHTML = "❌ Lỗi kết nối";
  }
}
    // HÀM MỞ PHÁP TƯỚNG
async function completeSummoning() {
  await callPtApi("/wp-json/phap-tuong/v1/complete-summoning", async (data) => {

    if (!data?.success) {
      showToast(data?.message || "❌ Mở Pháp Tướng thất bại", false);
      return;
    }

    showToast(data?.message || "🔥 Mở Pháp Tướng thành công!", true);
    await loadSealInfo();
  });
}
    // Hàm nhận lượt khắc hàng ngày
async function claimDailyTurns() {
  await callPtApi("/wp-json/phap-tuong/v1/claim-daily-turns", async (data) => {

    if (!data?.success) {
      showToast(data?.message || "❌ Nhận lượt thất bại", false);
      return;
    }

    showToast(
      data.message || `✨ Nhận thành công ${data.turns_claimed} lượt!`,
      true
    );

    await loadSealInfo();
  });
}
    // Hàm gọi Khắc
async function activateSeal() {
  if (isSealing) return;
  isSealing = true;

  await callPtApi("/wp-json/phap-tuong/v1/activate-seal", async (data) => {

    const msg = data?.message || "";
    const turns = data?.remaining_turns ?? "?";

    // ================= HẾT LƯỢT =================
    if (turns === 0) {
      showToast(`❌ Hết lượt khắc (${turns})`, "warn");
      AUTO_SEAL = false;
      isSealing = false;
      return;
    }

    // ================= LỖI THẬT =================
    if (!data?.success && !data?.is_pity_failure) {

      if (msg.includes("đủ 9")) {
        showToast(`🎯 Đủ 9 → triệu hồi (${turns})`, "warn");
        await completeSummoning();
      } else {
        showToast(`❌ ${msg} (${turns})`, "warn");
      }

      isSealing = false;
      if (AUTO_SEAL) setTimeout(activateSeal, 300);
      return;
    }

    // ================= PITY =================
    if (data?.is_pity_failure) {
      const pity = data?.pity_data;

      let pityText = "";
      if (pity) {
        pityText = ` (${pity.fail_count} xịt | +${pity.next_rate}%)`;
      }

      showToast(`🔸 ${msg}${pityText} (${turns})`, "warn");
    }

    // ================= SUCCESS =================
    else {
      showToast(`✨ ${msg} (${turns})`, true);
    }

    await loadSealInfo();

    isSealing = false;

    // ================= AUTO LOOP =================
    if (AUTO_SEAL) setTimeout(activateSeal, 400);
  });
}
    document.getElementById("btnClaimTurns").onclick = claimDailyTurns;
document.getElementById("btnSeal").onclick = async () => {
  popupSeal.style.display = "block";
  await loadSealInfo();
};
document.getElementById("btnCloseSeal").onclick = () => {
  popupSeal.style.display = "none";
};
document.getElementById("btnActivateSeal").onclick = () => {
  AUTO_SEAL = !AUTO_SEAL;

  if (AUTO_SEAL) {
    showToast("🚀 Bắt đầu auto khắc", true);
    activateSeal();
  } else {
    showToast("🛑 Đã dừng auto khắc", "warn");
  }
};
    document.getElementById("btnCompleteSummon").onclick = completeSummoning;
// ================== CONFIG ==================
const WEDDING_RETRY_MIN = 1_000;
const WEDDING_RETRY_MAX = 120_000;
let weddingRetryCount = 0;
const WEDDING_MAX_RETRY = 3;
const WEDDING_RETRY_DELAY = 10_000; // 10s

// ================== TIỆN ÍCH ==================
const wait = ms => new Promise(r => setTimeout(r, ms));

let weddingRetryTimer = null;

// ================== RETRY ==================
function scheduleWeddingRetry(reason = "") {
  if (weddingRetryCount >= WEDDING_MAX_RETRY) {
    showToast(
      "⛔ Tiên Duyên lỗi quá 3 lần – dừng auto",
      "error"
    );
    weddingRetryTimer = null;
    return;
  }

  if (weddingRetryTimer) return;

  weddingRetryCount++;

  showToast(
    `🔁 Tiên Duyên retry lần ${weddingRetryCount}/${WEDDING_MAX_RETRY} sau ${WEDDING_RETRY_DELAY / 1000}s`
      + (reason ? ` (${reason})` : ""),
    "warn"
  );

  weddingRetryTimer = setTimeout(() => {
    weddingRetryTimer = null;
    runWeddingAuto();
  }, WEDDING_RETRY_DELAY);
}

async function getWeddingSecurityToken() {
  const token = await getSecurityToken(location.href);
  if (!token) throw new Error("NO_SECURITY_TOKEN");
  return token;
}


// ================== CALL API ==================
async function callApi(body) {
  const nonce = localStorage.getItem("HH3D_NONCE_WP");

  const res = await fetch(buildUrl("/wp-json/hh3d/v1/action"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(nonce ? { "X-WP-Nonce": nonce } : {})
    },
    credentials: "include",
    body: JSON.stringify(body)
  });

  let data;
  try { data = await res.json(); }
  catch { data = await res.text(); }

  return { ok: res.ok, status: res.status, data };
}

// ================== LOAD PHÒNG CƯỚI ==================
async function fetchWeddingRooms() {
  const securityToken = await getSecurityToken(location.href);
  if (!securityToken) {
    showToast("❌ Không có security token", "error");
    return null;
  }

  const r = await callApi({
    action: "show_all_wedding",
    security_token: securityToken
  });

  return r.ok ? r.data?.data || [] : null;
}
// ================== HELPER ==================
const toBool = v => v === true || v === 1 || v === "1" || v === "true";

function showApiMessage(prefix, id, apiRes) {
  if (!apiRes) {
    showToast(`${prefix} #${id} ❌ Không có phản hồi`, "error");
    return;
  }

  if (apiRes.success) {
    // 👉 ƯU TIÊN MESSAGE
    if (apiRes.message) {
      showToast(`${prefix} #${id}: ${apiRes.message}`, "success");
      return;
    }

    // 👉 FALLBACK DATA
    if (apiRes.data !== undefined) {
      showToast(
        `${prefix} #${id}: ${
          typeof apiRes.data === "string"
            ? apiRes.data
            : JSON.stringify(apiRes.data)
        }`,
        "success"
      );
      return;
    }

    showToast(`${prefix} #${id} ✔️ Thành công`, "success");
  } else {
    showToast(
      `${prefix} #${id} ❌ ${apiRes.message || "Thất bại"}`,
      "error"
    );
  }
}


// ================== ACTION ==================
async function sendBlessing(id, type) {

  const msgDaoLu =
    "🌌 Định mệnh an bài, chúc hai vị đạo hữu bách niên hảo hợp!";

  const msgHongNhan =
    "🌸 Hồng trần hữu duyên, tri kỷ tương phùng! Chúc mừng một đoạn hồng duyên đẹp giữa chốn tu chân. ✨";

  const nonce = localStorage.getItem("HH3D_NONCE_WP");

  let res;

  // ===== HỒNG NHAN =====
  if (type === "hong_nhan") {

    res = await fetch(buildUrl("/wp-json/hh3d/v1/hong-nhan/bless"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(nonce ? { "X-WP-Nonce": nonce } : {})
      },
      credentials: "include",
      body: JSON.stringify({
        wedding_room_id: id,
        message: msgHongNhan
      })
    });

  }

  // ===== ĐẠO LỮ =====
  else {

    const r = await callApi({
      action: "hh3d_add_blessing",
      wedding_room_id: id,
      message: msgDaoLu
    });

    showApiMessage("💌 Chúc phúc", id, r?.data);
    return;
  }

  let data;
  try { data = await res.json(); }
  catch { data = await res.text(); }

  showApiMessage("💌 Chúc phúc", id, data);
}
async function openLiXi(id) {

  const res = await callApi({
    action: "hh3d_receive_li_xi",
    wedding_room_id: id
  });

  if (!res?.data) {
    showToast(`🧧 #${id} ❌ Không có phản hồi`, "error");
    return;
  }

  const data = res.data;

  if (data.success) {

    const reward = data.data;

    if (reward?.amount) {
      showToast(
        `🧧 #${id} nhận ${reward.amount} ${reward.name} ${reward.icon || ""}`,
        "success"
      );
    }
    else {
      showToast(`🧧 #${id}: ${data.message}`, "success");
    }

  }
  else {
    showToast(`🧧 #${id} ❌ ${data.message}`, "error");
  }

}
// ================== PARSE PHÒNG CƯỚI (CHUẨN THEO BACKEND) ==================
function parseWeddingRooms(rooms) {

  const blessList = [];
  const giftList = [];

  for (const r of rooms) {

    const id = Number(r.wedding_room_id);
    if (!id) continue;

    const type = r.room_type || "dao_lu";

    const hasBlessed = toBool(r.has_blessed);
    const hasLiXi = toBool(r.has_li_xi);

    console.log("[WEDDING]", id, {
      type,
      hasBlessed,
      hasLiXi
    });

    // ===== CHƯA CHÚC =====
    if (!hasBlessed) {
      blessList.push({ id, type });
    }

    // ===== CÓ LÌ XÌ (DAO LỮ + HỒNG NHAN) =====
    if (hasLiXi) {
      giftList.push({ id, type });
    }

  }

  return { blessList, giftList };
}
// ================== MỞ ALL LÌ XÌ DÀNH CHO (VIP) ==================
async function quickOpenAllLiXi() {
  const res = await callApi({
    action: "hh3d_quick_open_all_li_xi"
  });

  if (!res?.data) {
    showToast("⚠️ Mở lì xì nhanh: không có phản hồi", "error");
    return;
  }

  const data = res.data;

  if (data.success) {
    showToast(
      `🎁 Mở nhanh ${data.opened_count || 0} lì xì`,
      "success"
    );

    // 👉 HIỆN SUMMARY (nếu có)
    if (Array.isArray(data.summary)) {
      data.summary.forEach(item => {
        showToast(
          `+ ${item.total} ${item.name} ${item.icon || ""}`,
          "success"
        );
      });
    }

  } else {
    showToast(
      `❌ Mở lì xì VIP thất bại: ${data.message}`,
      "error"
    );
  }
}
// ================== MAIN AUTO ==================
async function runWeddingAuto() {
  try {
    showToast("💒 Tiên Duyên đang chạy...", "info");
// 🔥 VIP: mở lì xì ẩn trước
await quickOpenAllLiXi();
await wait(500);
    // 1️⃣ NONCE
    const nonce = localStorage.getItem("HH3D_NONCE_WP");
    if (!nonce) {
      showToast("❌ Chưa có HH3D_NONCE_WP", "error");
      scheduleWeddingRetry("no nonce");
      return;
    }
    // 2️⃣ SECURITY TOKEN
    const securityToken = await getWeddingSecurityToken();
    // 3️⃣ LOAD PHÒNG
    const r = await callApi({
      action: "show_all_wedding",
      security_token: securityToken
    });
    const rooms = r?.data?.data || [];
    if (!rooms.length) {
      showToast("📭 Không có phòng cưới", "info");
      scheduleWeddingRetry("no room");
      return;
    }
    // 4️⃣ PHÂN LOẠI
    const { blessList, giftList } = parseWeddingRooms(rooms);
    showToast(
      `💌 Chưa chúc: ${blessList.length} | 🧧 Có lì xì: ${giftList.length}`,
      "info"
    );
    // 5️⃣ CHÚC PHÚC
for (const r of blessList) {
  showToast(`💌 Đang chúc phòng ${r.id}`, "info");
  await sendBlessing(r.id, r.type);
  await wait(300);
}
 for (const r of giftList) {
  showToast(`🧧 Đang mở lì xì phòng ${r.id}`, "info");
  await openLiXi(r.id);
  await wait(300);
}
      weddingRetryCount = 0;
    showToast("✅ Hoàn tất Tiên Duyên", "success");
  } catch (e) {
    console.error(e);
    showToast("⚠️ Lỗi Tiên Duyên: " + e.message, "error");
    scheduleWeddingRetry("exception");
  }
}
// ================== BUTTON ==================
const btnWedding = document.getElementById("btnWedding");
if (btnWedding) {
  btnWedding.addEventListener("click", runWeddingAuto);
}
function autoChucPhucScheduler() {
  const now = nowMinutes();
  AUTO_CHUC_PHUC_WINDOWS.forEach(w => {
    const runKey = `HH3D_${w.key}`;
    const pendingKey = runKey + "_PENDING";
    // trong khung giờ + chưa chạy hôm nay + chưa pending
    if (
      now >= w.start &&
      now < w.end &&
      !hasRun(runKey) &&
      localStorage.getItem(pendingKey) !== todayKey()
    ) {
      // random từ 5s → 300s (0–5 phút)
      const delay = randomMs(5_000, 300_000);
      showToast(
        `⏳ Chúc phúc (${w.key}) sẽ chạy sau ${formatTime(delay)}`
      );
      // đánh dấu pending để reload không set lại
      localStorage.setItem(pendingKey, todayKey());
      setTimeout(async () => {
        try {
          await runWeddingAuto();
          markRun(runKey);
        } catch (e) {
          showToast("❌ Lỗi auto chúc phúc", false);
        }
      }, delay);
    }
  });
}
setInterval(autoChucPhucScheduler, 30_000); // check mỗi 30s
function runLuanVoAuto() {

    if (document.getElementById("luanvo_panel")) return;

    const panel = document.createElement("div");
    panel.id = "luanvo_panel";

    panel.style = `
        position:fixed;
        top:120px;
        left:20px;
        z-index:99999;
        background:#1e1e1e;
        padding:15px;
        border-radius:12px;
        width:260px;
        color:#fff;
        box-shadow:0 0 15px rgba(0,0,0,0.7);
        font-size:14px;
    `;

    panel.innerHTML = `
<h3 style="margin:0 0 10px;color:#00eaff">⚔️ MÊ CUNG</h3>

<label style="font-size:12px;color:#aaa">HP tối thiểu</label>
<input id="lv_hp"
value="${localStorage.getItem("lv_hp") || ""}"
style="width:100%;margin-bottom:10px;padding:6px;border-radius:6px;background:#2a2a2a;color:#fff" />

<button id="lv_create"
style="width:100%;margin-bottom:8px;background:#00eaff;color:#000;padding:7px;border-radius:6px">
Tạo key
</button>

<label style="font-size:12px;color:#aaa">Tên / Key phòng hoặc dán link vào</label>
<input id="lv_name"
value="${localStorage.getItem("lv_input") || ""}"
style="width:100%;margin-bottom:10px;padding:6px;border-radius:6px;background:#2a2a2a;color:#fff" />

<button id="lv_join"
style="width:100%;background:#666;color:#fff;padding:7px;border-radius:6px">
Vào phòng đi ké
</button>

<button id="lv_api"
style="width:100%;margin-top:8px;background:#ff9800;color:#000;padding:7px;border-radius:6px;font-weight:bold">
Đi bằng API
</button>

<button id="lv_close"
style="width:100%;margin-top:10px;background:#ff4444;color:#fff;padding:6px;border-radius:6px">
Đóng
</button>
`;
    document.body.appendChild(panel);
    // ===== EVENTS =====
    setTimeout(() => {
        // lưu HP
        document.getElementById("lv_hp").oninput = e =>
            localStorage.setItem("lv_hp", e.target.value);
        // lưu key / tên phòng
        document.getElementById("lv_name").oninput = e =>
            localStorage.setItem("lv_input", e.target.value);

        // 👉 TẠO KEY sau này gắn API
        document.getElementById("lv_create").onclick = () => {

            // TODO: call API create key
            openLuanVoIframe("create"); // tạm dùng lại
        };
        // 👉 VÀO PHÒNG ĐI KÉ
        document.getElementById("lv_join").onclick = () => {
            openLuanVoIframe("join");
        };
        // 👉 API MODE
        document.getElementById("lv_api").onclick = () => {
            console.log("⚡ Chạy bằng API");
            openApiPopup();
        };

        document.getElementById("lv_close").onclick = () =>
            panel.remove();

    }, 0);
}
    // ===== CHECK =====
   function isInRoom(doc) {
    const panel = doc.querySelector("#room-panel");

    // phải tồn tại + đang hiển thị thật
    return panel && panel.offsetParent !== null;
}

    function isVisible(el) {
        return el && el.offsetParent !== null && !el.disabled;
    }

 function openLuanVoIframe(mode) {

    // Xóa iframe cũ nếu có
    document.getElementById("mc_container")?.remove();

    // ===== CONTAINER =====
    const container = document.createElement("div");
    container.id = "mc_container";

    container.style = `
        position:fixed;
        top:50%;
        left:50%;
        transform:translate(-50%,-50%);
        z-index:99998;
        width:420px;
        background:#111;
        border:2px solid #00eaff;
        border-radius:12px;
        overflow:hidden;
        box-shadow:0 0 20px rgba(0,0,0,0.8);
    `;

    // ===== HEADER + LOG =====
    container.innerHTML = `
        <div style="
            background:#000;
            padding:6px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            font-size:12px;
            border-bottom:1px solid #333;
        ">
            <span style="color:#00eaff">⚔️ Mê Cung</span>
            <button id="mc_close" style="
                background:#ff4444;
                border:none;
                color:#fff;
                padding:2px 8px;
                border-radius:6px;
                cursor:pointer;
            ">X</button>
        </div>

        <div id="mc_log" style="
            height:80px;
            overflow:auto;
            background:#0a0a0a;
            font-size:11px;
            padding:5px;
            color:#0f0;
            border-bottom:1px solid #222;
        "></div>
    `;

    // ===== IFRAME =====
    const iframe = document.createElement("iframe");
    iframe.id = "mc_iframe";
    iframe.src = "https://hoathinh3d.co/me-cung";

    iframe.style = `
        width:100%;
        height:470px;
        border:none;
    `;

    container.appendChild(iframe);
    document.body.appendChild(container);

    // ===== LOG FUNCTION =====
    const logBox = container.querySelector("#mc_log");

    function log(msg) {
        const time = new Date().toLocaleTimeString();
        logBox.innerHTML += `[${time}] ${msg}<br>`;
        logBox.scrollTop = logBox.scrollHeight;
    }

    // ===== CLOSE =====
    container.querySelector("#mc_close").onclick = () => {
        container.remove();
    };

    // ===== LOAD =====
    iframe.onload = () => {

        const doc = iframe.contentDocument;

        log("✅ Iframe loaded");

        let started = false;

        const waitReady = setInterval(() => {

            if (!doc || !doc.body) return;

            if (started) return;

            started = true;
            clearInterval(waitReady);

            log("🚀 Bắt đầu mode: " + mode);

            if (isInRoom(doc)) {
                log("✔ Đã ở trong phòng");
                afterJoin(doc);
                return;
            }

            if (mode === "create") {
                log("🔑 Auto create");
                autoCreate(doc);
            }

            if (mode === "join") {
                log("🚪 Auto join");
                autoJoin(doc);
            }

        }, 500); // ⬅ nhẹ hơn setTimeout

    };
}
    function parseRoomInput(raw) {
    if (!raw) return null;

    raw = raw.trim();

    // 🔥 tìm invite trong link
    const inviteMatch = raw.match(/invite=([a-z0-9]+)/i);
    if (inviteMatch) {
        return {
            type: "invite",
            value: inviteMatch[1]
        };
    }

    // 🔥 tìm ID phòng
    const idMatch = raw.match(/phòng\s*(\d+)/i) || raw.match(/\b(\d{4,})\b/);
    if (idMatch) {
        return {
            type: "id",
            value: idMatch[1]
        };
    }

    // 🔥 fallback: tên phòng
    return {
        type: "name",
        value: raw.toLowerCase()
    };
}
    // ===== CREATE =====
function autoCreate(doc) {
    const loop = setInterval(() => {
        const btn = doc.querySelector(".btn-create-room");
        if (isVisible(btn)) {
            console.log("Tạo phòng");
            btn.click();
            clearInterval(loop);

            setTimeout(() => {
                doc.querySelector(".confirm-btn-ok")?.click();
            }, 800);

            const waitRoom = setInterval(() => {
                if (isInRoom(doc)) {
                    console.log("✔ Đã vào phòng sau create");
                    clearInterval(waitRoom);
                    afterJoin(doc); // ✅ CHẠY AUTO
                }
            }, 1000);
        }
    }, 1000);
}
function autoJoin(doc) {

    const loop = setInterval(() => {

        let RAW = localStorage.getItem("lv_input") || "";

        if (!RAW) {
            console.log("⚠️ Chưa nhập input");
            return;
        }

        const parsed = parseRoomInput(RAW);

        console.log("Parsed:", parsed);

        // ===== ✅ ƯU TIÊN INVITE (VÀO THẲNG) =====
        if (parsed.type === "invite") {

            console.log("🚀 Vào bằng invite:", parsed.value);

            // 👉 redirect iframe luôn
            doc.defaultView.location.href =
                "https://hoathinh3d.co/me-cung?invite=" + parsed.value;

            clearInterval(loop);

            const waitJoin = setInterval(() => {
                if (isInRoom(doc)) {
                    console.log("✔ Đã vào phòng bằng invite");
                    clearInterval(waitJoin);
                    afterJoin(doc);
                }
            }, 1000);

            return;
        }

        // ===== CHECK ĐÃ TRONG PHÒNG =====
        if (isInRoom(doc)) {
            console.log("✔ Đã ở trong phòng");
            clearInterval(loop);
            afterJoin(doc);
            return;
        }

        const rooms = doc.querySelectorAll(".room-item");

        if (!rooms || rooms.length === 0) {
            console.log("⏳ Chưa load danh sách phòng...");
            return;
        }

        for (let room of rooms) {

            const nameEl = room.querySelector(".room-item-name");
            const metaEl = room.querySelector(".room-item-meta");
            const btn = room.querySelector(".btn-join-room:not(.disabled)");

            if (!btn) continue;

            const name = nameEl?.innerText?.toLowerCase() || "";
            const meta = metaEl?.innerText || "";

            const match = meta.match(/#(\d+)/);
            const roomId = match ? match[1] : "";

            let isMatch = false;

            if (parsed.type === "id") {
                isMatch = roomId === parsed.value;
            }

            if (parsed.type === "name") {
                isMatch = name.includes(parsed.value);
            }

            if (isMatch) {

                console.log("✅ Vào phòng:", name, "| ID:", roomId);

                btn.click();
                clearInterval(loop);

                const waitJoin = setInterval(() => {
                    if (isInRoom(doc)) {
                        console.log("✔ Đã vào phòng thành công");
                        clearInterval(waitJoin);
                        afterJoin(doc);
                    }
                }, 1000);

                return;
            }
        }

        console.log("❌ Không tìm thấy phòng");

    }, 1200);
}
    // ===== AFTER JOIN =====
  function afterJoin(doc) {
    autoStartSmart(doc);
    autoReady(doc);
    autoKick(doc);
    autoNext(doc);
    autoChest(doc);
    autoAttack(doc);


    autoBackLobby(doc);
}
function autoStartSmart(doc) {
    const loop = setInterval(() => {

        const players = [...doc.querySelectorAll(".player-card.filled")];

        if (players.length !== 5) {
            console.log("❌ Chưa đủ 5 người");
            return;
        }

        let elements = new Set();
        let okHP = true;

        // ✅ CHECK NGŨ HÀNH + HP
        players.forEach(p => {

            const role = p.querySelector(".player-role")?.innerText.toLowerCase() || "";

            if (role.includes("kim")) elements.add("kim");
            if (role.includes("mộc")) elements.add("moc");
            if (role.includes("thủy")) elements.add("thuy");
            if (role.includes("hỏa")) elements.add("hoa");
            if (role.includes("thổ")) elements.add("tho");

            const hpText = p.querySelector(".player-power")?.innerText || "";
            const hp = parseInt(hpText.replace(/\D/g, "")) || 0;

            if (hp < 400000) okHP = false;
        });

        if (elements.size !== 5) {
            console.log("❌ Thiếu ngũ hành:", elements);
            return;
        }

        if (!okHP) {
            console.log("❌ Có người HP < 400k");
            return;
        }

        // 🔥 CHECK TẤT CẢ READY
        const allReady = players.every(p =>
            p.querySelector(".ready-badge.is-ready")
        );

        if (!allReady) {
            console.log("❌ Chưa tất cả sẵn sàng");
            return;
        }

        const btn = doc.querySelector("#btn-start");
        if (!btn) return;

        const btnText = btn.innerText.toLowerCase();
        if (btnText.includes("bắt đầu") && isVisible(btn)) {

            console.log("🚀 BẮT ĐẦU CHUẨN");

            btn.click();

            setTimeout(() => {
                doc.querySelector(".confirm-btn-ok")?.click();
            }, 500);

            clearInterval(loop);
        }

    }, 1500);
}
function autoReady(doc) {
    setInterval(() => {

        const hint = doc.querySelector("#start-hint");
        const btn = doc.querySelector("#btn-start");

        if (!hint || !btn) return;

        const hintText = hint.innerText.toLowerCase();
        const btnText = btn.innerText.toLowerCase();

        // ✅ chỉ bấm khi game yêu cầu "bấm sẵn sàng"
        if (
            hintText.includes("bấm sẵn sàng") &&
            btnText.includes("sẵn sàng") &&
            isVisible(btn)
        ) {
            console.log("✅ Bấm SẴN SÀNG ");
            btn.click();
        }

    }, 1500);
}

    // ===== KICK =====
function autoKick(doc) {

    setInterval(async () => {

        let WHITELIST = (localStorage.getItem("lv_ids") || "")
            .split(",")
            .map(x => x.trim())
            .filter(x => x);

        let HP_LIMIT = parseInt(localStorage.getItem("lv_hp") || "0");

        let players = [...doc.querySelectorAll(".player-card.filled")];

        for (let p of players) {

            const img = p.querySelector(".player-avatar img[src*='ultimatemember']");
            const kick = p.querySelector(".btn-kick");

            if (!kick) continue;

            const id = img?.src.match(/ultimatemember\/(\d+)/)?.[1];

            const powerText = p.querySelector(".player-power")?.innerText || "";
            const hpMatch = powerText.match(/HP\s([\d\.]+)/);

            let hp = 0;
            if (hpMatch) {
                hp = parseInt(hpMatch[1].replace(/\./g, ""));
            }

            console.log("Check:", id, "| HP:", hp);
            // ===== LOGIC ƯU TIÊN =====
            // 👉 Có ID → chỉ xét ID
            if (WHITELIST.length > 0 && !HP_LIMIT) {
                if (id && !WHITELIST.includes(id)) {
                    console.log("❌ Kick theo ID:", id);
                    kick.click();
                    await new Promise(r => setTimeout(r, 500));
                    doc.querySelector(".confirm-btn-ok")?.click();
                    break;
                }
            }

            // 👉 Không có ID → xét HP
            else if (HP_LIMIT && WHITELIST.length === 0) {
                if (hp < HP_LIMIT) {
                    console.log("❌ Kick theo HP:", hp);
                    kick.click();
                    await new Promise(r => setTimeout(r, 500));
                    doc.querySelector(".confirm-btn-ok")?.click();
                    break;
                }
            }

            // 👉 Có cả 2 → kết hợp
            else if (WHITELIST.length > 0 && HP_LIMIT) {
                if (
                    (id && !WHITELIST.includes(id)) ||
                    hp < HP_LIMIT
                ) {
                    console.log("❌ Kick theo ID + HP:", id, hp);
                    kick.click();
                    await new Promise(r => setTimeout(r, 500));
                    doc.querySelector(".confirm-btn-ok")?.click();
                    break;
                }
            }
        }

    }, 3000);
}
    // ===== NEXT =====
    function autoNext(doc) {
        setInterval(() => {
            const btn = doc.querySelector("#btn-next-stage");

            if (isVisible(btn)) {
                console.log("Qua ải");
                btn.click();
            }

        }, 2500);
    }

    // ===== CHEST =====
    function autoChest(doc) {
        setInterval(() => {
            const chest = doc.querySelector("#b5-chest-img");

            if (isVisible(chest)) {
                console.log("Nhận rương");
                chest.click();
            }

        }, 2500);
    }
function autoBackLobby(doc) {

    let isWaiting = false;

    setInterval(() => {

        const btn = doc.querySelector(".btn-back-lobby");

        if (!btn || isWaiting) return;

        if (isVisible(btn)) {

            console.log("🏁 Đã xong trận → chờ 15s quay về sảnh");

            isWaiting = true;

            setTimeout(() => {

                console.log("↩️ Quay về sảnh");
                btn.click();

                // reset trạng thái sau khi reload
                localStorage.setItem("lv_running", "1");

            }, 15000);
        }

    }, 2000);
}
function autoAttack(doc) {
    const loop = setInterval(() => {

        const toggle = doc.querySelector("#auto-attack-toggle");
        const track = doc.querySelector("#auto-attack-track");

        if (!toggle || !track) return;

        if (track.classList.contains("on")) {
            console.log("✅ Auto attack đã bật");
            clearInterval(loop);
            return;
        }

        console.log("⚔️ Bật auto attack");
        toggle.click();

    }, 1500);
}
/* ================== BUTTON ================== */
document.getElementById("btnLuanVo") ?.addEventListener("click", runLuanVoAuto);
function openApiPopup() {

    if (document.getElementById("lv_api_popup")) return;

    // ================= STATE =================
    let mode = {
        host: false,
        slave: false
    };
let joinedRoom = null;
let lastRoomMsgId = 0;
let usedChestTokens = new Set();
    let hostRunning = false;
    let hostLoop = null;
let myUserId = null;
    let slaveRunning = false;
    let slaveLoop = null;
let lastChestMsgId = 0;
    let realToken = null;
    let realNonce = null;
    let currentRoom = null;
    let lastStatusHash = "";
    // ================= POPUP =================
    const popup = document.createElement("div");
    popup.id = "lv_api_popup";

    popup.style = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.6);
        z-index:999999;
        display:flex;
        align-items:center;
        justify-content:center;
    `;

    popup.innerHTML = `
    <div style="
        background:#1e1e1e;
        padding:18px;
        border-radius:12px;
        width:360px;
        color:#fff;
        font-size:14px;
        box-shadow:0 0 20px rgba(0,0,0,0.8);
    ">

        <h3 style="margin:0 0 12px;color:#00eaff;text-align:center">
            API MÊ CUNG
        </h3>

<label>ID phòng chat</label>
<input id="api_room"
    placeholder="Nhập ID chat"
    style="width:100%;margin:6px 0 12px;padding:6px;border-radius:6px;border:none;background:#2a2a2a;color:#fff" />

<div style="display:flex;gap:8px;margin-bottom:10px;">

    <button id="btn_host"
    style="flex:1;padding:8px;border:none;border-radius:6px;background:#444;color:#fff">
        Chủ KEY OFF
    </button>

    <button id="btn_slave"
    style="flex:1;padding:8px;border:none;border-radius:6px;background:#444;color:#fff">
        Đi KÉ OFF
    </button>

</div>

<div id="api_log"
style="
    height:280px;
    overflow:auto;
    background:#000;
    border:1px solid #333;
    padding:8px;
    border-radius:6px;
    font-size:12px;
    line-height:1.4;
    white-space:pre-line;
    word-break: break-word;
    scroll-behavior: smooth;
">
</div>

<button id="api_close"
style="width:100%;margin-top:10px;background:#ff4444;color:#fff;padding:8px;border:none;border-radius:6px">
    ĐÓNG
</button>

    </div>
    `;

    document.body.appendChild(popup);

    const logBox = document.getElementById("api_log");
    const roomInput = document.getElementById("api_room");

    // ================= LOG =================
    function log(text) {
        const time = new Date().toLocaleTimeString();
        const div = document.createElement("div");
        div.innerText = `[${time}] ${text}`;
        logBox.appendChild(div);
        logBox.scrollTop = logBox.scrollHeight;
    }
  roomInput.value = localStorage.getItem(STORAGE_KEY) || "";

    roomInput.addEventListener("input", () => {
        localStorage.setItem(STORAGE_KEY, roomInput.value.trim());
    });
    // ================= FETCH TOKEN =================
async function fetchToken() {

    const res = await fetch("/me-cung", {
        credentials: "include",
        cache: "no-store"
    });

    const html = await res.text();

    const tokenMatch = html.match(/x-mc-action-token["']?\s*[:=]\s*["']([^"']+)/i);
    const tokenMatch2 = html.match(/([A-Za-z0-9+/=]{80,})/);

    realToken = tokenMatch?.[1] || tokenMatch2?.[1];

    const nonceMatch = html.match(/nonce["']?\s*:\s*["']([^"']+)/i);
    realNonce = nonceMatch?.[1] || res.headers.get("x-wp-nonce");

    // ================= FIX QUAN TRỌNG =================
    if (!realToken || realToken.length < 20) realToken = null;
    if (!realNonce || realNonce.length < 10) realNonce = null;

    // ================= LOG =================
    log("TOKEN: " + realToken);
    log("NONCE: " + realNonce);

    // ================= RESULT =================
    if (!realToken || !realNonce) {
        log("❌ thiếu token");
        return false;
    }

    log("✅ lấy token thành công");
    return true;
}
// ================= THREAD =================
function getThreadId() {
    return document.getElementById("api_room")?.value?.trim() || null;
}
async function checkChestFromChat() {

    const messages = await readChat();
    if (!messages?.length) return;

    const myId = getMyUserIdFromDOM();
    if (!myId) return;

    for (let msg of messages) {

        if (msg.message_id <= lastChestMsgId) continue;
        lastChestMsgId = msg.message_id;

        const text = msg.message || "";

        if (!text.startsWith("CHEST|")) continue;

        const parts = text.split("|");

        const room = parts[1];
        const raw = parts[2];

        if (!room || !raw) continue;

        const list = raw.split(",");

        for (let item of list) {

            const [uid, token] = item.split(":");

            if (!uid || !token) continue;

            if (usedChestTokens.has(token)) continue;

            if (parseInt(uid) === parseInt(myId)) {

                usedChestTokens.add(token);

                showToast("🎁 Đang mở rương...", true);

                await claimChest(room, token);
                return;
            }
        }
    }
}
// ================= SEND CHAT =================
async function sendChat(message) {

    const threadId = getThreadId();
    if (!threadId) {
        log("❌ chưa nhập ID chat");
        return false;
    }

    if (!realNonce) {
        const ok = await fetchToken();
        if (!ok) return false;
    }

    try {
        const res = await fetch(`/wp-json/better-messages/v1/thread/${threadId}/send?nocache=${Date.now()}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": realNonce
            },
            credentials: "include",
            body: JSON.stringify({
                message,
                temp_id: "tmp_" + Date.now()
            })
        });

        return await res.json();

    } catch (e) {
        log("❌ send chat lỗi");
        return false;
    }
}

// ================= READ CHAT =================
async function readChat() {

    const threadId = getThreadId();
    if (!threadId) {
        log("❌ chưa nhập ID chat");
        return [];
    }

    if (!realNonce) {
        const ok = await fetchToken();
        if (!ok) return [];
    }

    try {
        const res = await fetch(
            `/wp-json/better-messages/v1/thread/${threadId}?nocache=${Date.now()}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-WP-Nonce": realNonce
                },
                credentials: "include",
                body: JSON.stringify({ messages: [] })
            }
        );

        const data = await res.json();

        if (!data || data.code || !data.messages) {
            log("⚠️ chat lỗi");
            return [];
        }

        return data.messages;

    } catch (e) {
        log("❌ read chat lỗi");
        return [];
    }
}
async function joinRoomByToken(token, roomCode) {

    if (joinedRoom === roomCode) {
        log("⚠️ đã ở phòng này rồi");
        return;
    }

    const ok = await fetchToken();
    if (!ok) return;

    try {
        const res = await fetch("/wp-json/me-cung/v1/join-by-invite", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-mc-action-token": realToken,
                "X-WP-Nonce": realNonce
            },
            credentials: "include",
            body: JSON.stringify({ token })
        });

        const data = await res.json();

        if (data?.success) {
            joinedRoom = data.room_code;
            log("✅ JOIN ROOM: " + joinedRoom);
        } else {
            log("❌ join fail");
        }

    } catch (e) {
        log("❌ join error");
    }
}
 // ================= SLAVE =================
let lastMsgId = 0;
let lastReadyTime = 0;
async function startSlave() {

    if (slaveRunning) return;
    slaveRunning = true;

    log("🤖 SLAVE (ANTI THROTTLE)");

    const ok = await fetchToken();
    if (!ok) return;

    const myId = getMyUserIdFromDOM();
    if (!myId) {
        log("❌ không lấy được user id");
        return;
    }

    let currentRoomLocal = null;

    while (slaveRunning) {

        const loopStart = Date.now();

        try {

            // ================= 1. CHECK STATUS =================
            const status = await getUserStatus();

            if (status?.in_room) {

                currentRoomLocal = status.room_code;

                if (status.status === "waiting") {

                    const me = status.members.find(m => m.user_id == myId);

                    if (me && me.is_ready == 0) {

                        if (Date.now() - lastReadyTime > 5000) {

                            log("⚡ AUTO READY");

                            lastReadyTime = Date.now();

                            await readyRoom();
                        }
                    }
                }

            } else {
                currentRoomLocal = null;
            }

            // ================= 2. READ CHAT =================
            const messages = await readChat();
            if (!messages?.length) {
                await delaySmart(loopStart);
                continue;
            }

            for (let msg of messages) {

                const text = msg.message || "";

                // ================= ROOM =================
                if (!currentRoomLocal && text.startsWith("ROOM|")) {

                    if (msg.message_id <= lastMsgId) continue;
                    lastMsgId = msg.message_id;

                    const [_, roomCode, token] = text.split("|");

                    if (!roomCode || !token) continue;

                    log("📥 ROOM: " + roomCode);

                    await joinRoomByToken(token, roomCode);

                    currentRoomLocal = roomCode;
                    continue;
                }

                // ================= CHEST =================
                if (text.startsWith("CHEST|")) {

                    const [_, room, raw] = text.split("|");

                    if (!room || !raw) continue;
                    if (currentRoomLocal && room !== currentRoomLocal) continue;

                    const list = raw.split(",");

                    for (let item of list) {

                        const [uid, token] = item.split(":");

                        if (!uid || !token) continue;
                        if (usedChestTokens.has(token)) continue;

                        if (parseInt(uid) === myId) {

                            usedChestTokens.add(token);

                            log("🎁 mở rương của mình");

                            showToast("🎁 Đang mở rương...", true);

                            log("⏳ chờ 6s mở rương (slave)");

                            await sleepAccurate(6000); // 🔥 fix delay

                            await claimChest(room, token);

                            break;
                        }
                    }
                }
            }

        } catch (e) {
            log("❌ slave loop error");
        }

        await delaySmart(loopStart);
    }
}
    function delaySmart(startTime) {

    const delay = getSlaveDelay ? getSlaveDelay() : 20000;

    const elapsed = Date.now() - startTime;

    const wait = Math.max(0, delay - elapsed);

    return sleepAccurate(wait);
}
    async function sleepAccurate(ms) {

    const start = Date.now();

    while (Date.now() - start < ms) {
        await new Promise(r => setTimeout(r, 200));
    }
}
    function getSlaveDelay() {
    const el = document.getElementById("api_delay_slave");
    if (!el) return 20000; // fallback 20s

    const val = parseFloat(el.value);
    if (isNaN(val)) return 20000;

    return Math.max(5000, val * 1000); // tối thiểu 5s
}
async function claimChest(roomCode, token, retry = 0) {

    if (!realNonce) {
        const ok = await fetchToken();
        if (!ok) return;
    }

    try {

        const res = await fetch("/wp-json/me-cung/v1/claim-boss5-chest", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": realNonce
            },
            credentials: "include",
            body: JSON.stringify({
                room_code: roomCode,
                chest_token: token
            })
        });

        const data = await res.json();

        console.log("🎁 CHEST DATA:", data);

// ================= SUCCESS =================
if (data?.success) {

    const r = data.reward || {};

    // 👉 FIX CHUẨN (fallback nhiều nguồn)
    const gained = data.huyen_tinh ?? r.huyen_tinh ?? 0;
    const total = data.huyen_tinh_daily_total ?? r.huyen_tinh_daily_total ?? 0;
    const cap = data.huyen_tinh_daily_cap ?? r.huyen_tinh_daily_cap ?? 0;

    const tuVi = r.tu_vi || 0;
    const tinhThach = r.tinh_thach || 0;
    const tienNgoc = r.tien_ngoc || 0;
    const xuKhoa = r.xu_khoa || 0;

    const label = r.label || "Rương";

    let text = `🎁 ${label}\n`;

    if (tuVi) text += `💠 Tu Vi: +${tuVi}\n`;
    if (tinhThach) text += `🔮 Tinh Thạch: +${tinhThach}\n`;
    if (tienNgoc) text += `💎 Tiên Ngọc: +${tienNgoc}\n`;
    if (xuKhoa) text += `🪙 Xu Khóa: +${xuKhoa}\n`;

    text += `✨ +${gained} Huyền Tinh\n`;
    text += `📊 Hôm nay: ${total}/${cap}`;

    if (data.already_got_items) {
        text += `\n⚠️ Đã nhận trước đó`;
    }

    if (cap && total >= cap) {
        text += `\n🚫 Đã đạt giới hạn hôm nay`;
    }

    log(text);

    showToast(`🎁 +${gained} HT (${total}/${cap})`, true);

    return true;
}
        // ================= TOO SOON (AUTO RETRY) =================
        if (data?.code === "too_soon") {

            const wait = (data.seconds_left || 2) * 1000;

            log(`⏳ bị delay → retry sau ${wait / 1000}s`);

            if (retry < 5) {
                await sleep(wait + 200); // buffer nhẹ
                return await claimChest(roomCode, token, retry + 1);
            } else {
                log("❌ retry quá 5 lần, bỏ");
                return false;
            }
        }

        // ================= FAIL =================
        log("❌ nhận rương fail: " + (data?.message || ""));
        showToast(data?.message || "❌ Fail", "warn");

        return false;

    } catch (e) {

        log("❌ lỗi mạng, retry...");

        if (retry < 5) {
            await sleep(1500);
            return await claimChest(roomCode, token, retry + 1);
        }

        showToast("❌ Lỗi mạng", "warn");
        return false;
    }
}
    async function readyRoom() {

    if (!currentRoom) {
        log("❌ chưa có room");
        return null;
    }


    if (!realToken || !realNonce) {
        log("❌ thiếu token");
        return null;
    }

    try {

        const res = await fetch("/wp-json/me-cung/v1/ready", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-mc-action-token": realToken,
                "X-WP-Nonce": realNonce
            },
            credentials: "include",
            body: JSON.stringify({
                room_code: currentRoom,
                is_ready: 1
            })
        });

        const data = await res.json();

        if (data?.success) {
            log("✅ READY");
        } else {
            log("❌ READY fail: " + (data?.message || ""));
        }

        return data;

    } catch (e) {
        log("❌ READY error");
        return null;
    }
}
function getMyUserIdFromDOM() {

    if (myUserId) return myUserId;

    const a = document.querySelector('a[href*="/profile/"]');
    if (!a) return null;

    const match = a.href.match(/\/profile\/(\d+)/);
    if (!match) return null;

    myUserId = parseInt(match[1]);

    log("👤 MY ID: " + myUserId);

    return myUserId;
}
// ================= STATUS =================
async function getUserStatus() {

    if (!realNonce) {
        const ok = await fetchToken();
        if (!ok) return null;
    }

    try {

        const res = await fetch("/wp-json/me-cung/v1/user-status", {
            method: "GET",
            headers: { "X-WP-Nonce": realNonce },
            credentials: "include"
        });

        const data = await res.json();
        if (!data) return null;

        // ================= NORMALIZE =================
        const status = {
            in_room: data.in_room,
            room_code: data.room_code,
            status: data.status,
            current_stage: data.current_stage,
            boss: data.boss || null,
            members: Array.isArray(data.members) ? data.members : [],
            expired: data.expired || false
        };

        // ================= LOG HASH =================
        const hash = JSON.stringify({
            room: status.room_code,
            status: status.status,
            stage: status.current_stage,
            ready: status.members.filter(m => m.is_ready == 1).length,
            boss: !!status.boss
        });

        if (hash !== lastStatusHash) {

            lastStatusHash = hash;

            const readyCount = status.members.filter(m => m.is_ready == 1).length;
            const nguHanhCount = [...new Set(
                status.members
                    .filter(m => m.is_ready == 1)
                    .map(m => m.ngu_hanh)
            )].length;

            log(
                `🏠 room:${status.room_code} | ` +
                `${status.status} | stage:${status.current_stage} | ` +
                `ready:${readyCount}/5 | hệ:${nguHanhCount}/5`
            );
        }

        currentRoom = status.room_code;

        // ================= AUTO CHEST LOGIC =================
        const boss = status.boss;

        const now = Date.now();



        return status;

    } catch (e) {
        log("❌ getUserStatus lỗi");
        return null;
    }
}

// ================= ENSURE ROOM =================
async function ensureRoom() {

    const status = await getUserStatus();
    if (!status) return;

    if (!status.in_room && status.expired) {
        log("🚪 chưa vào room + expired → tạo phòng mới");
        await createRoom();
    }
}

// ================= CREATE ROOM =================
async function createRoom() {

    const ok = await fetchToken();
    if (!ok) return;

    const res = await fetch("/wp-json/me-cung/v1/create-room", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-mc-action-token": realToken,
            "X-WP-Nonce": realNonce
        },
        credentials: "include",
        body: "{}"
    });

    const data = await res.json();
    log("CREATE", data);

    if (!data?.success) {
        log("❌ create fail");
        return;
    }

    currentRoom = data.room_code;
    log("✅ ROOM: " + currentRoom);

    await lockRoom(currentRoom);
}

// ================= LOCK ROOM =================
let lastSentRoom = null;

async function lockRoom(roomCode) {

    const res = await fetch("/wp-json/me-cung/v1/toggle-room-lock", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-mc-action-token": realToken,
            "X-WP-Nonce": realNonce
        },
        credentials: "include",
        body: JSON.stringify({ room_code: roomCode })
    });

    const data = await res.json();
    log("LOCK", data);

    if (!data?.success) return;

    const inviteToken = data.token;
    if (!inviteToken) return;

    if (lastSentRoom === roomCode) {
        log("⚠️ ROOM đã gửi rồi");
        return;
    }

    const ok = await sendChat(`ROOM|${roomCode}|${inviteToken}`);

    if (ok !== false) {
        lastSentRoom = roomCode;
        currentRoom = roomCode;
        log("📡 broadcast ROOM");
    }
}
let isStartingRoom = false;

async function startRoom() {

    if (!currentRoom) {
        log("❌ chưa có room");
        return false;
    }

    if (isStartingRoom) return false;
    isStartingRoom = true;

    try {

        const res = await fetch("/wp-json/me-cung/v1/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-mc-action-token": realToken,
                "X-WP-Nonce": realNonce
            },
            credentials: "include",
            body: JSON.stringify({ room_code: currentRoom })
        });

        const data = await res.json();
        log("START", data);

        if (data?.success) {
            log("⚔️ boss: " + data.boss?.name);
            isStartingRoom = false;
            return true;
        }

        log("❌ start fail");
        isStartingRoom = false;
        return false;

    } catch (e) {
        log("❌ start error");
        isStartingRoom = false;
        return false;
    }
}
let isAttacking = false;
let lastAttackLine = null;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function attack() {

    if (!currentRoom) return null;
    if (isAttacking) return null;

    isAttacking = true;

    try {

        const res = await fetch("/wp-json/me-cung/v1/attack", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-mc-action-token": realToken,
                "X-WP-Nonce": realNonce
            },
            credentials: "include",
            body: JSON.stringify({ room_code: currentRoom })
        });

        const data = await res.json();

        // ================= HỒI CHIÊU =================
        if (data?.success === false && data?.message?.includes("Hồi chiêu")) {

            log("⏳ Hồi chiêu → retry sau 1s");

            isAttacking = false;

            await sleep(1000);

            return null; // ✅ QUAN TRỌNG: không tự gọi lại
        }

        if (!data?.success) {
            log("❌ attack fail");
            isAttacking = false;
            return null;
        }

        const boss = data.boss;

        // ================= BUILD LOG =================
        let text = "";

        if (boss) {
            text += `👹 STAGE ${boss.stage} - ${boss.name} (${boss.hp}/${boss.hp_max})\n`;
        }

        data.hits?.forEach(h => {
            text += `- ${h.display_name}: ${h.dmg}${h.crit ? " 💢" : ""}\n`;
        });

if (data.boss_dead) {

    log("🏆 BOSS DIE");

    const tokens = data.chest_tokens;
    const room = currentRoom;

    if (tokens && room) {

        // 👉 build chuỗi uid:token,uid:token
        const list = Object.entries(tokens)
            .map(([uid, token]) => `${uid}:${token}`)
            .join(",");

        const msg = `CHEST|${room}|${list}`;

        // 👉 HOST tự mở rương luôn
        const myId = getMyUserIdFromDOM();
     if (tokens[myId]) {

    log("⏳ chờ 6s mở rương (host)");

    await sleep(6000);

    await claimChest(room, tokens[myId]);
}
        // 👉 gửi 1 tin duy nhất
        await sendChat(msg);

        log("📤 Đã gửi FULL CHEST TOKEN");
    }

    currentRoom = null;
}
        // ================= OVERWRITE LOG =================
        const logBox = document.getElementById("api_log");

        if (lastAttackLine) lastAttackLine.remove();

        lastAttackLine = document.createElement("div");
        lastAttackLine.innerText = text;

        logBox.appendChild(lastAttackLine);
        logBox.scrollTop = logBox.scrollHeight;

        isAttacking = false;
        return data;

    } catch (e) {
        log("❌ attack error");
        isAttacking = false;
        return null;
    }
}
// ================= HOST =================
async function startHost() {

    if (hostRunning) return;
    hostRunning = true;

    log("🚀 HOST (ANTI THROTTLE)");

    const ok = await fetchToken();
    if (!ok) return;

    while (hostRunning) {

        const loopStart = Date.now();

        try {

            const status = await getUserStatus();
            if (!status) {
                await delayHost(loopStart);
                continue;
            }

            // ================= ROOM CHECK =================
            if (!status.in_room || status.expired) {

                log("🚪 chưa vào phòng → tạo room");

                await createRoom();
                await sleepAccurate(2500);

                await delayHost(loopStart);
                continue;
            }

            const members = status.members || [];
            const boss = status.boss;

            const readyMembers = members.filter(m => m.is_ready == 1);
            const readyCount = readyMembers.length;

            const uniqueElements = [...new Set(
                readyMembers.map(m => m.ngu_hanh)
            )];

            // ================= WAITING =================
            if (status.status === "waiting" && !boss) {

                if (readyCount >= 5 && uniqueElements.length >= 5) {

                    log("🚀 đủ điều kiện → START");

                    await startRoom();
                    await sleepAccurate(2500);
                }
            }

            // ================= BATTLE =================
            if (status.status === "battle" && boss) {

                if (!isAttacking) {
                    const result = await attack();

                    if (result?.boss_dead) {
                        log("🏆 boss chết");
                        currentRoom = null;
                    }
                }
            }

        } catch (e) {
            log("❌ host error");
        }

        await delayHost(loopStart);
    }
}
    function getHostDelay() {
    const el = document.getElementById("api_delay_host");
    if (!el) return 3500;

    const val = parseFloat(el.value);
    if (isNaN(val)) return 3500;

    return Math.max(1000, val * 1000);
}
    function delayHost(startTime) {

    const delay = getHostDelay();

    const elapsed = Date.now() - startTime;

    const wait = Math.max(0, delay - elapsed);

    return sleepAccurate(wait);
}
function stopHost() {
    hostRunning = false;
    log("⏹ HOST STOP");
}

function stopSlave() {
    slaveRunning = false;
    clearInterval(slaveLoop);
    slaveLoop = null;
    log("⏹ SLAVE STOP");
}
    // ================= EVENTS =================
    const btnHost = document.getElementById("btn_host");
    const btnSlave = document.getElementById("btn_slave");

    btnHost.onclick = () => {

        mode.host = !mode.host;

        btnHost.innerText = mode.host ? "Chủ KEY ON" : "Chủ KEY OFF";
        btnHost.style.background = mode.host ? "#00eaff" : "#444";

        if (mode.host) {
            mode.slave = false;
            btnSlave.innerText = "Đi KÉ OFF";
            btnSlave.style.background = "#444";
            stopSlave();
            startHost();
        } else {
            stopHost();
        }

        log("HOST: " + mode.host);
    };

    btnSlave.onclick = () => {

        mode.slave = !mode.slave;

        btnSlave.innerText = mode.slave ? "Đi KÉ ON" : "Đi KÉ OFF";
        btnSlave.style.background = mode.slave ? "#ff9800" : "#444";

        if (mode.slave) {
            mode.host = false;
            btnHost.innerText = "Chủ KEY OFF";
            btnHost.style.background = "#444";
            stopHost();
            startSlave();
        } else {
            stopSlave();
        }

        log("SLAVE: " + mode.slave);
    };

    document.getElementById("api_close").onclick = () => {
        stopHost();
        stopSlave();
        popup.remove();
    };

    roomInput.addEventListener("input", () => {
        log("ROOM: " + roomInput.value.trim());
    });
}
//=Đổ thạch
async function autoDoThachWithRetry(maxRetry = 10, delayMs = 10_000) {
  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    try {
      showToast(`🔁 Đổ Thạch lần ${attempt}/${maxRetry}`, "info");
      await autoDoThachSilent(); // ❗ phải throw nếu lỗi
      showToast("🎉 Đổ Thạch thành công", "success");
      return true;
    } catch (e) {
      console.error(`❌ Đổ Thạch lỗi lần ${attempt}:`, e);
      if (attempt >= maxRetry) {
        showToast("❌ Đổ Thạch thất bại sau 10 lần thử", "error");
        return false;
      }
      showToast(
        `⚠️ Lỗi Đổ Thạch – thử lại sau ${delayMs / 1000}s`,
        "warning"
      );
      await sleep(delayMs);
    }
  }
}
    let needRetry = false;
    const DO_THACH_API ="/wp-content/themes/halimmovies-child/hh3d-ajax.php";
async function doThachAjax(action, token, extra = {}) {
  const form = new URLSearchParams({
    action,
    security_token: token,
    ...extra
  });
  const res = await fetch(DO_THACH_API, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    body: form.toString()
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}
    async function claimDoThachReward(securityToken) {
  const res = await doThachAjax(
    "claim_do_thach_reward",
    securityToken
  );
  if (res?.success) {
    const msg =
      typeof res.data === "string"
        ? res.data
        : res?.data?.message || "Nhận thưởng thành công";

    showToast(`🎁 ${msg}`, "success");
    return true;
  } else {
    showToast( `⚠️ Nhận thưởng thất bại: ${res?.data || "unknown"}`,
      "warning"
    );
    return false;
  }
}
async function autoDoThachSilent() {
  try {
    const securityToken = await getSecurityToken(location.href);
if (!securityToken) {
  throw new Error("Không lấy được security token");
}
    let loopGuard = 0;
    while (loopGuard++ < 5) {
      const res = await doThachAjax(
        "load_do_thach_data",
        securityToken );if (!res?.success) {showToast("❌ Load Đổ Thạch thất bại", "error");
        return; }
      const data = res.data;
      if (data?.bet_limit_reached) {
        showToast("🧱 Đã đạt giới hạn phiên này", "warning");
        return;
      }
      if (data?.is_reward_time) {
        showToast("🎁 Phát hiện thưởng – đang nhận...", "info");
        const claimed = await claimDoThachReward(securityToken);
        if (!claimed) return;
        await sleep(800);
        continue;
      }
      /* ===== CHỌN ĐÁ ===== */
      let stones = (data?.stones || []).filter(
        s => !s.bet_placed && !s.reward_claimed
      );
      if (stones.length === 0) {
        showToast("ℹ️ Không còn đá để cược", "info");
        return;
      }
      stones.sort(
        (a, b) => Number(b.reward_multiplier) - Number(a.reward_multiplier)
      );
      const pick = stones.slice(0, 2);
      showToast(
        `💎 Chọn đá: ${pick
          .map(s => `${s.name} x${s.reward_multiplier}`)
          .join(" • ")}`,
        "success"
      );
      /* ===== ĐẶT CƯỢC ===== */
      for (const stone of pick) {
        await sleep(600);
        const betRes = await doThachAjax(
          "place_do_thach_bet",
          securityToken,
          {
            stone_id: stone.stone_id,
            bet_amount: 20
          }
        );
        if (betRes?.success) {
          showToast(
            `✅ Cược ${stone.name} (${stone.reward_multiplier}x)`,
            "success"
          );
        } else {
          const msg = betRes?.data || "";
          // 🚨 BỊ CHẶN DO CHƯA NHẬN THƯỞNG
                 if (msg.includes("nhận thưởng")) {
              showToast("🎁 Bị chặn cược → nhận thưởng ngay", "info");
             const claimed = await claimDoThachReward(securityToken);
                       if (!claimed) return;
                      await sleep(800);
                     needRetry = true;
                      break;
                     }
               else {
            showToast(
              `⚠️ Lỗi cược ${stone.name}: ${msg}`,
              "warning"
            );
          }
        }
      }
if (needRetry) {
  needRetry = false;
  showToast("🔁 Đã nhận thưởng – chạy lại lượt Đổ Thạch", "info");
  await sleep(800);
  continue;
}
break;
    }
    showToast("🎉 Hoàn tất Đổ Thạch", "success");
} catch (e) {
  console.error("❌ Đổ Thạch lỗi:", e);
  showToast("❌ Lỗi Đổ Thạch – sẽ retry", "error");
  throw e;
}
}
// ===== AUTO ĐỔ THẠCH THEO GIỜ (RANDOM GIÂY) =====
async function autoDoThachByTime() {
  const now = nowMinutes();
  const WINDOWS = [
    { key: "autoDoThach_8h", start: t(8, 0), end: t(8, 5) },
    { key: "autoDoThach_16h", start: t(16, 0), end: t(16, 5) }
  ];
  WINDOWS.forEach(w => {
    const runKey = w.key;
    const pendingKey = runKey + "_PENDING";
    if (
      now >= w.start &&
      now < w.end &&
      !hasRun(runKey) &&
      localStorage.getItem(pendingKey) !== todayKey()
    ) {
      // random 5s → 300s
      const delay = randomMs(5_000, 300_000);
      showToast(
        `💎 Đổ thạch (${runKey}) sau ${formatTime(delay)}`
      );
      // đánh dấu pending để reload không set lại
      localStorage.setItem(pendingKey, todayKey());
      setTimeout(async () => {
        try {
const ok = await autoDoThachWithRetry(3, 10_000);
if (ok) markRun(runKey);

        } catch (e) {
          showToast("❌ Lỗi auto đổ thạch", false);
        }
      }, delay);
    }
  });
}
    // ⏰ Scheduler
setInterval(autoDoThachByTime, 30_000);
 // ======================
// ⏳ WAIT hh3dData
// ======================
async function getSpinApi() {
  let retry = 0;
  while (!unsafeWindow.hh3dData || !unsafeWindow.hh3dData.act) {
    await new Promise(r => setTimeout(r, 100));
    retry++;

    if (retry % 10 === 0) {
      console.log("...chưa có hh3dData (unsafeWindow)", retry);
    }
    if (retry > 200) {
      console.error("❌ Không load được hh3dData (unsafeWindow)");
      return null;
    }
  }
  const spinId = unsafeWindow.hh3dData.act.lotterySpin;
  console.log("🎯 lotterySpin =", spinId);
  return `${location.origin}/wp-json/lottery/v1/${spinId}`;
}
// ======================
// 🎯 SPIN
// ======================
async function spinLottery(times) {
  try {
    console.log("🚀 Bắt đầu spinLottery");

    const securityToken = await getSecurityToken(location.href);
    console.log("🔑 securityToken =", securityToken);
    if (!securityToken) {
      showToast("❌ Không lấy được security token");
      return;
    }

    const SPIN_API = await getSpinApi();

    if (!SPIN_API) {
      showToast("❌ Không lấy được API");
      return;
    }
    const wpNonce = localStorage.getItem("HH3D_NONCE_WP") || "";
    console.log("🧾 wpNonce =", wpNonce);

    times = Number(times);
    if (!times || times < 1) times = 4;

    for (let i = 1; i <= times; i++) {
      console.log(`🎰 Lần quay ${i}`);
      const resp = await fetch(SPIN_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": wpNonce,
          "x-security-token": securityToken
        },
        credentials: "include"
      });
      console.log("📥 Status:", resp.status);
      const text = await resp.text();
      console.log("📦 Raw response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("❌ Không parse được JSON");
        return;
      }
      if (!data.success) {
        showToast(`❌ ${data.message || "Quay lỗi"}`);
        break;
      }
      showToast(`🎉 ${data.message}`);
      await sleep(600);
    }
  } catch (e) {
    console.error("💥 Lỗi:", e);
  }
}
// ======================
const sleep = ms => new Promise(r => setTimeout(r, ms));
// ==================== TẾ LỄ (REQUEST CHÍNH + IFRAME DỰ PHÒNG) ====================
let iframeTeLe = null;
let iframeDebug_TeLe = false; // true = hiện iframe debug
// ==================== LẤY SECURITY TOKEN (TRANG CHỦ) ====================
async function getSecurityToken() {
  const HOME_URL = buildUrl("/");
  let html = null;
  let wpNonce = null;
  let securityToken = null;

  try {
    const resp = await fetch(HOME_URL, {
      credentials: "include",
      cache: "no-store",
    });
    // ===== BẮT X-WP-NONCE TỪ HEADER =====
    try {
      wpNonce = resp.headers.get("x-wp-nonce");
      if (wpNonce) {
        localStorage.setItem("HH3D_NONCE_WP", wpNonce);
      }
    } catch {}

    if (resp.ok) html = await resp.text();
  } catch (e) {
    console.warn("⚠️ Fetch HOME lỗi", e);
  }
  // ===== FALLBACK HTML HIỆN TẠI =====
  if (!html) {
    html = document.documentElement.outerHTML;
  }
  // ===== BẮT SECURITY TOKEN =====
  const secMatch = html.match(/"securityToken"\s*:\s*"([^"]+)"/);
  if (secMatch?.[1]) {
    securityToken = secMatch[1];
  } else {
    console.warn("❌ Không tìm thấy securityToken");
  }
  // ===== BẮT WP NONCE TRONG HTML (NẾU HEADER CHƯA CÓ) =====
  if (!wpNonce) {
    const noncePatterns = [
      /wpApiSettings\s*=\s*{[^}]*"nonce"\s*:\s*"([^"]+)"/i,
      /"nonce"\s*:\s*"([^"]+)"/i,
      /_wpnonce\s*=\s*"([^"]+)"/i,
      /name="_wpnonce"\s+value="([^"]+)"/i,
    ];
    for (const p of noncePatterns) {
      const m = html.match(p);
      if (m?.[1]) {
        wpNonce = m[1];
        localStorage.setItem("HH3D_NONCE_WP", wpNonce);
        break;
      }
    }
  }

  if (!wpNonce) {
    console.warn("❌ Không lấy được WP nonce");
  }

  return securityToken;
}

// ==================== TẾ LỄ BẰNG REQUEST  ====================
async function teLeByRequest() {
  try {
    const securityToken = await getSecurityToken();
    if (!securityToken) {
      console.warn("❌ Không lấy được security_token");
      return false;
    }
    const resp = await fetch(
      buildUrl("/wp-json/tong-mon/v1/te-le-tong-mon"),
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "X-WP-Nonce": localStorage.getItem("HH3D_NONCE_WP") || "",
          "security_token": securityToken,
        },
        body: JSON.stringify({
          action: "te_le_tong_mon",
          security_token: securityToken,
        }),
      }
    );
    const data = await resp.json();
    // ✅ VỪA TẾ LỄ XONG
    if (data?.success === true) {
      showToast("🙏 Tế Lễ thành công", "success");
      return true;
    }
    // ✅ ĐÃ TẾ LỄ HÔM NAY (CŨNG COI LÀ OK)
    if (
      data?.success === false &&
      data?.message === "Đạo hữu đã Tế Lễ hôm nay."
    ) {
      showToast("🙏 Đã Tế Lễ hôm nay", "success");
      return true;
    }
    // ❌ LỖI THẬT
    console.warn("❌ Tế Lễ thất bại:", data);
    return false;
  } catch (err) {
    console.error("❌ Lỗi request Tế Lễ:", err);
    return false;
  }
}
// ==================== TẾ LỄ BẰNG IFRAME (DỰ PHÒNG) ====================
async function teLeByIframe() {
  try {
    if (iframeTeLe) {
      iframeTeLe.remove();
      iframeTeLe = null;
    }
    iframeTeLe = document.createElement("iframe");
    iframeTeLe.src = buildUrl(
      "/danh-sach-thanh-vien-tong-mon?t=" +
        Math.random().toString(36).slice(2)
    );
    if (iframeDebug_TeLe) {
      iframeTeLe.width = "420";
      iframeTeLe.height = "320";
      Object.assign(iframeTeLe.style, {
        position: "fixed",
        left: "20px",
        bottom: "20px",
        zIndex: 999999,
        border: "3px solid gold",
        borderRadius: "8px",
        background: "#000",
        boxShadow: "0 0 10px rgba(255,215,0,0.6)",
      });
    } else {
      iframeTeLe.style.display = "none";
      showToast("🙏 Tế Lễ bằng iframe (dự phòng)", "warning");
    }
    document.body.appendChild(iframeTeLe);
    iframeTeLe.onload = async () => {
      try {
        const doc =
          iframeTeLe.contentDocument ||
          iframeTeLe.contentWindow.document;
        await wait(2500);
        const btnTeLe = doc.querySelector("#te-le-button");
        if (!btnTeLe) throw new Error("Không tìm thấy nút Tế Lễ");
        btnTeLe.click();
        await wait(2000);
        const confirmBtn = doc.querySelector(
          ".swal2-confirm.swal2-styled"
        );
        if (confirmBtn) confirmBtn.click();
        await wait(1500);
        showToast("✅ Hoàn tất Tế Lễ", "success");
      } catch (e) {
        showToast("❌ Lỗi iframe Tế Lễ: " + e.message, "error");
      } finally {
        iframeTeLe?.remove();
        iframeTeLe = null;
      }
    };
  } catch (err) {
    showToast("❌ Lỗi teLeByIframe(): " + err.message, "error");
  }
}
// ==================== HÀM GỌI DUY NHẤT ====================
async function doTeLe() {
  showToast("🙏 Đang Tế Lễ nhanh...", "info");
  const ok = await teLeByRequest();
  if (ok) return;
  showToast("⚠️ Request thất bại → dùng cách dự phòng", "warning");
  await teLeByIframe();
}
// ==== VẤN ĐÁP  ====
let iframeQuiz = null;
let iframeDebug_Quiz = true;
// ======= ĐÁP ÁN ====
const QA = {
        "Tiêu Viêm đã lập nên thế lực nào khi ở Học Viện Già Nam ?": "Bàn Môn",
        "Trong Đấu La Đại Lục, Đường Hạo là gì của Đường Tam?": "Cha",
        'Nhân vật chính của \"Thần Ấn Vương Tọa\" là ai?': "Long Hạo Thần",
        "Mối tình đầu của Diệp Thần trong Tiên Võ Đế Tôn là ai ?": "Cơ Ngưng Sương",
        "Thiên Hoả Tôn Giả trong Đấu Phá Thương Khung dùng thi thể của ai để hồi sinh ?": "Vân Sơn",
        "Bách Lý Đông Quân là nhân vật trong bộ hoạt hình trung quốc nào sau đây ?": "Thiếu Niên Bạch Mã Tuý Xuân Phong",
        "Bạch Nguyệt Khôi là tên nhân vật chính trong bộ phim hoạt hình trung quốc nào sau đây ?": "Linh Lung",
        "Ai là huynh đệ và cũng là người thầy mà Vương Lâm trong Tiên Nghịch kính trọng nhất ?": "Tư Đồ Nam",
        "Ai là mẹ của Đường Tam?": "A Ngân",
        "Ai là người đứng đầu Vũ Hồn Điện?": "Bỉ Bỉ Đông",
        "Ai là nhân vật chính trong bộ phim hoạt hình trung quốc Thần Mộ ?": "Thần Nam",
        "Bạch Tiểu Thuần là nhân vật chính trong bộ hoạt hình trung quốc nào ?": "Nhất Niệm Vĩnh Hằng",
        "Bạch Tiểu Thuần trong Nhất Niệm Vĩnh Hằng luôn được ai âm thầm giúp đỡ ?": "Đỗ Lăng Phỉ",
        "Bộ phim nào sau đây thuộc tiểu thuyết của tác giả Thiên Tằm Thổ Đậu": "Tất cả đáp án trên (ĐCT, VĐCK, ĐPTK)",
        "Các cấp bậc nào sau đây thuộc phim Đấu Phá Thương Khung ?	": "Đấu Tông",
        "Cháu dượng của Bạch Tiểu Thuần trong Nhất Niệm Vĩnh Hằng là ai ?": "Tống Khuyết",
        "Chủ nhân đời trước của Vẫn Lạc Tâm Viêm trong Đấu Phá Thương Khung là ai ?": "Diệu Thiên Hỏa",
        "Dược Trần trong Đấu Phá Thương Khung đã từng bị đồ đệ nào phản bội ?": "Hàn Phong",
        "Công pháp gì giúp Tiêu Viêm trong Đấu Phá Thương Khung hấp thụ nhiều loại dị hỏa ?": "Phần Quyết",
        "Công pháp nào sau đây là của Hàn Lập trong Phàm Nhân Tu Tiên ?": "Tất cả đáp án",
        "Cơ Tử Nguyệt là nhân vật trong các bộ hoạt hình trung quốc nào sau đây ?": "Già Thiên",
        "Dạ Táng còn là biệt danh của ai trong Nhất Niệm Vĩnh Hằng ?": "Bạch Tiểu Thuần",
        "Danh xưng Tàn Thi Bại Thuế là của nhân vật nào trong Hoạ Giang Hồ Chi Bất Lương Nhân ?": "Hàng Thần",
        "Diễm Linh Cơ là nhân vật trong phim hoạt hình trung quốc nào ?	": "Thiên Hành Cửu Ca",
        "Diệp Phàm là nhân vật chính trong bộ hoạt hình trung quốc nào ?": "Già Thiên",
        "Diệp Thần trong Tiên Võ Đế Tôn gia nhập Tông Môn nào đầu tiên ?": "Chính Dương Tông",
        "Dược Trần trong Đấu Phá Thương Khung đã từng bị đồ đệ nào phản bội ?": "Hàn Phong",
        "Đại ca của Tiêu Viêm trong Đấu Phá Thương Khung tên gì ?": "Tiêu Đỉnh",
        "Đàm Vân là nhân vật chính trong bộ phim hoạt hình trung quốc nào sau đây ?": "Nghịch Thiên Chí Tôn",
        "Đạo lữ của Hàn Lập là ai ?": "Nam Cung Uyển",
        "Ai là người thầy của Đường Tam?": "Đại Sư",
        "Tiêu Viêm trong Đấu Phá Thương Khung thuộc gia tộc nào?": "Tiêu gia",
        "Trương Tiểu Phàm trong Tru Tiên từng được nhận vào môn phái nào?": "Thanh Vân Môn",
        "Ninh Diêu là một nhân vật trong bộ phim hoạt hình trung quốc nào sau đây ?": "Kiếm Lai",
        "Vũ khí của Đàm Vân trong Nghịch Thiên Chí Tôn là gì ?": "Hồng Mông Thần Kiếm",
        "Khô Lâu Đà Chủ xuất hiện trong bộ phim hoạt hình nào dưới đây ?": "Võ Thần Chúa Tể",
        "Tần Nam là nhân vật chính trong bộ hoạt hình trung quốc nào sau đây ?": "Tuyệt Thế Chiến Hồn",
        "Tiêu Thần là nhân vật chính trong bộ phim hoạt hình trung quốc nào sau đây ?": "Trường Sinh Giới",
        "Tần Mục là nhân vật chính trong bộ phim hoạt hình trung quốc nào sau đây ?": "Mục Thần Ký",
        "Lý Tinh Vân là một nhân vật trong bộ phim hoạt hình trung quốc nào sau đây ?": "Họa Giang Hồ Chi Bất Lương Nhân",
        "Tỉnh Cửu là nhân vật chính trong bộ phim hoạt hình trung quốc nào sau đây ?": "Đại Đạo Triều Thiên",
        "Ám tinh giới được xuất hiện trong bộ phim hoạt hình nào dưới đây ?": "Tinh Thần Biến",
        "Lâm Thất Dạ là nhân vật trong bộ hoạt hình trung quốc nào sau đây ?": "Trảm Thần",
        "Y Lai Khắc Tư là một nhân vật trong bộ phim hoạt hình trung quốc nào sau đây ?": "Cả 1 và 2",
        "Vương Lâm trong phim Tiên Nghịch dựa vào gì để vô địch cùng cảnh giới ?": "Cực Cảnh",
        "Vũ khí mà Tiêu Viêm trong Đấu Phá Thương Khung luôn mang bên mình có tên gọi là gì ?": "Huyền Trọng Xích",
        "Vũ hồn thứ hai của Đường Tam là gì?": "Hạo Thiên Chùy",
        "Vũ hồn của Tiểu Vũ là gì?": "Nhu Cốt Thỏ",
        "Vũ hồn của Mã Hồng Tuấn là gì?": "Hỏa Phượng Hoàng",
        "Vũ hồn của Đới Mộc Bạch là gì?": "Bạch Hổ",
        "Vũ hồn của Chu Trúc Thanh là gì?": "U Minh Linh Miêu",
        "Vũ Canh là nhân vật trong bộ hoạt hình trung quốc nào sau đây ?": "Vũ Canh Kỷ",
        "Vân Triệt là tên nhân vật chính trong bộ phim hoạt hình trung quốc nào sau đây ?": "Nghịch Thiên Tà Thần",
        "Tử Nghiên trong Đấu Phá Thương Khung thuộc chủng tộc nào ?": "Thái Hư Cổ Long",
        "Trương Tiểu Phàm trong phim Tru Tiên còn có tên gọi là ?": "Quỷ Lệ",
        "Trước khi đến Linh Khê Tông, Bạch Tiểu Thuần trong Nhất Niệm Vĩnh Hằng ở đâu ?": "Mạo Nhi Sơn Thôn",
        "Trong Vĩnh Sinh - Phương Hàn hẹn ước 10 năm cùng với ai ?": "Hoa Thiên Đô",
        "Trong Tru Tiên, Điền Bất Dịch là thủ tọa của Phong nào?": "Đại Trúc Phong",
        "Trong Tiên Nghịch, Vương Lâm nhận được truyền thừa gì ở Cổ Thần Chi Địa ?": "Ký Ức",
        "Trong phim Tiên Nghịch, Vương Lâm vô tình có được pháp bảo nghịch thiên nào ?": "Thiên Nghịch Châu",
        "Trong Phàm Nhân Tu Tiên ai bị luyện thành khôi lỗi Khúc Hồn ?": "Trương Thiết",
        "Trong Già Thiên, thể chất Diệp Phàm là thể chất gì ?": "Hoang Cổ Thánh Thể",
        "Mẫu thân của La Phong trong Thôn Phệ Tinh Không tên là gì ?": "Cung Tâm Lan",
        "Phương Hàn là nhân vật trong bộ hoạt hình trung quốc nào sau đây ?": "Vĩnh Sinh",
        "Sư mẫu của Bạch Tiểu Thuần trong Nhất Niệm Vĩnh Hằng là ai ?": "Hứa Mị Nương",
        'Số hiệu vị thần của main trong Trảm Thần: Phàm Trần Thần Vực là số mấy ?': '003',
        "Độc Cô Bác trong Đấu La Đại Lục có vũ hồn gì ?": "Bích Lân Xà",
        "Thánh nữ nào trong Già Thiên bị nhân vật chính Diệp Phàm lấy mất cái áo lót ?": "Diêu Hi",
        "Nhân vật Bách Lý Đồ Minh xuất hiện trong phim hoạt hình nào dưới đây ?": "Trảm Thần Chi Phàm Trần Thần Vực",
        "Nhân vật nào luôn bất bại trong phim Hoạt Hình Trung Quốc, được ví như One-Punch Man ?": "Từ Dương",
        "Các cấp bậc nào sau đây thuộc phim Đấu Phá Thương Khung ?": "Đấu Tông",
        "Nam chính trong bộ Quyến Tư Lượng là ai ?": "Kính Huyền",
        "Tình đầu của Diệp Phàm trong Già Thiên là ai ?": "Lý Tiểu Mạn",
        "Đâu là nhân vật chính trong phim Bách Luyện Thành Thần ?": "La Chinh",
        "Đâu là Thái Cổ Thập Hung trong phim Thế Giới Hoàn Mỹ ?": "Tất cả đáp án trên (ĐTT, CU, CL)",
        "Đâu là tuyệt kỹ số 1 Hạo Thiên Tông mà Đường Hạo dạy cho con trai trong Đấu La Đại Lục ?": "Đại Tu Di Chùy",
        "Đấu Sát Toàn Viên Kiếm là một kỹ năng trong bộ phim hoạt hình trung quốc nào ?": "Thần Ấn Vương Tọa",
        "Em trai ruột của Thạch Hạo trong Thế Giới Hoàn Mỹ là ai ?": "Tần Hạo",
        "Hàn Lập sở hữu những vật phẩm nào dưới đây ?": "Thanh Trúc Phong Vân Kiếm",
        "Hàn Lập trong Phàm Nhân Tu Tiên đến Thất Huyền Môn bái ai làm thầy ?": "Mặc Đại Phu",
        "Hàn Lập trong Phàm Nhân Tu Tiên từng cứu ai mà bị hấp thụ tu vi giảm xuống Luyện Khí Kỳ ?": "Nam Cung Uyển",
        "Hoang Thiên Đế là nhân vật chính trong bộ phim hoạt hình trung quốc nổi tiếng nào ?": "Thế Giới Hoàn Mỹ",
        "Hoắc Vũ Hạo là hậu nhân của ai trong Sử Lai Khắc ?": "Đái Mộc Bạch",
        "Hồn hoàn màu nào mạnh nhất?": " Đỏ",
        "Huân Nhi là công chúa của bộ tộc nào?": "Cổ Tộc",
        "Khi ở Già Nam Học Viện, Tiêu Viêm thu phục được loại dị hỏa nào ?": "Vẫn Lạc Tâm Viêm",
        "Kính Huyền trong Quyến Tư Lượng là hậu duệ của tộc nào ?": "Thần Tộc",
        "Lạc Ly trong Đại Chúa Tể là nhân vật trong Tộc nào ?": "Lạc Thần Tộc",
        "Lâm Động trong Vũ Động Càn Khôn học được Linh Võ Học nào khi vào bia cổ Đại Hoang ?": "Đại Hoang Tù Thiên Chỉ",
        "Lâm Động trong Vũ Động Càn Khôn luyện hóa Tổ Phù nào đầu tiên ?": "Thôn Phệ Tổ Phù",
        "Lâm Động trong Vũ Động Càn Khôn sử dụng vũ khí loại nào sau đây ?": "Thương",
        "Lâm Phong là nhân vật trong bộ hoạt hình trung quốc nào sau đây ?": "Vạn Giới Độc Tôn",
        "Lâm Thất Dạ trong Trảm Thần sở hữu sức mạnh của vị thần nào ?": "Thiên Sứ",
        "Long Tuyền Kiếm xuất hiện trong bộ phim hoạt hình nào dưới đây ?": "Họa Giang Hồ Chi Bất Lương Nhân",
        "Lục Tuyết Kỳ trong Tru Tiên thuộc Phong nào trong Thanh Vân Môn?": "Tiểu Trúc Phong",
        "Lý Tinh Vân trong Họa Giang Hồ Chi Bất Lương Nhân sử dụng vũ khí nào sau đây ?": "Long Tuyền Kiếm",
        "Lý Trường Thọ trong Sư Huynh A Sư Huynh xuyên không về Hồng Hoang bái sư ở đâu ?": "Độ Tiên Môn",
        'Man Hồ Tử trong phim "Phàm Nhân Tu Tiên" tu luyện công pháp nào?': 'Thác Thiên Ma Công',
        "Mẫu thân của La Phong trong Thôn Phệ Tinh Không tên là gì ?": "Cung Tâm Lan",
        "Mẹ của Mạnh Xuyên trong Thương Nguyên Đồ tên là gì ?": "Bạch Niệm Vân",
        "Mẹ của Tần Trần là ai ?": "Tần Nguyệt Trì",
        "Mẹ của Thạch Hạo trong Thế Giới Hoàn Mỹ tên là gì": "Tần Di Ninh",
        "Mục đích tu luyện của Vương Lâm trong Tiên Nghịch theo diễn biến phim hiện tại là gì ?": "Báo Thù",
        "Mục Trần trong Đại Chúa Tể liên kết Huyết Mạch với ?": "Cửu U Tước",
        "Mục Vân là nhân vật trong bộ hoạt hình trung quốc nào sau đây ?": "Vô Thượng Thần Đế",
        "Nam chính trong bộ hoạt hình trung quốc Ám Hà Truyện là ai ?": "Tô Mộ Vũ",
        "Nghịch Hà Tông là Tông Môn trong bộ hoạt hình trung quốc nào sau đây ?": "Nhất Niệm Vĩnh Hằng",
        "Nghịch Thiên Nhi Hành là một nhân vật trong bộ phim hh3d nào sau đây ?": "Vũ Canh Kỷ",
        "Ngụy Anh (Ngụy Vô Tiện) là nhân vật trong bộ hhtq nào sau đây  ?": "Ma Đạo Tổ Sư",
        "Người bạn thuở nhỏ của Trương Tiểu Phàm trong Tru Tiên là ai ?": "Lâm Kinh Vũ",
        "Nhân vật Bách Lý Đồ Minh xuất hiện trong phim hoạt hình nào dưới đây ?": "Trảm Thần Chi Phàm Trần Thần Vực",
        "Nhân vật chính của Đấu La Đại Lục là ai?": "Đường Tam",
        "Nhân vật chính Lý Trường Thọ trong Sư Huynh A Sư Huynh đã tỏ tình với ai ?": "Vân Tiêu",
        "Nhân vật chính trong Thương Nguyên đồ là ai ?": "Mạnh Xuyên",
        "Nhân vật chính trong Yêu Thần Ký tên là gì ?": "Nhiếp Ly",
        "Nhân vật nào sau đây được mệnh danh là Vua Lỳ Đòn trong Đấu Phá Thương Khung ?": "Phượng Thanh Nhi",
        "Nhị ca của Tiêu Viêm trong Đấu Phá Thương Khung tên gì ?": "Tiêu Lệ",
        "Nhiếp Phong là nhân vật chính trong phim hoạt hình trung quốc nào ?": "Chân Võ Đỉnh Phong",
        "Nữ chính cũng là vợ Đông Bá Tuyết Ưng trong Tuyết Ưng Lĩnh Chủ là ai sau đây ?": "Dư Tĩnh Thu",
        "Nữ chính trong bộ Quyến Tư Lượng là ai ?": "Đồ Lệ",
        "Phụ Thân của Lâm Động trong Vũ Động Càn Khôn là ai ?": "Lâm Khiếu",
        "Ông nội của Lâm Động trong Vũ Động Càn Khôn là ai ?": "Lâm Chấn Thiên",
        "Phương Hàn là nhân vật trong bộ hoạt hình trung quốc nào sau đây ?": "Vĩnh Sinh",
        "Phương Hàn trong Vĩnh Sinh nhận được Giao Phục Hoàng Tuyền Đồ từ ai ?": "Bạch Hải Thiện",
        "Phương Hàn trong Vĩnh Sinh xuất thân là gì ở nhà họ Phương ?": "Nô Bộc",
        "Phượng Thanh Nhi trong Đấu Phá Thương Khung thuộc chủng tộc nào ?": "Thiên Yêu Hoàng Tộc",
        "Số hiệu vị thần của main trong  Trảm Thần: Phàm Trần Thần Vực là số mấy ?": "003",
        "Sử Lai Khắc Thất Quái đã từng đến nơi nào để luyện tập?": "Hải Thần Đảo",
        "Sư phụ của Bạch Tiểu Thuần trong Nhất Niệm Vĩnh hằng là ai ?": "Lý Thanh Hậu",
        "Sư phụ của Lý Trường Thọ là ai ?": "Tề Nguyên",
        "Sư phụ mà Diệp Thần yêu trong Tiên Võ Đế Tôn là ai ?": "Sở Huyên Nhi",
        "Sư Phụ thứ 2 của Lý Trường Thọ trong phim": "Thái Thanh Thánh Nhân",
        "Tại sao Đường Tam bị Đường Môn truy sát ở tập đầu phim Đấu La Đại Lục ?": "Học trộm tuyệt học bổn môn",
        "Tần Vũ trong Tinh Thần Biến được tặng pháp bảo siêu cấp vip pro nào để tu luyện nhanh chóng ?": "Khương Lan Tháp",
        "Tần Vũ trong Tinh Thần Biến khiếm khuyết đan điền nhờ đâu mới có thể tu luyện ?": "Lưu Tinh Lệ",
        "Thần Thông Bí Cảnh xuất hiện trong bộ phim hoạt hình nào dưới đây ?": "Vĩnh Sinh",
        "Thần vị mà Đường Tam đạt được là gì?": "Hải Thần và Tu La Thần",
        "Thế lực nào là đối thủ lớn nhất của Tiêu Viêm trong Đấu Phá Thương Khung?": "Hồn Điện",
        "Thú cưng Thôn Thôn trong Nguyên Tôn sinh ra có sức mạnh ngang cảnh giới nào ?": "Thái Sơ Cảnh",
        "Tiêu Khinh Tuyết xuất hiện trong bộ hoạt hình nào dưới đây ?": "Tuyệt Thế Chiến Hồn",
        "Tiêu Viêm trong Đấu Phá Thương Khung đã Hẹn Ước 3 Năm với ai ?": "Nạp Lan Yên Nhiên",
        "Tiêu Viêm trong Đấu Phá Thương Khung sử dụng loại vũ khí nào sau đây ?": "Thước",
        "Trần Bình An là nam chính trong bộ phim hoạt hình trung quốc nào ?": "Kiếm Lai",
        "Triệu Ngọc Chân là nhân vật trong bộ hoạt hình trung quốc nào sau đây ?": "Thiếu Niên Bạch Mã Túy Xuân Phong",
        "Trong bộ Đấu Phá Thương Khung, Tiêu Viêm tìm đến ai để cứu Dược Lão ?": "Phong Tôn Giả",
        "Trong bộ Tiên Nghịch, nhân vật chính Vương Lâm khi ở quê nhà còn có tên khác là gì ?": "Thiết Trụ",
        "Trong Già Thiên, thể chất Diệp Phàm là thể chất gì ?": "Hoang Cổ Thánh Thể",
        "Trong Phàm Nhân Tu Tiên ai bị luyện thành khôi lỗi Khúc Hồn ?	": "Trương Thiết",
        "Trong phim Tiên Nghịch, Vương Lâm vô tình có được pháp bảo nghịch thiên nào ?": "Thiên Nghịch Châu",
        "Trong Tiên Nghịch, Vương Lâm nhận được truyền thừa gì ở Cổ Thần Chi Địa ?": "Ký Ức",
        'Trước khi đến Linh Khê Tông, Bạch Tiểu Thuần trong Nhất Niệm Vĩnh Hằng ở đâu ?': 'Mạo Nhi Sơn Thôn',
        "1 Trong 2 Admin của website HoatHinh3D là ai ? (Biệt danh chính xác ở web)": "Từ Dương",
        "Bộ phim nào sau đây thuộc tiểu thuyết của tác giả Thiên Tằm Thổ Đậu": "Tất cả đáp án",
        "Chủ nhân đời trước của Vẫn Lạc Tâm Viêm trong Đấu Phá Thương Khung là ai ?" : "Diệu Thiên Hoả",
        "Hồn hoàn màu nào mạnh nhất?": "Đỏ",
        "Triệu Ngọc Chân là nhân vật trong bộ hoạt hình trung quốc nào sau đây ?": "Thiếu Niên Bạch Mã Tuý Xuân Phong",
        "Hàn lập sở hữu những vật phẩm nào dưới đây ?": "Thanh Trúc Phong Vân Kiếm",
        "Mục đích chính tu luyện của Tần Vũ trong Tinh Thần Biến là gì ??": "Vì muốn được cưới Khương Lập",
        "Hàn Lập trong Phàm Nhân Tu Tiên gia nhập môn phái nào đầu tiên ?": "Thất Huyền Môn",
        "Diễm Linh Cơ là nhân vật trong phim hoạt hình trung quốc nào ?": "Thiên Hành Cửu Ca",
        "Huân Nhi là công chúa của bộ tộc nào?": "Cổ tộc",
        "Tại sao Hàn Lập khi gặp Phong Hi không chạy mà ở lại giúp đỡ chế tạo Phong Lôi Sí ?": "Vì đánh không lại.",
        "Nhân vật chính trong phim Sư Huynh A Sư Huynh là ai ?": "Lý Trường Thọ",
        "Nhân vật chính trong Man Hoang Tiên Giới là ai ?": "Lục Hàng Chi",
        "Khô Lâu Đà Chủ xuất hiện trong bộ phim hoạt hình nào dưới đây ?": "Võ Thần Chúa Tể",
        "Tần Nam là nhân vật chính trong bộ hoạt hình trung quốc nào sau đây ?": "Tuyệt Thế Chiến Hồn",
        "Tiêu Thần là nhân vật chính trong bộ phim hoạt hình Trung Quốc nào sau đây ?": "Trường Sinh Giới",
        "Đâu là Thái Cổ Thập Hung trong phim Thế Giới Hoàn Mỹ ?": "Tất cả đáp án",
        "Vương Lâm trong phim Tiên Nghịch dựa vào gì để vô địch cùng cảnh giới ?": "Cực cảnh",
};
// ==================== API ====================
const QUIZ_API = buildUrl("/wp-content/themes/halimmovies-child/hh3d-ajax.php");
// ==================== REQUEST (ƯU TIÊN) ====================
async function quizByRequest() {
  try {
    // 🔑 lấy security
    const security = await getSecurityToken();
    if (!security) throw new Error("Không có security_token");
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
    };
    let answered = 0;
    const MAX = 5;
    while (answered < MAX) {
      // ===== LOAD QUIZ =====
      const payloadLoad = new URLSearchParams();
      payloadLoad.append("action", "load_quiz_data");
      payloadLoad.append("security_token", security);
      const loadResp = await fetch(QUIZ_API, {
        method: "POST",
        credentials: "include",
        headers,
        body: payloadLoad,
      });
      const loadData = await loadResp.json();
      if (!loadData.success || !loadData.data) {
        throw new Error("Load quiz fail");
      }
      if (loadData.data.completed) {
        showToast("✅ Vấn Đáp hôm nay đã hoàn thành", "success");
        return true;
      }
      const questions = loadData.data.questions || [];
      const correctCount = loadData.data.correct_answers || 0;
      const questionsToAnswer = questions.slice(correctCount);
      if (!questionsToAnswer.length) break;
      let hasAnswer = false;
      for (const q of questionsToAnswer) {
        if (answered >= MAX) break;
        const questionText = q.question?.trim();
        const answerText = QA[questionText];
        if (!answerText) {
          console.warn("❌ Thiếu đáp án:", questionText);
          continue;
        }
        const answerIndex = q.options.findIndex(
          opt => opt.trim() === answerText.trim()
        );
        if (answerIndex === -1) {
          console.warn("❌ Không khớp đáp án:", questionText, answerText);
          continue;
        }
      const payloadSave = new URLSearchParams();
payloadSave.append("action", "save_quiz_result");
payloadSave.append("security_token", security);
payloadSave.append("question_id", q.id);
payloadSave.append("answer", answerIndex);
const saveResp = await fetch(QUIZ_API, {
  method: "POST",
  credentials: "include",
  headers,
  body: payloadSave,
});
const saveData = await saveResp.json();
if (!saveData.success) {
  console.warn("❌ Save fail:", saveData.message);
  continue;
}
answered++;
hasAnswer = true;
// ✅ HIỂN THỊ CÂU HỎI + ĐÁP ÁN
showToast(
  `🧠 <b>${questionText}</b><br>👉 <span style="color:#00ffcc">${answerText}</span>`,
  "success"
);
await wait(700);
      }
      if (!hasAnswer) {
        console.warn("⚠️ Không tìm được câu trả lời mới → dừng");
        break;
      }
    }
    showToast(`🏁 Hoàn tất Vấn Đáp (${answered} câu)`, "success");
    return true;
  } catch (e) {
    console.warn("❌ Request quiz fail:", e.message);
    return false;
  }
}
// ==================== IFRAME (DỰ PHÒNG) ====================
async function quizByIframe() {
  try {
    if (iframeQuiz) {
      iframeQuiz.remove();
      iframeQuiz = null;
    }
    iframeQuiz = document.createElement("iframe");
    iframeQuiz.src = buildUrl("/van-dap-tong-mon?t=" + Math.random().toString(36).slice(2));
    if (iframeDebug_Quiz) {
      iframeQuiz.width = "420";
      iframeQuiz.height = "320";
      Object.assign(iframeQuiz.style, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: 999999,
        border: "3px solid cyan",
        borderRadius: "8px",
        background: "#000",
        boxShadow: "0 0 10px rgba(0,255,255,0.6)",
      });
      showToast("🧠 Iframe Vấn Đáp (fallback)", "warning");
    } else {
      iframeQuiz.style.display = "none";
    }
    document.body.appendChild(iframeQuiz);
    iframeQuiz.onload = async () => {
      try {
        const doc = iframeQuiz.contentDocument || iframeQuiz.contentWindow.document;
        await wait(2000);
        // Bắt đầu
        const startBtn = doc.querySelector("#start-quiz-button");
        if (!startBtn) throw new Error("Không tìm thấy nút bắt đầu");
        startBtn.click();
        await wait(1500);
        // Đã hoàn thành?
        const doneMsg = doc.querySelector("#result.slide-down");
        if (doneMsg?.textContent.includes("hoàn thành Vấn Đáp")) {
          showToast("✅ Đã hoàn thành Vấn Đáp hôm nay", "success");
          iframeQuiz.remove();
          iframeQuiz = null;
          return;
        }
        // Loop 5 câu
        for (let i = 0; i < 5; i++) {
          const qEl = doc.querySelector("#question");
          if (!qEl) break;
          const question = qEl.textContent.trim();
          const answer = QA[question];
          const options = [...doc.querySelectorAll(".option")];
          if (!answer) throw new Error("Thiếu đáp án iframe");
          const btn = options.find(b => b.textContent.trim() === answer);
          if (!btn) throw new Error("Không khớp đáp án iframe");
          btn.click();
          showToast(`🧩 ${question} → ${answer}`, "success");
          await wait(4000);

          const doneCount = doc.querySelectorAll("#progress .progress-circle.correct").length;
          if (doneCount >= 5) break;
        }
        showToast("🏁 Hoàn tất Vấn Đáp (iframe)", "success");
        await wait(1500);
        iframeQuiz.remove();
        iframeQuiz = null;
      } catch (e) {
        showToast("❌ Iframe Vấn Đáp lỗi: " + e.message, "error");
        if (iframeQuiz) iframeQuiz.remove();
        iframeQuiz = null;
      }
    };
  } catch (e) {
    showToast("❌ Lỗi mở iframe: " + e.message, "error");
  }
}
// ==================== ENTRY POINT ====================
async function autoQuiz() {
  showToast("Bắt Đầu Vấn Đáp ...", "info");

  const ok = await quizByRequest();
  if (ok) return;

  showToast("⚠️ FAil → chạy bằng cách dự phòng", "warning");
  await quizByIframe();
}
// ==================== HOANG VỰC ====================
let autoHoangVucTimer = null;
let iframeHV = null;
let iframeOn_HV = false;
let iframeDebug_HV = false; // 👁 true = hiện iframe để debug, false = chạy ngầm
    function showRewardToastFromDoc(doc) {
  const items = doc.querySelectorAll(".reward-content .reward-item");
  if (!items.length) return;

  items.forEach(item => {
    let text = item.innerText
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      showToast("🎁 " + text, "success");
    }
  });
}
function stopAutoHoangVucHidden() {
  try {
    clearTimeout(autoHoangVucTimer);
    autoHoangVucTimer = null;
    if (iframeHV) {
      iframeHV.remove();
      iframeHV = null;
    }
    iframeOn_HV = false;
    localStorage.setItem("hoangvucToggle", "off");
    if (toggleHV) toggleHV.checked = false;
    showToast("🛑 Auto Hoang Vực đã tắt.", "error");
  } catch (err) {
    console.error("⚠️ Lỗi khi dừng Auto Hoang Vực:", err);
    showToast("⚠️ Lỗi khi dừng Auto Hoang Vực: " + err.message, "error");
  }
}
// ===== HOANG VỰC =====
async function autoHoangVucHidden() {
  clearTimeout(autoHoangVucTimer);
  if (!iframeHV) {
    iframeHV = document.createElement("iframe");
iframeHV.src = buildUrl("/hoang-vuc?t=" + Math.random().toString(36).substring(2));
    if (iframeDebug_HV) {
      iframeHV.width = "400";
      iframeHV.height = "300";
      const randLeft = Math.floor(Math.random() * (window.innerWidth - 420));
      const randTop = Math.floor(Math.random() * (window.innerHeight - 320));
      Object.assign(iframeHV.style, {
        position: "fixed", left: randLeft + "px", top: randTop + "px",
        zIndex: 999999, border: "3px solid red", borderRadius: "8px",
        boxShadow: "0 0 10px rgba(255,0,0,0.6)", background: "#000"
      });
      showToast("⚔️ Auto Hoang Vực bật (DEBUG hiển thị)", "success");
    } else {
      iframeHV.width = "0";
      iframeHV.height = "0";
      iframeHV.style.display = "none";
      showToast("⚔️ Hoang Vực bật");
    }
    document.body.appendChild(iframeHV);
    iframeOn_HV = true;
  } else {
iframeHV.src = buildUrl("/hoang-vuc?t=" + Math.random().toString(36).substring(2));
  }
       iframeHV.onload = async () => {
       try {
        const doc = iframeHV.contentDocument || iframeHV.contentWindow.document;
        await wait(3000); // chờ trang ổn định hoàn toàn
        // 🎁 Có thưởng → nhận luôn
        const rewardBtn = doc.querySelector("#reward-button");
        if (rewardBtn) {
        showToast("🎁 Có thưởng! Đang nhận...", "success");
         rewardBtn.click();
          await wait(2500);
          // parse thưởng
           showRewardToastFromDoc(doc);
           // reload lại Hoang Vực
             await wait(1500);
             iframeHV.src = buildUrl("/hoang-vuc?t=" + Math.random().toString(36).substring(2));
             return;
             }
           // 🔄 Bị giảm sát thương → đổi ngũ hành
      const decreaseIcon = doc.querySelector(".decrease-damage i.fas.fa-arrow-down, i.fas.fa-arrow-down");
      if (decreaseIcon) {
        showToast("🔄 Phát hiện giảm sát thương — đổi ngũ hành...", "info");
        const changeBtn = doc.querySelector("#change-element-button");
        if (changeBtn) {
          changeBtn.click();
          await wait(1000);
          const confirm = doc.querySelector(".swal2-confirm.swal2-styled");
          if (confirm && confirm.textContent.includes("Đổi")) {
            confirm.click();
            showToast("✨ Đã xác nhận đổi ngũ hành!", "success");
          }
        }
        autoHoangVucTimer = setTimeout(autoHoangVucHidden, 5000);
        return;
      }
      // 🧮 Kiểm tra lượt đánh còn lại
      const remainEl = doc.querySelector(".remaining-attacks");
      if (!remainEl) {
        showToast("⚠️ Không thấy lượt đánh.", "error");
        stopAutoHoangVucHidden();
        return;
      }
      const remain = parseInt(remainEl.textContent.match(/\d+/)?.[0] || "0");
      if (remain === 0) {
        showToast("❌ Hết lượt đánh — dừng auto.", "error");
        stopAutoHoangVucHidden();
        return;
      }
      await wait(2000);
      const battleBtn = doc.querySelector("#battle-button");
      const attackBtn = doc.querySelector(".attack-button");
      // 🕑 Nếu có cooldown → tính thời gian chờ
      const cd = doc.querySelector("#countdown-timer");
      if (cd && cd.textContent.includes("Chờ")) {
        const match = cd.textContent.match(/Chờ\s*(\d+)\s*phút\s*(\d+)\s*giây/);
        if (match) {
          const mins = parseInt(match[1]);
          const secs = parseInt(match[2]);
          const delayMs = (mins * 60 + secs + 5) * 1000;
          showToast(`⏳ Hẹn đánh lại sau ${mins}p${secs}s`, "info");
          iframeHV.remove();
          iframeHV = null;
          iframeOn_HV = false;
          autoHoangVucTimer = setTimeout(autoHoangVucHidden, delayMs);
          return;
        }
      }
      // 🚀 Nếu có nút Khiêu Chiến → click trước
      if (battleBtn) {
        showToast("🚀 Bắt đầu Khiêu Chiến!", "success");
        battleBtn.click();
        await wait(3000); // đợi load giao diện tấn công
        // ⚔️ Sau khi vào giao diện, bấm Tấn Công
        const attackBtn2 = doc.querySelector(".attack-button");
        if (attackBtn2) {
          showToast("⚔️ Đang tấn công Boss!", "success");
     attackBtn2.click();
await wait(14000);
// nếu hiện bảng tổng kết
const summary = doc.querySelector("#damage-summary-container");
if (summary && summary.style.display !== "none") {
  showBattleRewardToast(doc);;} }
        // Sau khi đánh xong → trở lại
        const backBtn = [...doc.querySelectorAll("button")].find(b => b.textContent.includes("Trở lại"));
        if (backBtn) {
          backBtn.click();
        }
        // Kiểm tra lại cooldown sau 3s
        await wait(3000);
        const cd2 = doc.querySelector("#countdown-timer");
        if (cd2 && cd2.textContent.includes("Chờ")) {
          const m = parseInt(cd2.textContent.match(/(\d+)\s*phút/)?.[1] || 0);
          const s = parseInt(cd2.textContent.match(/(\d+)\s*giây/)?.[1] || 0);
          const delay = (m * 60 + s + 5) * 1000;
          showToast(`🕒 Hẹn  đánh lại sau ${m}p${s}s`, "info");
          iframeHV.remove();
          iframeHV = null;
          iframeOn_HV = false;
          autoHoangVucTimer = setTimeout(autoHoangVucHidden, delay);
          return;
        }
        // Nếu không có cooldown thì thử lại nhanh sau 10s
        showToast("🔁 HV  Không thấy thời gian hồi — thử lại sau 10s.", "info");
        autoHoangVucTimer = setTimeout(autoHoangVucHidden, 6000);
        return;
      }
      showToast("🔍 Không thấy nút Khiêu Chiến — thử lại sau 10s.", "info");
      autoHoangVucTimer = setTimeout(autoHoangVucHidden, 6000);
    } catch (err) {
      showToast("⚠️ Lỗi autoHoangVucHidden: " + err.message, "error");
      autoHoangVucHidden();
    }
  };
}
    function showBattleRewardToast(doc) {
  // sát thương
  const dmg = doc.querySelector("#damage-summary .amount");
  if (dmg) {
    showToast("💥 Gây " + dmg.textContent + " sát thương", "success");
  }
  // vật phẩm rơi
  const drops = doc.querySelectorAll("#reward-info .drop-item");
  drops.forEach(d => {
    let text = d.innerText.replace(/\s+/g, " ").trim();
    if (text) {
      showToast("🎁 " + text, "success");
    }
  });
}
// ===== API Điểm danh =====
const DD_API = buildUrl("/wp-json/hh3d/v1/action");
async function dailyCheckIn() {
    try {
        const resp = await fetch(DD_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": localStorage.getItem("HH3D_NONCE_WP") || ""
            },
            credentials: "include",
            body: JSON.stringify({ action: "daily_check_in" })
        });
        const data = await resp.json();
        if (data.success) {
            showToast("🎉 " + data.message);
        } else {
            if (data.message?.includes("đã điểm danh")) {
                showToast("⛔ Hôm nay đã điểm danh.");
            } else {
                showToast("❌ Điểm danh lỗi: " + (data.message || "không rõ"));
            }
        }
    } catch (e) {
        showToast("❌ Lỗi kết nối Điểm Danh");
    }
}
 // ===== API SHOP =====
const SHOP_API = buildUrl("/wp-content/themes/halimmovies-child/hh3d-ajax.php");

// ===== LẤY DATA TỪ PAGE =====
function getPageData() {
  return new Promise((resolve) => {
    const script = document.createElement("script");

    script.textContent = `
      (function() {
        window.postMessage({
          type: "HH3D_SHOP_DATA",
          data: {
            action: window.hh3dData?.act?.bossBuy || null,
            nonce: window.ajax_boss_nonce || null
          }
        }, "*");
      })();
    `;

    const handler = (e) => {
      if (e.data?.type === "HH3D_SHOP_DATA") {
        window.removeEventListener("message", handler);
        resolve(e.data.data);
      }
    };

    window.addEventListener("message", handler);

    document.documentElement.appendChild(script);
    script.remove();
  });
}

// ===== FETCH NONCE (fallback) =====
async function fetchNonce() {
  try {
    console.log("🌐 Fetch Hoang Vực lấy nonce...");

   const res = await fetch("/hoang-vuc", {
  credentials: "include",
  cache: "no-store" // 🔥 quan trọng
});

    const html = await res.text();

    const match =
      html.match(/ajax_boss_nonce\s*=\s*["'](.*?)["']/) ||
      html.match(/"ajax_boss_nonce"\s*:\s*"(.*?)"/);

    const nonce = match?.[1] || null;

    console.log("🎯 Nonce fetch:", nonce);

    if (nonce) {
      localStorage.setItem("bossBuy_nonce", nonce);
    }

    return nonce;

  } catch (err) {
    console.error("❌ Fetch nonce lỗi:", err);
    return null;
  }
}

// ===== LẤY ACTION + NONCE =====
async function getShopData() {
  console.log("===== [SHOP FORCE NEW NONCE] =====");

  const pageData = await getPageData();

  let action = pageData?.action || null;
  let nonce = pageData?.nonce || null;

  if (action && nonce) {
    console.log("✅ Lấy trực tiếp từ page");
    return { action, nonce };
  }

  if (!action) {
    console.warn("❌ Không có action");
    return null;
  }

  // 🔥 LUÔN fetch nonce mới
  nonce = await fetchNonce();

  if (!nonce) {
    console.warn("❌ Không lấy được nonce");
    return null;
  }

  return { action, nonce };
}

// ===== HÀM MUA =====
async function buyRuongLB() {
  try {
    const shopData = await getShopData();

    if (!shopData) {
      showToast("❌ Không lấy được action + nonce");
      return;
    }

    console.log("🚀 Gửi request:", shopData);

    const payload = new URLSearchParams({
      action: shopData.action,
      item_id: "ruong_linh_bao",
      item_type: "tinh_thach",
      quantity: "5",
      nonce: shopData.nonce
    });

    const resp = await fetch(SHOP_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: payload,
      credentials: "include"
    });

    const data = await resp.json();

    console.log("📦 RESPONSE:", data);

    if (data.success) {
      const msg =
        data?.data?.message ||
        data?.message ||
        (data?.data?.item_name
          ? `Mua thành công ${data?.data?.quantity || 1} ${data.data.item_name}`
          : "Mua thành công!");

      showToast(`✅ ${msg}`);
    } else {
      const err =
        (typeof data?.data === "string" ? data.data : data?.data?.message) ||
        data?.message ||
        "không rõ";

      showToast(`❌ Lỗi mua: ${err}`);
    }

  } catch (e) {
    console.error("❌ Lỗi:", e);
    showToast("❌ Lỗi kết nối");
  }
}


// ===== BIẾN CHUNG =====
let autoPhucLoiTimer = null;
let iframe = null;
let iframeOn = false;
let iframeDebug = false;
// ===== TẮT & XÓA  =====
function stopAutoPhucLoiHidden() {
  clearTimeout(autoPhucLoiTimer);
  autoPhucLoiTimer = null;
  if (iframe) {
    iframe.remove();
    iframe = null;
  }
  iframeOn = false;
  if (typeof togglePL !== "undefined" && togglePL) togglePL.checked = false;
  localStorage.setItem("phucloiToggle", "off");
  showToast("🛑 Auto Phúc Lợi đã tắt.", "error");
}
    function retryAutoPhucLoiAfter1Min(reason = "") {
  showToast(
    `🔄 Auto Phúc Lợi gặp lỗi${reason ? ": " + reason : ""} — thử lại sau 1 phút`,
    "warning"
  );
  if (iframe) {
    iframe.remove(); iframe = null; } iframeOn = false;
  clearTimeout(autoPhucLoiTimer);
  autoPhucLoiTimer = setTimeout(autoPhucLoiHidden, 60_000);
}
async function autoPhucLoiHidden() {
  clearTimeout(autoPhucLoiTimer);
  const url = buildUrl(
    "/phuc-loi-duong?t=" + Math.random().toString(36).substring(2)
  );
  // ===== TẠO / LOAD IFRAME =====
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.src = url;
    if (iframeDebug) {
      Object.assign(iframe, { width: 400, height: 300 });
      const randLeft = Math.floor(Math.random() * (window.innerWidth - 420));
      const randTop = Math.floor(Math.random() * (window.innerHeight - 320));
      Object.assign(iframe.style, {
        position: "fixed",
        left: randLeft + "px",
        top: randTop + "px",
        zIndex: "999999",
        border: "3px solid gold",
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(255,215,0,0.6)",
        background: "#000"
      });
    } else {
      Object.assign(iframe.style, {
        width: "0",
        height: "0",
        display: "none"
      });
    }
    document.body.appendChild(iframe);
    iframeOn = true;
  } else {
    iframe.src = url;
  }
  // ===== SAU KHI LOAD =====
  iframe.onload = async () => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      await wait(2000);
      const smallChests = [...doc.querySelectorAll(".gift-box.active")].filter(img => {
        const s = (img.getAttribute("data-src") || img.getAttribute("src") || "").trim();
        if (!/ruong-thuong-close\.png$/i.test(s)) return false;
        if (img.classList.contains("disabled") || img.style.pointerEvents === "none") return false;
        return true;
      });
      if (smallChests.length > 0) {
        showToast(`🎁 Phát hiện ${smallChests.length} rương nhỏ có thể mở!`, "success");
        for (const chest of smallChests) {
          chest.click();
          showToast("🗝️ Đang mở rương nhỏ...", "info");
          await wait(2000);
          const toastEls = [...doc.querySelectorAll("li.toast span")];
          if (toastEls.length) {
            toastEls.forEach(el => {
              const msg = el.textContent.trim();
              if (msg) showToast("📢 " + msg, "success");
            });
          } else {
            const swal = doc.querySelector(".swal2-popup .swal2-html-container");
            if (swal) {
              const msg = swal.textContent.trim();
              if (msg) showToast("🎊 " + msg, "success");
            } else {
              showToast("ℹ️ Không thấy thông báo sau khi mở rương nhỏ.", "warning");
            }
          }
          await wait(1500);
        } }
      const shakeChest = doc.querySelector(".chest-box.shake");
      const timerEl = doc.querySelector("#countdown-timer");
      if (!timerEl) {
        retryAutoPhucLoiAfter1Min("không tìm thấy đồng hồ");
        return;
      }
      const timeText = timerEl.textContent.trim();
      showToast("⏱ Thời gian hiện tại: " + timeText);
     if (!shakeChest) {
  showToast("✅ Phúc Lợi đã hoàn tất — tự tắt auto.", "success");
  stopAutoPhucLoiHidden();
  return;
}
      if (timeText === "00:00") {
        showToast("🎁 Đang mở rương ...", "success");
        shakeChest.click();
        await wait(3000);
        const toastEls = [...doc.querySelectorAll("li.toast span")];
        if (toastEls.length) {
          toastEls.forEach(el => {
            const msg = el.textContent.trim();
            if (msg) showToast("📢 " + msg, "success");
          });
        } else {
          showToast("ℹ️ Đã click nhưng không thấy thông báo.", "warning");
        }
        const newTime = timerEl.textContent.trim();
        showToast("🕒 Sau khi mở, thời gian reset: " + newTime);
        if (newTime !== "00:00") {
          const [m, s] = newTime.split(":").map(Number);
          const ms = (m * 60 + s) * 1000;
          iframe.remove();
          iframe = null;
          iframeOn = false;
          showToast(`🔁 Hẹn lại sau ${m}p${s}s.`);
          autoPhucLoiTimer = setTimeout(autoPhucLoiHidden, ms + 5000);
          return;
        } else {
          retryAutoPhucLoiAfter1Min("click rương nhưng timer không reset");
          return;
        }
      }
      const [m, s] = timeText.split(":").map(Number);
      const ms = (m * 60 + s) * 1000;
      iframe.remove();
      iframe = null;
      iframeOn = false;
      showToast(`⏳ Chưa đến giờ — kiểm tra lại sau ${m}p${s}s.`);
      autoPhucLoiTimer = setTimeout(autoPhucLoiHidden, ms + 5000);
    } catch (err) {
      console.error("[PhucLoi] error:", err);
      retryAutoPhucLoiAfter1Min(err.message);
    }
  };
}
// ================== AUTO KHOÁNG – BASE ==================
const STORAGE_MY_ID = "hh3d_my_user_id";
const ATTACK_COOLDOWN = 6500; // 6.5 giây
const STORAGE_FAVORITE_MINES = "hh3d_khoang_favorites";
const STORAGE_TAKEOVER = "hh3d_khoang_takeover";
const STORAGE_TUVI = "hh3d_khoang_tuvi";
const STORAGE_ATTACK = "hh3d_khoang_attack";
const STORAGE_LOG = "hh3d_khoang_log";
const STORAGE_CHECK_MIN = "hh3d_khoang_check_min";
const STORAGE_BONUS_MIN = "hh3d_khoang_bonus_min";
const STORAGE_KEY = "hh3d_khoang_mines";
const STORAGE_SELECTED = "hh3d_khoang_selected";
const AK = {
  running: false,
  selectedMineId: null,
  selectedMineName: null,
  selectedType: null,
  timer: null,
  checkMinutes: 5,

  enableTakeover: false,
  enableAttack : false,

  // ===== AUTO BUFF =====
  enableBatQuai: false,
  enableAnThan: false,

  bqTimer: null,
  atTimer: null
};
function isSessionExpired(res) {
  const msg = res?.message || res?.data?.message || "";
  return /phiên|hết hạn|token|invalid/i.test(msg);
}
async function refreshSecurityAll() {
  akLog("🔄 Phiên hết hạn → refresh ALL");
  AK_SEC.lastScan = 0;
  await fetchKhoangMachAll(true);
  await sleep(800);
}
async function callWithRetry(fn, args = [], maxRetry = 3) {
  let lastRes = null;
  for (let i = 1; i <= maxRetry; i++) {
    try {
      const res = await fn(...args);
      lastRes = res;
      // 🔥 Nếu thành công thì trả luôn
      if (res?.success) return res;
      // Nếu không thành công nhưng KHÔNG phải lỗi phiên → trả luôn
      if (!isSessionExpired(res)) return res;
      akLog(`⚠ Security lỗi → refresh (${i}/${maxRetry})`);
      await refreshSecurityAll();
      await sleep(800);
    } catch (e) {
      akLog(`❌ API throw (${i}/${maxRetry}): ${e.message}`);
    }
  }
  akLog("🛑 Retry hết 3 lần → trả kết quả cuối");
  return lastRes || { success: false };
}
// ================== LOG ==================
function akLog(msg) {
  const time = `[${new Date().toLocaleTimeString()}] ${msg}`;
  // 1️⃣ lưu vào localStorage
  const logs = JSON.parse(localStorage.getItem(STORAGE_LOG) || "[]");
  logs.push(time);
  // giới hạn 100 dòng cho đỡ nặng
  if (logs.length > 100) logs.shift();
  localStorage.setItem(STORAGE_LOG, JSON.stringify(logs));
  // 2️⃣ render ra UI nếu có
  const box = document.getElementById("akLog");
  if (!box) return;
  const div = document.createElement("div");
  div.textContent = time;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
// ================== STORAGE ==================
    function getFavoriteMines() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_FAVORITE_MINES)) || [];
  } catch {
    return [];
  }
}
function toggleFavoriteMine(mine) {
  const favs = getFavoriteMines();
  const idx = favs.findIndex(m => m.id === mine.id);

  if (idx >= 0) {
    favs.splice(idx, 1);
    akLog(`⭐ Bỏ yêu thích mỏ: ${mine.name}`);
  } else {
    favs.unshift(mine); // ⭐ cho lên đầu
    akLog(`🌟 Đã yêu thích mỏ: ${mine.name}`);
  }

  localStorage.setItem(STORAGE_FAVORITE_MINES, JSON.stringify(favs));
}
function isFavoriteMine(id) {
  return getFavoriteMines().some(m => m.id === id);
}
function getMineStore() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}
function saveMineStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
function saveSelectedMine() {
  localStorage.setItem(
    STORAGE_SELECTED,
    JSON.stringify({
      id: AK.selectedMineId,
      name: AK.selectedMineName,
      type: AK.selectedType}));}
function loadSelectedMine() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_SELECTED));
  } catch {
    return null;
  }
}
const AK_SEC = {
  actions: {},
  nonces: {},
  lastScan: 0
};
const ACTION_PATTERNS = {
  enter_mine:         /(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmEnter\s*:\s*)?['"]enter_mine['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  get_users_in_mine:  /(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmUsers\s*:\s*)?['"]get_users_in_mine['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  change_mine_owner:  /(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmOwner\s*:\s*)?['"]change_mine_owner['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  claim_mycred_reward:/['"]claim_mycred_reward['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  claim_reward_km:    /['"]claim_reward_km['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  attack_user_in_mine:/['"]attack_user_in_mine['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  leave_mine:         /(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmLeave\s*:\s*)?['"]leave_mine['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  buy_item_khoang:    /(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmBuy\s*:\s*)?['"]buy_item_khoang['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  load_mines_by_type: /(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmList\s*:\s*)?['"]load_mines_by_type['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  check_and_display_reward:/(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmCheck\s*:\s*)?['"]check_and_display_reward['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  refresh_attack_count:/(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmRefresh\s*:\s*)?['"]refresh_attack_count['"][\s\S]{0,400}?nonce:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
};
    let khoangFetchPromise = null;
async function fetchKhoangMachAll(force = false) {
  const now = Date.now();
  // ⏱ cache 30 phút
  if (!force && now - AK_SEC.lastScan < 30 * 60 * 1000) return;
  // ⛔ đang fetch → chờ chung, KHÔNG fetch thêm
  if (khoangFetchPromise) {
    return khoangFetchPromise;
  }
  khoangFetchPromise = (async () => {
    const html = await fetch("/khoang-mach", {
      credentials: "include",
      cache: "no-store"
    }).then(r => r.text());
    /* == SECURITY / NONCE ==*/
    AK_SEC.actions = {};
    AK_SEC.nonces = {};
    for (const [action, regex] of Object.entries(ACTION_PATTERNS)) {
      const m = html.match(regex);
      if (!m?.[1]) continue;
      if (action === "refresh_attack_count") {
        AK_SEC.nonces[action] = m[1];
      } else {
        AK_SEC.actions[action] = m[1];
      }
    }
    /* = SECURITY TOKEN = */
    const token =
      html.match(/"securityToken"\s*:\s*"([^"]+)"/i)?.[1] ||
      html.match(/security_token["']?\s*[:=]\s*["']([^"']+)/i)?.[1];
if (!token) {akLog("❌ Không bắt được securityToken → giữ token cũ");return;}
    AK_SEC.token = token;
// == MY USER ID ==
const myIdMatch = html.match(/\/profile\/(\d+)/);
if (myIdMatch?.[1]) {
  const myId = Number(myIdMatch[1]);
  localStorage.setItem(STORAGE_MY_ID, myId);
  AK.myUserId = myId;

} else {
  akLog("⚠️ Không bắt được My User ID từ HTML");
}
    /* == TU VI ==*/
    const m = html.match(/Tu\s*Vi:\s*(\d+)\s*\/\s*(\d+)/i);
    if (m) {
      const cur = +m[1];
      const max = +m[2];
      localStorage.setItem(
        STORAGE_TUVI,
        JSON.stringify({ cur, max, time: Date.now() })
      );
      updateTuViUI(cur, max);
      akLog(` Tu Vi: ${cur}/${max}`);
    }
    AK_SEC.lastScan = Date.now();
  })();
  try {
    await khoangFetchPromise;
  } finally {
    khoangFetchPromise = null; // ✅ mở khoá
  }
}
function addTuViFromClaimMessage(msg) {
  if (!msg) return;
  const m =
    msg.match(/nhận được\s*(\d+)\s*Tu\s*Vi/i) ||
    msg.match(/\+(\d+)\s*Tu\s*Vi/i);
  if (!m) return;
  const gain = Number(m[1]);
  if (!gain) return;
  const info = getTuViInfo();
  if (!info || info.cur == null || info.max == null) {
    akLog("⚠ Chưa có dữ liệu Tu Vi → chưa thể cộng, cần scan trước");
    return;
  }
  const newCur = Math.min(info.cur + gain, info.max);
  localStorage.setItem(
    STORAGE_TUVI,
    JSON.stringify({ cur: newCur, max: info.max, time: Date.now() })
  );
  updateTuViUI(newCur, info.max);
  akLog(`🔥 Tu Vi +${gain} → ${newCur}/${info.max}`);
}
function updateTuViUI(cur, max) {
  const box = document.getElementById("akTuViInfo");
  if (!box) return;
  if (typeof cur === "number" && typeof max === "number") {
    box.textContent = `🔥 Tu Vi: ${cur} / ${max}`;
    box.classList.toggle("full", cur >= max);
  } else {
    box.textContent = "❓ Không đọc được Tu Vi";
    box.classList.remove("full");
  }
}
async function scanKhoangActions(force = false) {
  await fetchKhoangMachAll(force);
}
function fetchSecurityToken() {
  return AK_SEC.token;
}
async function getSecurityBundle(action) {
  await fetchKhoangMachAll();
  const security = AK_SEC.actions[action];
  if (!security) throw new Error(`❌ Chưa có security cho ${action}`);
  return {
    security,
    token: AK_SEC.token
  };
}
async function getSecurity(action) {
  await fetchKhoangMachAll();
  const sec = AK_SEC.actions[action];
  if (!sec) throw new Error(`❌ Chưa có security cho ${action}`);
  return sec;
}
    async function refreshAttackCount() {
  await scanKhoangActions();
  const nonce = AK_SEC.nonces.refresh_attack_count;
  if (!nonce) {
    akLog("❌ Không có nonce refresh_attack_count");
    return { success: false };
  }
  const fd = new FormData();
  fd.append("action", "refresh_attack_count");
  fd.append("nonce", nonce);
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  const msg =
    res?.message ||
    res?.data?.message ||
    "Refresh lượt đánh thất bại";
  if (res?.success) {
    akLog(`🔁 ${msg}`);
  } else {
    akLog(`❌ ${msg}`);
  }
  return res;
}
async function loadMinesByType(type) {
  const security = await getSecurity("load_mines_by_type");
  const fd = new FormData();
  fd.append("action", "load_mines_by_type");
  fd.append("mine_type", type);
  fd.append("security", security);
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  return res?.data || res?.mines || [];
}
async function getUsersInMine(mineId) {
const { security, token } = await getSecurityBundle("get_users_in_mine");

  const fd = new FormData();
  fd.append("action", "get_users_in_mine");
  fd.append("mine_id", mineId);
  fd.append("security", security);
  fd.append("security_token", token);
  return fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
}
async function enterMine(mineId, retried = false) {
const { security, token } = await getSecurityBundle("enter_mine");
await sleep(500);await sleep(500);const fd = new FormData();
  fd.append("action", "enter_mine");
  fd.append("mine_id", mineId);
  fd.append("security", security);
  fd.append("security_token", token);
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  // ✅ MESSAGE CHUẨN
  const msg =
    res?.data?.message ||
    res?.message ||
    (res?.success ? "Vào mỏ thành công" : "Vào mỏ thất bại");
  // 🧠 BỊ CHẶN DO CHƯA NHẬN THƯỞNG
  if (
    res?.success === false &&
    !retried &&
    msg.includes("phần thưởng chưa nhận")
  ) {
    akLog(`🎁 ${msg} → nhận thưởng trước`);
    const claim = await claimRewardKM();
    if (claim?.success) {
      await sleep(800);
      return enterMine(mineId, true); // 🔁 chỉ retry 1 lần
    } else {
      akLog("❌ Nhận thưởng thất bại → không vào lại mỏ");
    }
    return res; }
  // ✅ LOG CUỐI
  if (res?.success) {
    akLog(`🎉 ${msg}`);
  } else {
    akLog(`❌ ${msg}`);
  }return res;}
async function claimRewardKM() {
  const { security, token } = await getSecurityBundle("claim_reward_km");
  await sleep(400);
  const fd = new FormData();
  fd.append("action", "claim_reward_km");
  fd.append("security", security);
  fd.append("security_token", token);
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  if (res?.success) {
    const d = res.data || {};
    // 🧾 build message chuẩn
    const msg =
      res.message ||
      d.message ||
      `🎁 Nhận thưởng mỏ ${d.mine_name || ""}: +${d.total_tuvi || 0} Tu Vi` +
        (d.total_tinh_thach
          ? `, +${d.total_tinh_thach} Tinh Thạch`
          : "") +
        (d.time_spent ? ` (${d.time_spent} phút)` : "");
    akLog(msg);
    // ➕ cộng Tu Vi nếu có
    addTuViFromClaimMessage(msg);} else {akLog(`⚠ Nhận thưởng mỏ thất bại`);} return res;}
async function claimReward(mineId) {
const { security, token } = await getSecurityBundle("claim_mycred_reward");
await sleep(600);
  await sleep(600);
  const fd = new FormData();
  fd.append("action", "claim_mycred_reward");
  fd.append("mine_id", mineId);
  fd.append("security", security);
  fd.append("security_token", token);
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  const msg =
    res?.message ||
    res?.data?.message ||
    "Nhận thưởng thất bại";
  // ✅ LOG MESSAGE
  if (res?.success) {
    akLog(`🎉 ${msg}`);
    // ✅ cộng Tu Vi từ message
    addTuViFromClaimMessage(msg);
  } else {
    akLog(`❌ ${msg}`);
  }
  return res;
}
function getTuViInfo() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_TUVI));
  } catch {
    return null; }}
async function buyLingQuangPhu() {
  const security = await getSecurity("buy_item_khoang");
  await sleep(500);
  const fd = new FormData();
  fd.append("action", "buy_item_khoang");
  fd.append("item_id", "4"); // 🧿 Linh Quang Phù
  fd.append("security", security);
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  const msg =
    res?.message ||
    res?.data?.message ||
    "Mua phù thất bại";
  if (res?.success) {
    akLog(`🧿 ${msg}`);
  } else {
    akLog(`❌ ${msg}`);
  }
  return res;
}
async function buyBatQuai(){

if(!AK.enableBatQuai) return;

const security = await getSecurity("buy_item_khoang");

await sleep(500);

const fd = new FormData();

fd.append("action","buy_item_khoang");
fd.append("item_id","1");
fd.append("security",security);

const res = await fetch(API_URL,{
method:"POST",
credentials:"include",
body:fd
}).then(r=>r.json());

const msg =
res?.message ||
res?.data?.message ||
"Không rõ";

if(res?.success){

akLog(`🔮 ${msg}`);

AK.bqTimer = setTimeout(buyBatQuai,5000);

}else{

akLog(`❌ ${msg}`);

const wait = parseWaitTime(msg);

AK.bqTimer = setTimeout(buyBatQuai,wait*1000+2000);

}

return res;

}
async function buyAnThan(){

if(!AK.enableAnThan) return;

const security = await getSecurity("buy_item_khoang");

await sleep(500);

const fd = new FormData();

fd.append("action","buy_item_khoang");
fd.append("item_id","2");
fd.append("security",security);

const res = await fetch(API_URL,{
method:"POST",
credentials:"include",
body:fd
}).then(r=>r.json());

const msg =
res?.message ||
res?.data?.message ||
"Không rõ";

if(res?.success){

akLog(`🥷 ${msg}`);

AK.atTimer = setTimeout(buyAnThan,5000);

}else{

akLog(`❌ ${msg}`);

const wait = parseWaitTime(msg);

AK.atTimer = setTimeout(buyAnThan,wait*1000+2000);

}

return res;

}
    function parseWaitTime(msg){

const m = msg.match(/(\d+)\s*phút\s*(\d+)\s*giây/i);

if(!m) return 60;

const min = parseInt(m[1]);
const sec = parseInt(m[2]);

return (min*60+sec);

}
      async function takeoverMine(mineId) {
  const security = await getSecurity("change_mine_owner");
  await sleep(600);
  const fd = new FormData();
  fd.append("action", "change_mine_owner");
  fd.append("mine_id", mineId);
  fd.append("security", security);
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  const msg =
    res?.message ||
    res?.data?.message ||
    "Đoạt mỏ thất bại";
  if (res?.success) {
    akLog(`🗡 ${msg}`);
  } else {
    akLog(`❌ ${msg}`);
  }
  return res;
}
async function attackUserInMine(targetUserId, mineId) {
const { security, token } = await getSecurityBundle("attack_user_in_mine");
await sleep(300);
  await sleep(500); // ✅ delay sau khi fetch token (quan trọng)
  const fd = new FormData();
  fd.append("action", "attack_user_in_mine");
  fd.append("attack_token", targetUserId); // 🔥 đổi ở đây
  fd.append("mine_id", mineId);
  fd.append("security", security);
  fd.append("security_token", token);
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  const msg =
    res?.data?.message ||
    res?.message ||
    "Đánh thất bại";
  akLog(`⚔ ${msg}`);
  return res;
}
    function isMeInMine(info) {
  const myId =
    AK.myUserId ||
    Number(localStorage.getItem(STORAGE_MY_ID));

  if (!myId || !Array.isArray(info?.users)) return false;

  return info.users.some(u => Number(u.id) === myId);
}
// ================== UI ==================
function showKhoangPopup() {
  const exist = document.getElementById("autoKhoangPopup");
  if (exist) {
    exist.style.display = "block";
    return;
  }
  const popup = document.createElement("div");
  popup.id = "autoKhoangPopup";
  popup.innerHTML = `
    <div class="ak-overlay">
      <div class="ak-panel">
        <div class="ak-header">
          <span>⛏ AUTO KHOÁNG</span>
          <button id="akClose" title="Đóng">✕</button>
        </div>
<div class="ak-tabs">
  <button data-type="gold">Thượng</button>
  <button data-type="silver">Trung</button>
  <button data-type="copper">Hạ</button>
  <button id="akAttack" class="ak-toggle">⚔ Đánh dọn mỏ </button>
 <button id="akTakeover" class="ak-toggle"> Tự mua phù Đoạt mỏ</button>
 <button id="akTake110" class="ak-toggle">💰 110%</button>
</div>
<div class="ak-bad-header">
  <span>🚫 Danh sách né đánh</span>
  <div style="display:flex; gap:4px; align-items:center;">
    <input id="akBadInput" placeholder="Nhập ID..." style="width:80px;font-size:12px">
    <button id="akBadAdd" title="Thêm">➕</button>
    <button id="akBuyBatQuai" title="Mua Bát Quái">Mua BQ</button>
      <button id="akBuyAnThan" title="Mua Ẩn Thân">Mua AT</button>
      <button id="akBuyLinhQuang" title="Mua Linh Quang Phù">Mua LQP</button>
  </div>

  <div id="akBadList" class="ak-bad-list">Chưa có</div>
</div>
<div class="ak-section ak-tuvi">
  <label>Tu Vi hôm nay</label>
  <div id="akTuViInfo" class="ak-tuvi-box">
    ⏳ cần start để lấy Tu Vi...
  </div>
</div>
<div class="ak-section">
  <label>Thời gian kiểm tra (phút)</label>
  <div style="display:flex; gap:6px; align-items:center;">
    <input id="akCheckMin"
           type="number"
           min="1"
           placeholder="Nhập phút..."
           style="flex:1">
    <select id="akCheckMinSelect" style="width:110px">
      <option value="">Phút</option>
      <option value="2">2</option>
      <option value="4">4</option>
      <option value="6">6</option>
      <option value="8">8</option>
      <option value="10">10</option>
      <option value="12">12</option>
      <option value="14">14</option>
      <option value="16">16</option>
      <option value="18">18</option>
      <option value="20">20</option>
      <option value="22">22</option>
      <option value="24">24</option>
      <option value="26">26</option>
      <option value="28">28</option>
      <option value="30">30</option>
    </select>
  </div>
</div>
<div class="ak-section"> <label>Nhận thưởng khi ≥ (%)</label><select id="akBonusMin"><option value="111">Không nhận</option><option value="110">110%</option><option value="100">100%</option><option value="95">95%</option><option value="90">90%</option><option value="85">85%</option><option value="80">80%</option><option value="75">75%</option></select></div>
<div class="ak-section"> <label>Danh sách mỏ</label><div id="akMineList" class="ak-list">Chưa load</div></div>
<div class="ak-grid"><button id="akStart">▶ START</button><button id="akStop">⏹ STOP</button></div> <div class="ak-log" id="akLog"></div> </div></div>
`;
    document.body.appendChild(popup);
    renderBadEnemyList();
    const tuvi = getTuViInfo?.();
if (tuvi) updateTuViUI(tuvi.cur, tuvi.max);
    // ===== LOAD LOG CŨ =====
const logBox = popup.querySelector("#akLog");
const oldLogs = JSON.parse(localStorage.getItem(STORAGE_LOG) || "[]");
oldLogs.forEach(line => {
  const div = document.createElement("div");
  div.textContent = line;
  logBox.appendChild(div);
});
logBox.scrollTop = logBox.scrollHeight;
const savedMin = +localStorage.getItem(STORAGE_CHECK_MIN);
const minInput = document.getElementById("akCheckMin");

if (savedMin > 0) {
  minInput.value = savedMin;
  AK.checkMinutes = savedMin;
}
const minSelect = document.getElementById("akCheckMinSelect");
// nếu chọn option nhanh → đổ vào input
minSelect.onchange = () => {
  if (minSelect.value) {
    minInput.value = minSelect.value;
  }
};
// ===== TOGGLE ĐOẠT MỎ =====
const takeoverBtn = popup.querySelector("#akTakeover");
// load trạng thái
AK.enableTakeover = localStorage.getItem(STORAGE_TAKEOVER) === "1";
if (AK.enableTakeover) takeoverBtn.classList.add("active");
takeoverBtn.onclick = () => {
  AK.enableTakeover = !AK.enableTakeover;
  takeoverBtn.classList.toggle("active", AK.enableTakeover);
  localStorage.setItem(STORAGE_TAKEOVER, AK.enableTakeover ? "1" : "0");
  akLog(
    AK.enableTakeover? "🧿 Bật mua phù + đoạt mỏ khi ko đủ % thưởng": "⛔ Tắt mua phù + đoạt mỏ"
  );};
const attackBtn = popup.querySelector("#akAttack");
    const take110Btn = popup.querySelector("#akTake110");

AK.enableTake110 = localStorage.getItem("AK_TAKE_110") === "1";

if (AK.enableTake110) take110Btn.classList.add("active");

take110Btn.onclick = () => {

  AK.enableTake110 = !AK.enableTake110;

  take110Btn.classList.toggle("active", AK.enableTake110);

  localStorage.setItem("AK_TAKE_110", AK.enableTake110 ? "1" : "0");

  akLog(
    AK.enableTake110
      ? "💰 Bật auto đoạt mỏ ăn 110%"
      : "⛔ Tắt auto đoạt mỏ 110%"
  );

};
AK.enableAttack = localStorage.getItem(STORAGE_ATTACK) === "1";
if (AK.enableAttack) attackBtn.classList.add("active");
attackBtn.onclick = () => {
  AK.enableAttack = !AK.enableAttack;
  attackBtn.classList.toggle("active", AK.enableAttack);
  localStorage.setItem(STORAGE_ATTACK, AK.enableAttack ? "1" : "0");
  akLog(
    AK.enableAttack
      ? "⚔ Bật auto đánh địch trong mỏ": "⛔ Tắt auto đánh"
  );
};

// ================== STYLE ==================
GM_addStyle(`
#autoKhoangPopup{position:fixed;inset:0;z-index:99999;font-family:system-ui}
#autoKhoangPopup *{box-sizing:border-box}
#autoKhoangPopup select{width:100%;background:#1a2233;color:#eee;border:1px solid #2b3445;padding:6px;border-radius:6px;}.ak-tabs .ak-toggle{margin-left:auto;
background:#2a1b30;border:1px solid #4b2b55;color:#caa7ff;}.ak-tabs .ak-toggle:hover{
background:#3b2450;}.ak-tabs .ak-toggle.active{background:#7c3aed;border-color:#7c3aed;color:#fff;box-shadow:0 0 8px rgba(124,58,237,.6);}
.ak-overlay{background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;height:100%}
.ak-panel{width:440px;background:#0f131a;color:#e6e6e6;padding:14px;border-radius:10px;box-shadow:0 0 30px rgba(0,0,0,.6)}
.ak-header{display:flex;justify-content:space-between;align-items:center;font-weight:bold;margin-bottom:10px;border-bottom:1px solid #1e2633;padding-bottom:6px}
.ak-header button{background:transparent!important;border:none!important;color:#9aa4b2!important;font-size:18px;cursor:pointer;padding:2px 6px;border-radius:4px}
.ak-header button:hover{color:#fff!important;background:rgba(255,255,255,.08)!important}
.ak-tabs{display:flex;gap:6px;margin-bottom:10px}
.ak-tabs button,.ak-grid button{background:#1b2230;border:1px solid #2b3445;color:#ccc;padding:6px;border-radius:6px;cursor:pointer;transition:.15s}
.ak-tabs button:hover,.ak-grid button:hover{background:#263149}
.ak-tabs button.active,#akStart.active{background:#3a8bfd;color:#fff;border-color:#3a8bfd}
#akStop.active{background:#aa4444;color:#fff;border-color:#aa4444}.ak-section{margin:8px 0}
.ak-section label{display:block;font-size:12px;color:#9aa4b2;margin-bottom:4px}
#autoKhoangPopup input{width:100%;background:#1a2233!important;color:#eee!important;border:1px solid #2b3445!important;padding:6px;border-radius:6px;outline:none}
#autoKhoangPopup input[type=number]{appearance:textfield}
#autoKhoangPopup input[type=number]::-webkit-inner-spin-button,
#autoKhoangPopup input[type=number]::-webkit-outer-spin-button{filter:invert(1)}
.ak-list{background:#0b0f16;max-height:160px;overflow:auto;border-radius:6px;border:1px solid #1e2633}
.ak-list div{padding:6px 8px;cursor:pointer;border-bottom:1px solid #1e2633}
.ak-list div:hover{background:#1c2638}
.ak-list div.active{background:#2d3f5f;color:#fff}
.ak-tuvi-box{background:#0b1322;border:1px solid #1e2a44;padding:6px 8px;border-radius:6px;font-size:12px;color:#9bdcff;}
.ak-tuvi-box.full{color:#7CFF7C;border-color:#2ecc71;}
.ak-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.ak-log{margin-top:8px; height:190px;max-height:260px;overflow-y:auto;font-size:13px;            line-height:1.45;background:#06090f;border-radius:6px;padding:8px; color:#c7d0dc;             border:1px solid #1e2633;}
.ak-log div{  white-space:pre-wrap;      word-break:break-word;margin-bottom:2px;}
.ak-mine-item{display:flex;justify-content:space-between; align-items:center;}
.ak-mine-star{font-size:18px; width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:#111827; border:1px solid #1f2937;cursor:pointer;}
.ak-mine-star.fav{background:#facc15;color:#111;border-color:#facc15;}
.ak-bad-list{display:flex;flex-wrap:wrap; gap:6px;max-height:90px;overflow:auto;font-size:12px;}
.ak-bad-empty{color:#6b7280;font-size:12px;padding:4px;}
.ak-bad-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border-radius:999px;background:#1f2937; border:1px solid #374151;color:#e5e7eb;white-space:nowrap;}
.ak-bad-chip span{font-size:12px;}
.ak-bad-chip button{background:transparent;border:none;color:#f87171;cursor:pointer;font-size:12px;padding:0;line-height:1;}
.ak-bad-chip button:hover{ color:#ffaaaa;}
#akBuyBatQuai,
#akBuyAnThan,
#akBuyLinhQuang{
background:#1b2230;
border:1px solid #2b3445;
color:#caa7ff;
border-radius:4px;
cursor:pointer;
padding:2px 6px;
}

#akBuyBatQuai.active,
#akBuyAnThan.active,
#akBuyLinhQuang.active{
background:#7c3aed;
color:#fff;
border-color:#7c3aed;
box-shadow:0 0 8px rgba(124,58,237,.6);
}

#akBuyBatQuai:hover,
#akBuyAnThan:hover,
#akBuyLinhQuang:hover{
background:#263149;
}`);
// ================== EVENTS ==================
const badAddBtn = popup.querySelector("#akBadAdd");
const badInput = popup.querySelector("#akBadInput");
const buyBQBtn = popup.querySelector("#akBuyBatQuai");
const buyAnThanBtn = popup.querySelector("#akBuyAnThan");
const buyLQPBtn = popup.querySelector("#akBuyLinhQuang");
buyBQBtn.onclick = ()=>{

AK.enableBatQuai = !AK.enableBatQuai;

buyBQBtn.classList.toggle("active",AK.enableBatQuai);

if(AK.enableBatQuai){

akLog("🔮 Bật auto Bát Quái");

buyBatQuai();

}else{

akLog("⛔ Tắt auto Bát Quái");

clearTimeout(AK.bqTimer);

}

};

buyAnThanBtn.onclick = ()=>{

AK.enableAnThan = !AK.enableAnThan;

buyAnThanBtn.classList.toggle("active",AK.enableAnThan);

if(AK.enableAnThan){

akLog("🥷 Bật auto Ẩn Thân");

buyAnThan();

}else{

akLog("⛔ Tắt auto Ẩn Thân");

clearTimeout(AK.atTimer);

}

};
    buyLQPBtn.onclick = ()=>{

AK.enableLinhQuang = !AK.enableLinhQuang;

buyLQPBtn.classList.toggle("active",AK.enableLinhQuang);

if(AK.enableLinhQuang){

akLog("🧿 Bật auto Linh Quang Phù");

buyLingQuangPhu();

}else{

akLog("⛔ Tắt auto Linh Quang Phù");

clearTimeout(AK.lqpTimer);

}

};
badAddBtn.onclick = () => {
  const val = badInput.value.trim();
  if (!val) return;
  addBadEnemy(val);
  badInput.value = "";
  renderBadEnemyList();
};
popup.querySelector("#akClose").onclick = () => {
  popup.style.display = "none";
};
// ===== BONUS =====
const savedBonus = +localStorage.getItem(STORAGE_BONUS_MIN) || 100;
const bonusSelect = popup.querySelector("#akBonusMin");
bonusSelect.value = savedBonus;
bonusSelect.onchange = e => {
  localStorage.setItem(STORAGE_BONUS_MIN, e.target.value);
};

// ===== MINE LIST =====
const mineList = popup.querySelector("#akMineList");
// ===== TAB CLICK =====
popup.querySelectorAll(".ak-tabs button[data-type]").forEach(btn => {
  btn.onclick = async () => {
    popup
      .querySelectorAll(".ak-tabs button[data-type]")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    AK.selectedType = btn.dataset.type;
    mineList.textContent = "⏳ Đang tải...";
    akLog(`Chọn loại mỏ: ${AK.selectedType}`);
    const mines = await loadMinesByType(AK.selectedType);
    const favorites = getFavoriteMines();
    // ⭐ sort favorite lên đầu
    const sorted = [
      ...mines.filter(m => favorites.some(f => f.id === m.id)),
      ...mines.filter(m => !favorites.some(f => f.id === m.id))
    ];
    mineList.innerHTML = sorted.map(m => `
      <div class="ak-mine-item" data-id="${m.id}" data-name="${m.name}">
        <span>⛏ ${m.name}</span>
        <span class="ak-mine-star ${isFavoriteMine(m.id) ? "fav" : ""}">★</span>
      </div>
    `).join("");
    // ===== EVENTS TỪNG DÒNG MỎ =====
    mineList.querySelectorAll(".ak-mine-item").forEach(div => {
      const id = div.dataset.id;
      const name = div.dataset.name;
      const star = div.querySelector(".ak-mine-star");
      // ⭐ click sao → yêu thích
      star.onclick = e => {
        e.stopPropagation(); // ❗ cực quan trọng
        toggleFavoriteMine({ id, name, type: AK.selectedType });
        star.classList.toggle("fav", isFavoriteMine(id));
        // đưa favorite lên đầu UI ngay
        if (isFavoriteMine(id)) {
          mineList.prepend(div);
        }
      };
      // ⛏ click dòng → chọn mỏ
      div.onclick = () => {
        AK.selectedMineId = id;
        AK.selectedMineName = name;
        saveSelectedMine();
        mineList.innerHTML =
          `<div class="active">⛏ ${name}</div>`;
        akLog(`Đã chọn mỏ: ${name}`);
      };
    });
  };
});
// ===== START / STOP =====
popup.querySelector("#akStart").onclick = startAuto;
popup.querySelector("#akStop").onclick = stopAuto;
// ===== LOAD MỎ ĐÃ LƯU =====
const saved = loadSelectedMine();
if (saved?.id) {
  AK.selectedMineId = saved.id;
  AK.selectedMineName = saved.name;
  AK.selectedType = saved.type;
  mineList.innerHTML = `<div class="active">⛏ ${saved.name}</div>`;
  akLog("Đã load mỏ đã lưu");
}
}

function renderBadEnemyList() {
  const box = document.getElementById("akBadList");
  if (!box) return;

  const list = getBadEnemies();
  if (!list.length) {
    box.innerHTML = `<div class="ak-bad-empty">Chưa có</div>`;
    return;
  }
  box.innerHTML = "";
  list.forEach(id => {
    const div = document.createElement("div");
    div.className = "ak-bad-chip";
    div.innerHTML = `
      <span>#${id}</span>
      <button title="Xoá">✕</button>
    `;
    div.querySelector("button").onclick = () => {
      removeBadEnemy(id);
      renderBadEnemyList();
    };
    box.appendChild(div);
  });
}
// == AUTO LOOP ===
// == BAD ENEMY STORAGE ==
const BAD_ENEMY_KEY = "AK_BAD_ENEMIES";
function getBadEnemies() {
  try {
    return JSON.parse(localStorage.getItem(BAD_ENEMY_KEY)) || [];
  } catch {
    return [];
  }
}
function saveBadEnemies(list) {
  localStorage.setItem(BAD_ENEMY_KEY, JSON.stringify(list));
}
function addBadEnemy(id) {
  id = String(id);
  const list = getBadEnemies();
  if (!list.includes(id)) {
    list.push(id);
    saveBadEnemies(list);
    akLog(`🚫 Đã thêm vào danh sách né: ${id}`);
  }
}

function removeBadEnemy(id) {
  id = String(id);
  const list = getBadEnemies().filter(x => String(x) !== id);
  saveBadEnemies(list);
  akLog(`🗑 Đã xoá khỏi danh sách né: ${id}`);
}
async function startAuto() {
  if (AK.running) return;

  AK.running = true;
  document.getElementById("akStart")?.classList.add("active");
  document.getElementById("akStop")?.classList.remove("active");

  const minInput = document.getElementById("akCheckMin");
  const minutes = +minInput.value;
  AK.checkMinutes = minutes > 0 ? minutes : 5;

  localStorage.setItem(STORAGE_CHECK_MIN, AK.checkMinutes);

  akLog("▶ START auto");

  function gotoNextLoop(delayMin = AK.checkMinutes) {
    if (!AK.running) return;
    clearTimeout(AK.timer);
    AK.timer = setTimeout(loop, delayMin * 60000);
  }

  const loop = async () => {
    if (!AK.running) return;

    try {

      akLog("🔍 Check mỏ...");
      await sleep(500);

      const res = await callWithRetry(
        getUsersInMine,
        [AK.selectedMineId]
      );

      if (!res?.success) {
        akLog("⚠ Không lấy được dữ liệu mỏ");
        return gotoNextLoop();
      }

      let info = res.data || {};
      let bonus = info.bonus_percentage ?? 0;
      const bonusMin =
        +localStorage.getItem(STORAGE_BONUS_MIN) || 100;

      akLog(`💰 Bonus hiện tại: ${bonus}%`);

      // ===== AUTO ĐÁNH =====

      if (AK.enableAttack && Array.isArray(info.users)) {

        const badIds = getBadEnemies();

        const enemies = info.users.filter(
          u =>
            u.id &&
            !badIds.includes(String(u.id)) &&
            !u.lien_minh &&
            !u.dong_mon
        );

        if (enemies.length > 0 && enemies.length <= 15) {

          akLog(`⚔ ${enemies.length} địch → bắt đầu đánh`);

          for (const enemy of enemies) {

            if (!AK.running) break;

            let atk = await callWithRetry(
              attackUserInMine,
              [enemy.id, AK.selectedMineId]
            );

            const msg =
              atk?.message || atk?.data?.message || "";

            if (
              msg.includes("thao tác quá nhanh") ||
              msg.includes("phong ấn")
            ) {
              akLog("🚫 Bị giới hạn thao tác → dừng auto");
              stopAuto();
              return;
            }

            if (atk?.data?.result === "lose") {
              akLog(`❌ Thua → né ID ${enemy.id}`);
              addBadEnemy(enemy.id);
              renderBadEnemyList();
              continue;
            }

            await sleep(ATTACK_COOLDOWN);

          }

        }

      }

      // ===== REFRESH MỎ =====

      const re = await callWithRetry(
        getUsersInMine,
        [AK.selectedMineId]
      );

      if (re?.success) {
        info = re.data || {};
        bonus = info.bonus_percentage ?? 0;
      }

      const inMine = info.is_in_mine === true;

      // ===== CHƯA NGỒI MỎ =====

      if (!inMine) {

        akLog("🟢 Chưa ngồi mỏ → vào mỏ");

        const enter = await callWithRetry(
          enterMine,
          [AK.selectedMineId]
        );

        if (!enter?.success) {

          const msg =
            enter?.message ||
            enter?.data?.message ||
            "";

          if (msg.includes("đạt đủ thưởng")) {
            akLog("🛑 Hết lượt ngày → dừng");
            stopAuto();
            return;
          }

        }

        return gotoNextLoop();

      }

// ===== TAKEOVER 30-80 =====

if (
  AK.enableTakeover &&
  bonus >= 30 &&
  bonus <= 80
) {

  akLog("🗡 Bonus 30-80 → đoạt mỏ");

  await callWithRetry(
    takeoverMine,
    [AK.selectedMineId]
  );

  await sleep(1200);

  // refresh mỏ
  const re = await callWithRetry(
    getUsersInMine,
    [AK.selectedMineId]
  );

  if (re?.success)
    bonus = re.data?.bonus_percentage ?? 0;

  akLog(`📊 Bonus sau đoạt: ${bonus}%`);

  // nếu vẫn chưa đủ thưởng → mua phù
  if (bonus < bonusMin && bonus !== 20) {

    akLog("🧿 Mua Linh Quang Phù");

    await callWithRetry(buyLingQuangPhu);

    await sleep(1200);

    const re2 = await callWithRetry(
      getUsersInMine,
      [AK.selectedMineId]
    );

    if (re2?.success)
      bonus = re2.data?.bonus_percentage ?? 0;

    akLog(`✨ Bonus sau phù: ${bonus}%`);

  }

}
      // ===== FARM 110 =====

if (AK.enableTake110 && bonus < 110 && bonus !== 20) {

  akLog("🗡 Thử đoạt mỏ");

  await callWithRetry(
    takeoverMine,
    [AK.selectedMineId]
  );

  await sleep(1200);

  const re2 = await callWithRetry(
    getUsersInMine,
    [AK.selectedMineId]
  );

  if (re2?.success)
    bonus = re2.data?.bonus_percentage ?? 0;

  akLog(`📊 Bonus sau đoạt: ${bonus}%`);


  // chỉ dùng phù nếu vẫn <110
  if (bonus < 110 && bonus !== 20) {

    akLog("🧿 Dùng Linh Quang Phù");

    await callWithRetry(buyLingQuangPhu);

    await sleep(1200);

    const re3 = await callWithRetry(
      getUsersInMine,
      [AK.selectedMineId]
    );

    if (re3?.success)
      bonus = re3.data?.bonus_percentage ?? 0;

    akLog(`✨ Bonus sau phù: ${bonus}%`);

  }

}

      // ===== CLAIM =====

      if (bonus >= bonusMin) {

        akLog("🎁 Nhận thưởng");

        const claim = await callWithRetry(
          claimReward,
          [AK.selectedMineId]
        );

        if (!claim?.success) {

          const msg = claim?.message || "";

          if (msg.includes("đạt đủ thưởng")) {
            akLog("🛑 Hết lượt ngày → dừng");
            stopAuto();
            return;
          }

        }

      } else {

        akLog(`⏳ Chưa đủ bonus (${bonus}%/${bonusMin}%)`);

      }

    } catch (e) {

      akLog("❌ Lỗi auto: " + e.message);

    }

    gotoNextLoop();

  };

  loop();
}
function stopAuto() {
  AK.running = false;
  clearTimeout(AK.timer);
  document.getElementById("akStart")?.classList.remove("active");
  document.getElementById("akStop")?.classList.add("active");
  akLog("⏹ STOP auto");
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
// == AUTO THÍ LUYỆN  ==
const TL_API = "/wp-content/themes/halimmovies-child/hh3d-ajax.php";
let autoThiLuyenTimer = null;
function stopAutoThiLuyen(reason = "🛑 Auto Thí Luyện đã tắt") {
  try {
    clearTimeout(autoThiLuyenTimer);
    autoThiLuyenTimer = null;
    localStorage.setItem("ThiLuyenToggle", "off");
    document.querySelectorAll("#toggleThiLuyen").forEach(el => {
      el.checked = false;
    });
    showToast(reason, "error");
  } catch (e) {
    console.error("stopAutoThiLuyen error:", e);
  }
}
async function thiLuyenAjax(action, token, extra = {}) {
  const form = new URLSearchParams({
    action,
    security_token: token,
    ...extra
  });
  const res = await fetch(TL_API, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    body: form.toString()
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}
function scheduleNextThiLuyen(timeStr) {
  const [m, s] = timeStr.split(":").map(Number);
  if (isNaN(m) || isNaN(s)) {
    stopAutoThiLuyen("❌ Sai định dạng thời gian Thí Luyện");
    return;
  }
  const ms = (m * 60 + s) * 1000;
  showToast(`⏳ Thí Luyện còn ${m}p${s}s — hẹn lại`, "info");
  autoThiLuyenTimer = setTimeout(() => {
    autoThiLuyenSilent();
  }, ms + 3000); // buffer chống lệch server
}
async function autoThiLuyenSilent() {
  try {
    clearTimeout(autoThiLuyenTimer);
    /* === LẤY SECURITY TOKEN == */
    const securityToken = await getSecurityToken(location.href);
    if (!securityToken) {
      stopAutoThiLuyen("❌ Không lấy được security token");
      return;
    }

    /* == CHECK THỜI GIAN == */
    const timeRes = await thiLuyenAjax(
      "get_remaining_time_tltm",
      securityToken
    );
    if (!timeRes?.success) {
      stopAutoThiLuyen("❌ Không lấy được thời gian Thí Luyện");
      return;
    }
    const timeStr = timeRes.data?.time_remaining;
    if (!timeStr) {
      stopAutoThiLuyen("❌ Dữ liệu time_remaining rỗng");
      return;
    }
    showToast("⏱ Thí Luyện: " + timeStr, "info");
    /* == 3. ĐẾN GIỜ → MỞ RƯƠNG == */
    if (timeStr === "00:00") {
      showToast("🎁 Đến giờ – mở Thí Luyện...", "info");
      const openToken = await getSecurityToken(location.href);
      if (!openToken) {
        stopAutoThiLuyen("❌ Không lấy được token mở rương");
        return;
      }
      const openRes = await thiLuyenAjax(
        "open_chest_tltm",
        openToken
      );

 if (openRes?.success) {
  showToast("🎉 " + openRes.data?.message, "success");
}
else if (
  openRes?.data?.message &&
  openRes.data.message.includes("Đã hoàn thành Thí Luyện")
) {
  stopAutoThiLuyen("✅ Đã hoàn thành Thí Luyện hôm nay — Auto tắt");
  return;
}
else {
  showToast(
    "⚠️ Mở Thí Luyện thất bại: " + (openRes?.data?.message || "Không rõ"),
    "warning"
  );
}

      const nextToken = await getSecurityToken(location.href);
      if (!nextToken) {
        stopAutoThiLuyen("❌ Không lấy được token sau khi mở");
        return;
      }

      const nextRes = await thiLuyenAjax(
        "get_remaining_time_tltm",
        nextToken
      );
      if (nextRes?.success && nextRes.data?.time_remaining) {
        scheduleNextThiLuyen(nextRes.data.time_remaining);
      } else {
        stopAutoThiLuyen("⚠️ Không lấy được thời gian sau khi mở");
      }
      return;
    }
    scheduleNextThiLuyen(timeStr);
  } catch (err) {
    console.error("❌ Auto Thí Luyện lỗi:", err);
    stopAutoThiLuyen("⚠️ Thao tác chậm thôi....");
  }
}
// Bi cảnh
const BC_BASE = buildUrl("/wp-json/tong-mon/v1");
    function saveWpNonce(nonce, src) {
    if (nonce) {
        localStorage.setItem("HH3D_NONCE_WP", nonce);
    }
}
const origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    if (name && name.toLowerCase() === "x-wp-nonce") {
        saveWpNonce(value, "xhr");
    }
    return origSetRequestHeader.apply(this, arguments);
};
const origHeadersSet = Headers.prototype.set;
Headers.prototype.set = function(name, value) {
    if (name && name.toLowerCase() === "x-wp-nonce") {
        saveWpNonce(value, "headers.set");
    }
    return origHeadersSet.apply(this, arguments);
};
    async function checkCooldown() {
        const resp = await fetch(BC_BASE + "/check-attack-cooldown", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                "X-WP-Nonce": localStorage.getItem("HH3D_NONCE_WP") || ""
            },
            credentials: "include"
        });

        const raw = await resp.text();
        try { return JSON.parse(raw); } catch { return { success: false, message: raw }; }
    }
if ((status.attack_info?.remaining === 0) || (status.remaining_attacks === 0)) {
    showToast("⛔ Bí Cảnh: Hết lượt (0/" + (status.attack_info?.max_attacks || status.max_attacks || "?") + ")");
    localStorage.setItem("biCanhToggle", "off");
    document.getElementById("toggleBiCanh").checked = false;
    return;
}
    async function contributeBoss() {
    try {
        let resp = await fetch(BC_BASE + "/contribute-boss", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                "X-WP-Nonce": localStorage.getItem("HH3D_NONCE_WP") || ""
            },
            credentials: "include"
        });
        let raw = await resp.text();
        let data = {};
        try { data = JSON.parse(raw); } catch { data = { success: false, message: raw }; }
        if (data.success) {
            showToast("🙏 Đã hiến tế boss thành công!");
        } else {
            showToast("❌ Hiến tế thất bại: " + (data.message || "Unknown"));
        }
        return data;
    } catch (e) {
        showToast("❌ Lỗi gọi contribute-boss: " + e.message);
        return { success: false, message: e.message };
    }
}
    async function attackBoss() {
        const resp = await fetch(BC_BASE + "/attack-boss", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
              "X-WP-Nonce": localStorage.getItem("HH3D_NONCE_WP") || ""
            },
            credentials: "include"
        });
        const raw = await resp.text();
        try { return JSON.parse(raw); } catch { return { success: false, message: raw }; }
    }
async function checkBossReward() {
    try {
let resp = await fetch(buildUrl("/wp-json/tong-mon/v1/claim-boss-reward"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": localStorage.getItem("HH3D_NONCE_WP") || ""
            },
            credentials: "include",
            body: "{}"
        });
        let data = await resp.json();
        if (data.success) {
            showToast(data.message || "🎉 Nhận thưởng thành công!");
            if (data.reward_details) {
                showToast(`👑 ${data.reward_details.boss_name} Cấp ${data.reward_details.boss_level}`);
                showToast(`⚔️ Damage: ${data.reward_details.total_damage}`);
            }
            return true;
        }
    } catch (e) {
    }
    return false;
}

function showAttackResult(result) {
    if (!result || !result.success) return;
    let hpPercent = 0;
    if (result.boss_hp && result.boss_max_hp) {
        hpPercent = (result.boss_hp / parseInt(result.boss_max_hp)) * 100;
    }
    let parts = [];
    if (result.message) {
        parts.push(result.message);
    }

    if (result.boss_hp && result.boss_max_hp) {
        parts.push(`👹 ${result.boss_hp}/${result.boss_max_hp} (${hpPercent.toFixed(1)}%)`);
    }
    let msg = "🎯 " + parts.join(" | ");
    showToast(msg, 5000);
}

let autoBiCanhTimer = null;
async function autoBiCanh() {
    try {
        if (autoBiCanhTimer) {
            clearTimeout(autoBiCanhTimer);
            autoBiCanhTimer = null;
        }
        let nextRun = parseInt(localStorage.getItem("nextRun_BC") || "0");
        if (!nextRun || Date.now() >= nextRun) {
            let status = await checkCooldown();
            // Hết lượt hôm nay
            if (
                (status.attack_info?.remaining === 0) ||
                (status.remaining_attacks === 0) ||
                (status.cooldown_type === "daily_limit")
            ) {
                showToast("⛔ Bí Cảnh: Hết lượt hôm nay.");
                localStorage.setItem("biCanhToggle", "off");
                let el = document.getElementById("toggleBiCanh");
                if (el) el.checked = false;
                return;
            }
            // 🔥 Nếu không có boss → hiến tế
            if (status.success && !status.can_attack && status.message?.toLowerCase().includes("không có boss")) {
                showToast("👹 Không có boss → tiến hành hiến tế...");
                let ct = await contributeBoss();
                if (ct.success) {
                    showToast("✨ Hiến tế thành công, thử lại sau 60 phút...");
                    let wait = 60 * 60 * 1000 + (5 + Math.floor(Math.random() * 20)) * 1000;
                    nextRun = Date.now() + wait;
                    localStorage.setItem("nextRun_BC", String(nextRun));
                    autoBiCanhTimer = setTimeout(autoBiCanh, wait);
                    return;
                } else {
                    showToast("❌ Hiến tế thất bại, thử lại sau 300s...");
                    nextRun = Date.now() + 300000;
                    localStorage.setItem("nextRun_BC", String(nextRun));
                    autoBiCanhTimer = setTimeout(autoBiCanh, 300000);
                    return;
                }
            }
            // ⚡ Nếu boss mới thì nhận thưởng trước
            if (status.success && status.is_new_boss) {
                showToast("💎 Phát hiện boss mới → kiểm tra thưởng boss cũ...");
                try {
                    let claimed = await checkBossReward();
                    if (claimed) {
                        showToast("✅ Đã nhận thưởng boss cũ thành công!");
                        await randomDelay(1000, 2000);
                    } else {
                        showToast("⚠️ Không có thưởng hoặc đã nhận rồi.");
                    }
                } catch (err) {
                    console.warn("⚠️ Lỗi checkBossReward:", err);
                    showToast("⚠️ Check thưởng boss cũ lỗi, bỏ qua.");
                }
            }
            // Có boss → đánh
            if (status.success && status.can_attack) {
                await randomDelay(800, 1500);
                let result = await attackBoss();
                if (result.success) {
                    showAttackResult(result);

                    if (result.attack_info?.remaining === 0) {
                        showToast("⛔ Bí Cảnh: Đã hết lượt hôm nay.");
                        localStorage.setItem("biCanhToggle", "off");
                        let el = document.getElementById("toggleBiCanh");
                        if (el) el.checked = false;
                        return;
                    }
                    let wait = 7 * 60 * 1000 + (2 + Math.floor(Math.random() * 9)) * 1000;
                    nextRun = Date.now() + wait;
                } else {
                    // Trường hợp đánh fail
                    showToast("❌ Đánh fail: " + (result.message || "Không rõ lỗi"));
                    let cd = await checkCooldown();
                    let wait = (cd.minutes !== undefined && cd.seconds !== undefined)
                        ? (cd.minutes * 60 + cd.seconds) * 1000
                        : (cd.next_attack_time ? cd.next_attack_time - Date.now() : 60000);
                    wait += (2 + Math.floor(Math.random() * 9)) * 1000;
                    nextRun = Date.now() + wait;
                }
            } else {
                // Đang cooldown hoặc không rõ trạng thái
                let wait = (status.minutes !== undefined && status.seconds !== undefined)
                    ? (status.minutes * 60 + status.seconds) * 1000
                    : (status.next_attack_time ? status.next_attack_time - Date.now() : 10000);
                wait += (2 + Math.floor(Math.random() * 9)) * 1000;
                nextRun = Date.now() + wait;
            }
            localStorage.setItem("nextRun_BC", String(nextRun));
        }
        // 🕐 Hiển thị thời gian chờ
        let sec = Math.max(0, Math.round((nextRun - Date.now()) / 1000));
        let m = Math.floor(sec / 60), s = sec % 60;
        showToast(`⚔️ Bí Cảnh: sẽ đánh lại sau ${m}p ${s}s`);
        autoBiCanhTimer = setTimeout(autoBiCanh, (nextRun - Date.now()) + 500);
    } catch (e) {
        showToast("❌ Lỗi autoBiCanh: " + e.message);
        autoBiCanhTimer = setTimeout(autoBiCanh, 15000);
    }
}

const GIFT_API = buildUrl("/wp-json/hh3d/v1/action");
async function getFriendsList() {
    try {
        let resp = await fetch(GIFT_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": localStorage.getItem("HH3D_NONCE_WP") || ""
            },
            credentials: "include",
            body: JSON.stringify({ action: "get_friends_td" })
        });
        let data = await resp.json();
        if (Array.isArray(data)) {
            return data;
        }

        if (data.success && Array.isArray(data.data)) {
            return data.data;
        }
        return [];
    } catch (e) {
        return [];
    }
}

const ACTIVITY_API = "/wp-content/themes/halimmovies-child/hh3d-ajax.php";

async function claimActivityReward(stage) {
  try {

    const data = typeof unsafeWindow !== "undefined"
      ? unsafeWindow.hh3dData
      : window.hh3dData;
    if (!data) {
      showToast("❌ Không thấy hh3dData");
      return;
    }
    // action
    const action = data.act?.hdnReward;

    if (!action) {
      console.log("DEBUG ACT:", data.act);
      showToast("❌ Không có action hdnReward");
      return;
    }

    // ================= LẤY TOKEN TỪ HOME =================
    const token = await getSecurityToken("/");

    if (!token) {
      showToast("❌ Không lấy được security token");
      return;
    }

    // ================= CALL API =================
    const resp = await fetch(ACTIVITY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      credentials: "include",
      body: new URLSearchParams({
        action: action,
        stage: stage,
        security_token: token
      })
    });

    const result = await resp.json();

    console.log("🎁 CLAIM:", result);

    showToast(result?.data?.message || result?.message || "Done");

  } catch (e) {
    showToast("❌ Lỗi: " + e.message);
  }
}
// ================== CLAIM ALL ==================
async function claimAllActivityRewards() {
  await claimActivityReward("stage1");
  await new Promise(r => setTimeout(r, 4000));
  await claimActivityReward("stage2");
}
async function giftFlowerOnce(friendId) {
    let resp = await fetch(GIFT_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": localStorage.getItem("HH3D_NONCE_WP") || ""
        },
        credentials: "include",
        body: JSON.stringify({
            action: "gift_to_friend",
            friend_id: String(friendId),
            gift_type: "hoa_hong",
            cost_type: "tien_ngoc"
        })
    });
    let result = await resp.json();
    return result;
}
async function giftFlower3(friend){for(let i=0;i<3;i++){let res=await giftFlowerOnce(friend.user_id);if(res.success)showToast(`🌹 Tặng bông ${i+1}/3 cho ${friend.display_name}`);else{showToast(`❌ Lỗi khi tặng: ${res.message||"không rõ"}`);break;}await new Promise(r=>setTimeout(r,500));}if(typeof popupDiv!=="undefined")popupDiv.style.display="none";}
    /* = URL =*/
const BHD_URL = buildUrl("/bang-hoat-dong-ngay");
const BC_API_URL = buildUrl("/wp-json/tong-mon/v1/check-attack-cooldown");
/* = BÍ CẢNH – API = */
async function getBiCanhInfo(){
  try{
    const nonce = localStorage.getItem("HH3D_NONCE_WP");
    if(!nonce) return null;
    const resp = await fetch(BC_API_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-WP-Nonce": nonce,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({})
    });
    if(!resp.ok) return null;
    const d = await resp.json();
    if(!d?.success) return null;
    if(d.can_attack === true){
      return {
        state: "ready",
        message: d.message || "Có thể tấn công ngay"
      };
    }
    if(d.cooldown_type === "time_limit"){
      return {
        state: "cooldown",
        remainingAttacks: d.remaining_attacks ?? null,
        minutes: d.minutes ?? 0,
        seconds: d.seconds ?? 0,
        cooldownRemaining: d.cooldown_remaining,
        message: d.message
      };
    }
    if(d.cooldown_type === "daily_limit"){
      return {
        state: "daily_limit",
        message: d.message
      };
    }

    return null;
  }catch(e){
    console.error("Lỗi API Bí Cảnh:", e);
    return null;
  }
}
function showPopup(contentHtml){
  const old = document.getElementById("bhd-popup-overlay");
  if(old) old.remove();
  const overlay = document.createElement("div");
  overlay.id = "bhd-popup-overlay";
  overlay.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.7);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:999999;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    position:relative;
    width:min(95vw, 480px);
    background:#121212;
    border-radius:14px;
    padding:16px;
    box-shadow:0 20px 50px rgba(0,0,0,.6);
    transform-origin:center;
  `;
  const closeBtn = document.createElement("div");
  closeBtn.innerHTML = "✖";
  closeBtn.style.cssText = `
    position:absolute;
    top:12px;
    right:16px;
    cursor:pointer;
    font-size:14px;
    color:#aaa;
  `;
  closeBtn.onclick = () => overlay.remove();
  box.appendChild(closeBtn);
  const content = document.createElement("div");
  content.innerHTML = contentHtml;
  box.appendChild(content);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}
/* TIẾN ĐỘ NGÀY - FULL LAYOUT MỚI */
async function getBHDProgress(){
  try{
 const resp = await fetch(buildUrl("/nhiem-vu-hang-ngay/"),{
  credentials:"include",
  cache:"no-store"
});
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html,"text/html");

    const progress = {};

    /* ===============================
       1️⃣ LẤY TẤT CẢ QUEST (cả 2 block)
    ================================ */
    const allQuests = doc.querySelectorAll(".nv-quest");

    allQuests.forEach(q=>{
      const name = q.querySelector("h4")?.innerText.trim();
      const progTxt = q.querySelector(".nv-prog-txt")?.innerText.trim();
      if(!name || !progTxt) return;

      const match = progTxt.match(/(\d+)\s*\/\s*(\d+)/);
      if(match){
        const cur = parseInt(match[1]);
        const max = parseInt(match[2]);
        const percent = max>0 ? Math.floor((cur/max)*100) : 0;
        progress[name] = percent;
      }
    });

    /* ===============================
       🔥 NEW: TIÊN DUYÊN (TẶNG HOA)
    ================================ */
    let tienDuyenPercent = 0;

    const rows = doc.querySelectorAll(".nv-row");
    rows.forEach(row=>{
      const label = row.querySelector(".nv-row-lbl")?.innerText.trim();
      if(label === "Tiên Duyên - Tặng Hoa"){
        const valText = row.querySelector(".nv-row-val")?.innerText || "0";
        const value = parseInt(valText.replace(/[^\d-]/g,'')) || 0;

        const progressVal = Math.abs(value); // âm -> dương
        tienDuyenPercent = Math.min((progressVal / 300) * 100, 100);
      }
    });
/* ===============================
   🔥 NEW: CHECK RƯƠNG HOẠT ĐỘNG
================================ */
const chests = doc.querySelectorAll(".nv-chest");

const chestStatus = [];

chests.forEach((chest, index) => {
  const src = chest.getAttribute("src") || "";

  let status = "❌ Chưa mở";
  if(src.includes("open")){
    status = "✅ Đã mở";
  }

  chestStatus.push(`Rương ${index+1}: ${status}`);
});
    /* ===============================
       2️⃣ LẤY RING TỔNG %
    ================================ */
    const totalPercent = doc.querySelector(".nv-ring-label")?.innerText.trim() || "0%";

    /* ===============================
       3️⃣ LẤY WALLET HÔM NAY
    ================================ */
    function getWalletToday(label){
      const wallet = [...doc.querySelectorAll(".nv-wallet")]
        .find(w => w.querySelector(".nv-wallet-name")?.innerText.trim() === label);
      return wallet?.querySelector(".nv-wallet-today")?.innerText.trim() || "";
    }

    const tuViToday  = getWalletToday("Tu Vi");
    const ttToday    = getWalletToday("Tinh Thạch");
    const tnToday    = getWalletToday("Tiên Ngọc");

    /* ===============================
       4️⃣ RENDER PROGRESS BAR
    ================================ */
    function renderRow(label,value=0){
      const done = value>=100;
      const color = done ? "#4CAF50" : "#E74C3C";
      const bg = done ? "#1f3d2b" : "#3a1f1f";

      return `
      <div style="background:#1b1b1b;border:1px solid #2a2a2a;border-radius:8px;padding:6px 8px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
          <span>${label}</span>
          <b style="color:${color}">${Math.floor(value)}%</b>
        </div>
        <div style="height:6px;background:${bg};border-radius:4px;overflow:hidden;">
          <div style="width:${Math.min(value,100)}%;height:100%;background:${color};transition:.3s;"></div>
        </div>
      </div>`;
    }

    /* ===============================
       5️⃣ DANH SÁCH HIỂN THỊ
    ================================ */
    const order = [
      "Điểm Danh",
      "Hoang Vực",
      "Phúc Lợi Đường",
      "Vấn Đáp",
      "Bí Cảnh Tông Môn",
      "Khoáng Mạch",
      "Đổ Thạch",
      "Thí Luyện Tông Môn",
      "Vòng Quay Phúc Vận",
      "Tế Lễ Tông Môn"
    ];

    const progressHtml = order
      .map(k=>renderRow(k, progress[k] || 0))
      .join("");

    /* ===============================
       🔥 NEW: THÊM TIÊN DUYÊN VÀO UI
    ================================ */
    const tienDuyenHtml = renderRow("Tiên Duyên (Tặng Hoa)", tienDuyenPercent);

    /* ===============================
       6️⃣ TOAST UI
    ================================ */
    const htmlToast = `
    <div style="
      background:#121212;
      border-radius:14px;
      padding:14px;
      color:#e6e6e6;
      min-width:280px;
      max-height:80vh;
      overflow:auto;
      box-shadow:0 10px 28px rgba(0,0,0,.45);
      font-size:12px;
    ">

      <div style="font-size:15px;font-weight:700;margin-bottom:8px;">
        📊 Tiến Độ Ngày (${totalPercent})
      </div>

      <div style="display:grid;gap:6px;margin-bottom:10px;">
        ${progressHtml}
      </div>

      <!-- 🔥 TIÊN DUYÊN -->
      <div style="margin-bottom:10px;">
        ${tienDuyenHtml}
        <div style="margin-top:6px;font-size:12px;display:grid;gap:2px;">
  ${chestStatus.map(s=>`<div>🎁 ${s}</div>`).join("")}
</div>
      </div>

      <div style="height:1px;background:#2a2a2a;margin:8px 0;"></div>

      <div style="font-size:12px;display:grid;gap:4px;">
        <div>✨ ${tuViToday}</div>
        <div>💎 ${ttToday}</div>
        <div>🔮 ${tnToday}</div>
      </div>
    </div>`;

    showToast(htmlToast);

  }catch(e){
    console.error("Lỗi:",e);
    showToast("❌ Lỗi lấy tiến độ mới");
  }
}

[toggleTL,toggleBC,toggleTD,togglePL,toggleHV].forEach(t=>t.checked=!1);["thiluyenToggle","biCanhToggle","tienDoToggle","phucloiToggle","hoangvucToggle"].forEach(k=>localStorage.setItem(k,"off"));
toggleTL.onchange=()=>{const on=toggleTL.checked;localStorage.setItem("thiluyenToggle",on?"on":"off");if(on)autoThiLuyenSilent();else{localStorage.removeItem("nextRun_TL");stopAutoThiLuyen("🛑 Auto Thí Luyện đã tắt.")}};
toggleBC.onchange = () => {const on = toggleBC.checked;localStorage.setItem("biCanhToggle", on ? "on" : "off");if (on) {showToast("Bí Cảnh đang được thực hiện...");autoBiCanh();} else {localStorage.removeItem("nextRun_BC");showToast("Đã tắt Bí Cảnh");}};
toggleTD.onchange=()=>{const on=toggleTD.checked;localStorage.setItem("tienDoToggle",on?"on":"off");if(on)getBHDProgress()};
togglePL.onchange=()=>{const on=togglePL.checked;localStorage.setItem("phucloiToggle",on?"on":"off");if(on)autoPhucLoiHidden();else{localStorage.removeItem("nextRun_PL");if(typeof stopAutoPhucLoiHidden==="function")stopAutoPhucLoiHidden()}};
toggleHV.onchange=()=>{const on=toggleHV.checked;localStorage.setItem("hoangvucToggle",on?"on":"off");if(on)autoHoangVucHidden();else{if(typeof stopAutoHoangVucHidden==="function")stopAutoHoangVucHidden();showToast("🛑 Auto Hoang Vực đã tắt.","error")}};
// HIỆN THÔNG TIN MỎ =

// ===== CONFIG =====
const GLOBAL_KEY = "HH3D_GLOBAL_DATA";

// ===== GLOBAL STORAGE =====
function loadGlobal() {
  return GM_getValue(GLOBAL_KEY, {}) || {};
}

function saveGlobal(data) {
  GM_setValue(GLOBAL_KEY, data);
}
// ===== SETTINGS =====
function loadSettings() {
  return loadGlobal().settings || {};
}

function saveSettings(data) {
  const g = loadGlobal();

  g.settings = {
    ...(g.settings || {}),
    ...data
  };

  saveGlobal(g);
}
function loadTask() {
  return loadGlobal().tasks || {};
}

function saveTask(data) {
  const g = loadGlobal();
  g.tasks = data;
  saveGlobal(g);
}

// ===== TIME =====
function getToday() {
  const d = new Date();
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

// ===== TASK CHECK =====
function isDone(task) {
  return loadTask()[task] === getToday();
}

function markDone(task) {
  const data = loadTask();
  data[task] = getToday();
  saveTask(data);
}

// ===== AUTO RUN TRACK =====
function isAutoRanToday() {
  return loadGlobal().lastRun === getToday();
}

function markAutoRan() {
  const g = loadGlobal();
  g.lastRun = getToday();
  saveGlobal(g);
}
// ===== UI MENU =====
function createAutoMenu() {
  const box = document.createElement("div");
  box.id = "autoMenuBox";

  box.style.cssText = `
    position:fixed;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    background:#1e1e1e;
    color:#ddd;
    padding:12px;
    border-radius:10px;
    font-size:13px;
    z-index:999999;
    width:220px;
    box-shadow:0 0 20px rgba(0,0,0,0.8);
    border:1px solid #444;
  `;

  const settings = loadSettings();
  const ran = isAutoRanToday();

box.innerHTML =
    '<label style="font-size:12px;color:#aaa">⏳ Delay chạy auto sau (phút)</label>' +
'<input id="autoDelay" type="number" min="0" placeholder="VD: 1" ' +
'style="width:100%;margin-bottom:10px;padding:6px;border-radius:6px;border:none;background:#2a2a2a;color:#fff" />' +
  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
  '<b style="color:#fff;font-size:14px">⚙ Cài đặt Tự Động</b>' +
  '<span id="closeAutoMenu" style="cursor:pointer;font-size:14px">✖</span>' +
  '</div>' +
'<button id="toggleAll" style="margin-bottom:6px;width:100%;padding:5px;background:#2f2f2f;color:#fff;border:none;border-radius:6px;cursor:pointer;">☑ Chọn tất cả</button>' +
'<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;">' +
makeRow("autoWedding","wedding","❤️ Phòng Cưới") +

'<div style="display:flex;gap:6px;align-items:center;">' +
'<span style="font-size:12px;">⏱</span>' +
'<input id="weddingInterval" type="number" min="1" placeholder="số phút ktra" style="flex:1;padding:3px;background:#2a2a2a;color:#fff;border:1px solid #444;border-radius:4px;">' +
'</div>' +
makeRow("autoDiemDanh","diemdanh","📅 Điểm danh+tế lễ vấn đáp") +
makeRow("autoPhucLoi","phucloi","🎁 Phúc Lợi") +
makeRow("autoThiLuyen","thiluyen","⚔️ Thí Luyện") +
makeRow("autoHoangVuc","hoangvuc","⛏️ Hoang Vực") +
makeRow("autoBiCanh","bicanh","💎 Bí Cảnh") +
makeRow("autoHapThu","hapthu","✨ Hấp Thụ Linh Thạch") +

makeRow("autoFlower","flower","🌹 Tặng hoa") +
makeRow("autoWish","wish","🌸 Ước nguyện") +
makeRow("autoTurns","turns","🎟 Nhận lượt Khắc") +
makeRow("autoRuong","ruong","🛒 Mua Rương LB") +
'</div>' +

  // nút chọn bạn
  '<button id="btnPickFriends" style="margin-top:4px;width:100%;padding:6px;background:#3a3a3a;color:#fff;border:none;border-radius:6px;cursor:pointer;">👥 Chọn bạn</button>' +

  // nút reset đẹp hơn
  '<button id="resetAutoRun" style="margin-top:6px;width:100%;padding:6px;background:#8b2c2c;color:#fff;border:none;border-radius:6px;cursor:pointer;">♻ Reset </button>';

  document.body.appendChild(box);

  // set checkbox
[
 "autoFlower","autoWish","autoTurns","autoRuong",
 "autoPhucLoi","autoThiLuyen","autoHoangVuc","autoBiCanh","autoHapThu","autoWedding",
 "autoDiemDanh"
].forEach(id=>{
    const el = box.querySelector("#"+id);
    if (!el) return;
    el.checked = settings[id] || false;
el.onchange = () => {
  saveSettings({ [id]: el.checked });

  if (id === "autoWedding") {
    startAutoWeddingLoop();
  }
};
  });
const toggleBtn = box.querySelector("#toggleAll");

toggleBtn.onclick = () => {
  const current = loadSettings();

  const keys = [
    "autoFlower","autoWish","autoTurns","autoRuong",
    "autoPhucLoi","autoThiLuyen","autoHoangVuc","autoBiCanh","autoHapThu","autoWedding",
    "autoDiemDanh"
  ];

  const isAllChecked = keys.every(k => current[k]);

  const newData = {};
  keys.forEach(k => {
    newData[k] = !isAllChecked;

    const el = box.querySelector("#" + k);
    if (el) el.checked = !isAllChecked;
  });

  saveSettings(newData);

  toggleBtn.innerText = isAllChecked ? "☑ Chọn tất cả" : "❌ Bỏ chọn tất cả";

  startAutoWeddingLoop();
};
    const keys = [
  "autoFlower","autoWish","autoTurns","autoRuong",
  "autoPhucLoi","autoThiLuyen","autoHoangVuc","autoBiCanh","autoHapThu","autoWedding",
  "autoDiemDanh","autoLuanVo"
];

const isAllChecked = keys.every(k => settings[k]);

box.querySelector("#toggleAll").innerText =
  isAllChecked ? "❌ Bỏ chọn tất cả" : "☑ Chọn tất cả";
  // đóng
  box.querySelector("#closeAutoMenu").onclick = () => box.remove();

  // chọn bạn
  box.querySelector("#btnPickFriends").onclick = () => {
    box.remove();
    showFriendPicker();
  };
// load interval
const intervalInput = box.querySelector("#weddingInterval");
intervalInput.value = settings.weddingInterval || 15;
// load delay
const delayInput = box.querySelector("#autoDelay");
delayInput.value = settings.autoDelay || 0;

// save delay
delayInput.onchange = () => {
  settings.autoDelay = Math.max(0, parseInt(delayInput.value) || 0);
  saveSettings(settings);
};
// save interval
intervalInput.onchange = () => {
  settings.weddingInterval = Math.max(1, parseInt(intervalInput.value) || 15);
  saveSettings(settings);

  // 👉 restart loop ngay
  startAutoWeddingLoop();
};
  // reset
box.querySelector("#resetAutoRun").onclick = () => {
  const g = loadGlobal();

  g.tasks = {};
  g.lastRun = null;

  saveGlobal(g);

  [
    "phucloi","thiluyen","hoangvuc","bicanh","hapthu",
    "flower","wish","turns","ruong",
    "diemdanh"
  ].forEach(updateStatus);

if (weddingTimer) {
  clearInterval(weddingTimer);
  weddingTimer = null;
}
  showToast("♻ Reset + chạy lại!");

  setTimeout(runAuto, 1000);
};
}
function makeRow(id, key, text) {
  const done = isDone(key);

  return `
  <label style="display:flex;justify-content:space-between;align-items:center;">
    <span>
      <input type="checkbox" id="${id}"> ${text}
    </span>
    <span id="status_${key}" style="font-size:11px;color:${done ? "#4caf50":"#aaa"}">
      ${done ? "✔" : "⏳"}
    </span>
  </label>`;
}
    function updateStatus(key) {
  const el = document.getElementById("status_" + key);
  if (!el) return;

  const done = isDone(key);
  el.innerText = done ? "✔" : "⏳";
  el.style.color = done ? "#4caf50" : "#aaa";
}
// ===== PICK FRIEND =====
async function showFriendPicker() {
  const friends = await getFriendsList();
  const settings = loadSettings();

  let selected = settings.selectedFriends || [];

  const popup = document.createElement("div");

  popup.style.cssText = `
    position:fixed;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    background:#1e1e1e;
    color:#ddd;
    padding:10px;
    border-radius:10px;
    z-index:999999;
    max-height:400px;
    overflow:auto;
    width:260px;
  `;

  popup.innerHTML = "<b>Chọn bạn</b><br>";

  friends.forEach(f => {
    const row = document.createElement("div");

    const checked = selected.includes(f.user_id);

    row.innerHTML =
      `<label>
        <input type="checkbox" ${checked ? "checked":""}>
        ${f.display_name}
      </label>`;


  row.querySelector("input").onchange = (e) => {
  if (e.target.checked) {
    if (selected.length >= 5) {
      e.target.checked = false;
      showToast("⚠️ Chỉ chọn tối đa 5 người");
      return;
    }
    selected.push(f.user_id);
  } else {
    selected = selected.filter(id => id !== f.user_id);
  }
};
    popup.appendChild(row);
  });

  const saveBtn = document.createElement("button");
  saveBtn.innerText = "💾 Lưu";
saveBtn.style.cssText = `
  margin-top:8px;
  width:100%;
  padding:6px;
  background:#3a3a3a;
  color:#fff;
  border:none;
  border-radius:6px;
  cursor:pointer;
`;

  saveBtn.onclick = () => {
    settings.selectedFriends = [...new Set(selected)];
    saveSettings(settings);
    popup.remove();
  };

  popup.appendChild(saveBtn);
  document.body.appendChild(popup);
}

// ===== AUTO =====
function autoRuong() {
  if (!loadSettings().autoRuong || isDone("ruong")) return;

  document.querySelector("#btnRuongLB")?.click();

  markDone("ruong");
  updateStatus("ruong");
}
function autoWeddingClick() {
  if (!loadSettings().autoWedding) return;

  setTimeout(() => {
    console.log("❤️ Đi phòng cưới");
    document.querySelector("#btnWedding")?.click();
  }, 10000);
}
    let weddingTimer = null;

function startAutoWeddingLoop() {
  const settings = loadSettings();

  // ❗ nếu tắt thì clear luôn
  if (!settings.autoWedding) {
    if (weddingTimer) {
      clearInterval(weddingTimer);
      weddingTimer = null;
    }
    return;
  }

  const minutes = settings.weddingInterval || 15;

  autoWeddingClick();

  if (weddingTimer) clearInterval(weddingTimer);

  weddingTimer = setInterval(() => {
    autoWeddingClick();
  }, minutes * 60 * 1000);

  console.log(`❤️ Auto cưới mỗi ${minutes} phút`);
}

async function autoGiftFlower() {
  const settings = loadSettings();
  if (!settings.autoFlower || isDone("flower")) return;

  let ids = settings.selectedFriends || [];

  const friends = await getFriendsList();

  // 👉 nếu chưa chọn → auto lấy 5 ng đầu
  if (!ids.length) {
    ids = friends.slice(0, 5).map(f => f.user_id);
  }

  for (let id of ids.slice(0, 5)) {
    const f = friends.find(x => x.user_id == id);
    if (!f) continue;

    await giftFlower3(f);
    await new Promise(r => setTimeout(r, 1200));
  }

  markDone("flower");
  updateStatus("flower");
}


async function autoWish() {
  if (!loadSettings().autoWish || isDone("wish")) return;

  await makeWishTree();

  markDone("wish");
  updateStatus("wish");
}

function autoTurns() {
  if (!loadSettings().autoTurns || isDone("turns")) return;

  document.querySelector("#btnClaimTurns")?.click();

  markDone("turns");
  updateStatus("turns");
}

function autoPhucLoiClick() {
  if (!loadSettings().autoPhucLoi || isDone("phucloi")) return;

  console.log("🎁 Phúc lợi");

  const toggle = document.querySelector("#togglePhucLoi");
  if (!toggle) return;

  // nếu chưa bật thì mới click
  if (!toggle.checked) {
    toggle.click();
  }

  // chờ xử lý xong mới đánh dấu
  setTimeout(() => {
    markDone("phucloi");
    updateStatus("phucloi");
  }, 1200);
}
function autoThiLuyenClick() {
  if (!loadSettings().autoThiLuyen || isDone("thiluyen")) return;

  console.log("⚔️ Thí luyện");

  document.querySelector("#toggleThiLuyen")?.click();

  setTimeout(() => {
    markDone("thiluyen");
    updateStatus("thiluyen");
  }, 800);
}

function autoHoangVucClick() {
  if (!loadSettings().autoHoangVuc || isDone("hoangvuc")) return;

  console.log("⛏️ Hoang vực");

  document.querySelector("#toggleHoangVuc")?.click();

  setTimeout(() => {
    markDone("hoangvuc");
    updateStatus("hoangvuc");
  }, 800);
}

function autoBiCanhClick() {
  if (!loadSettings().autoBiCanh || isDone("bicanh")) return;

  console.log("💎 Bí cảnh");

  document.querySelector("#toggleBiCanh")?.click();

  setTimeout(() => {
    markDone("bicanh");
    updateStatus("bicanh");
  }, 800);
}
function autoHapThuClick() {
  if (!loadSettings().autoHapThu || isDone("hapthu")) return;

  console.log("✨ Hấp thụ");

  document.querySelector("#hapThuBtn")?.click();

  setTimeout(() => {
    markDone("hapthu");
    updateStatus("hapthu");
  }, 800);
}
function autoDiemDanhClick() {
  if (!loadSettings().autoDiemDanh || isDone("diemdanh")) return;

  console.log("📅 Điểm danh");

  document.querySelector("#btnDiemDanh")?.click();

  setTimeout(() => {
    markDone("diemdanh");
    updateStatus("diemdanh");
  }, 800);
}

// ===== RUN AUTO =====
async function runAuto() {
  console.log("🚀 AUTO RUN");

  // ===== TASK NHẸ CHẠY TRƯỚC =====
  autoDiemDanhClick();
  await sleep(4000);

  autoPhucLoiClick();
  await sleep(4000);

  autoThiLuyenClick();
  await sleep(4000);

  autoHoangVucClick();
  await sleep(4000);

  autoBiCanhClick();
  await sleep(4000);

  autoHapThuClick();
  await sleep(4000);

  // ===== AUTO KHÁC =====
  await autoGiftFlower();
  await sleep(4000);

  await autoWish();
  await sleep(4000);

  autoTurns();
  await sleep(4000);

autoRuong();
await sleep(4000);
}
function initAuto() {
  console.log("🚀 INIT AUTO");

  const settings = loadSettings();
  const delayMinutes = settings.autoDelay || 0;

  // ✅ cưới chạy ngay (không delay)
  startAutoWeddingLoop();

  // ✅ auto chính delay theo phút
  const delayMs = delayMinutes * 60 * 1000;

  console.log(`⏳ Delay auto: ${delayMinutes} phút`);

  setTimeout(() => {
    runAuto();
  }, delayMs);
}
function waitForGameReady() {
  const check = setInterval(() => {
    if (document.body && document.querySelector("body")) {
      clearInterval(check);
      initAuto();
    }
  }, 1000);
}

waitForGameReady();
(function HH3D_MINE_UI_STABLE() {
    let LAST_MINE_DATA = null;
    let BATQUAI_FIXED = false;

    /**************** UI ****************/
    function renderStats(data) {
        if (!data || !data.users) return;

        const bonus_display = document.querySelector('#bonus-display');
        if (!bonus_display) return;
       bonus_display.style.display = 'block'; //FIX CHẶN HIỆN IU
        let enemies = 0, dongMon = 0, lienMinh = 0;

        data.users.forEach(u => {
            if (u.dong_mon) dongMon++;
            else if (u.lien_minh) lienMinh++;
            else enemies++;
        });

        let info = bonus_display.querySelector('.hh3d-mine-info');
        if (!info) {
            info = document.createElement('div');
            info.className = 'hh3d-mine-info';
            info.style.cssText = `
                font-size:11px;
                margin-top:2px;
                line-height:1.4;
            `;
            bonus_display.prepend(info);
        }

        info.innerHTML = `
            🩸 Kẻ địch: <b>${enemies}</b><br>
            🤝 Liên minh: <b>${lienMinh}</b><br>
            ☯️ Đồng môn: <b>${dongMon}</b><br>
            ⚔️ Lượt còn lại: <b>${data.attacks_left ?? 0}</b>
        `;
    }

    function fixBatQuaiOnce(data) {
        if (BATQUAI_FIXED) return;
        if (!data || typeof data.bat_quai_tran_do_count !== 'number') return;

        const section = document.querySelector('#batquai-section');
        if (!section) return;

        const target = Array.from(section.querySelectorAll('*'))
            .find(el => /\d+\s*\/\s*8/.test(el.textContent));

        if (!target) return;

        target.textContent = `${data.bat_quai_tran_do_count}/8`;
        BATQUAI_FIXED = true;
    }

    function handleMineData(data) {
        LAST_MINE_DATA = data;
        BATQUAI_FIXED = false;

        setTimeout(() => renderStats(data), 100);
        setTimeout(() => renderStats(data), 500);

        setTimeout(() => fixBatQuaiOnce(data), 300);
        setTimeout(() => fixBatQuaiOnce(data), 800);
    }

    /**************** XHR HOOK ****************/
    const _open = XMLHttpRequest.prototype.open;
    const _send = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this.__url = url;
        return _open.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        this.addEventListener('load', () => {
            try {
                if (!this.responseText) return;

                if (this.responseText.includes('"users"') && this.responseText.includes('"attacks_left"')) {
                    const json = JSON.parse(this.responseText);

                    if (json?.success && json?.data?.users) {
                        console.log('[HH3D] XHR mine data');
                        handleMineData(json.data);
                    }
                }

            } catch (e) {
                console.error('[HH3D] parse error', e);
            }
        });

        return _send.apply(this, arguments);
    };

})();
(function () {
  const STYLE_ID = "khoang-fix-10-style";
  function injectFixStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.innerHTML = `
      /* ===== FIX 10 Ô + SCROLL ===== */
      #user-list {display: flex !important;flex-wrap: nowrap !important;overflow-x: auto !important;overflow-y: hidden !important;gap: 0 !important;margin-left: 0 !important;padding: 0 0 6px 0 !important;}
      .user-row {flex: 0 0 9.5% !important;width: 9.5% !important;max-width: 9.5% !important;min-width: 0 !important;box-sizing: border-box;padding: 4px !important;}
      .user-row * {min-width: 0 !important;max-width: 100% !important;box-sizing: border-box;}
      .modal-content {width: 100vw !important;max-width: none !important;}
      .pagination, #page-indicator {display: none !important;}
  @media (max-width: 768px) {
  .avatar-km {background: none !important;border: none !important;box-shadow: none !important;padding: 0 !important;
  }.avatar-km::before,.avatar-km::after { display: none !important;content: none !important;
  }
}.flag-default,.flag-item-6,.flag-item-7 { display: none !important; }[class^="tong-cap-"] {display: none !important; } }`;
    document.head.appendChild(style);
  }
  function removeFixStyle() {
    const s = document.getElementById(STYLE_ID);
    if (s) s.remove();
  }

function ensureButton() {
  const modal = document.querySelector(".modal-content");
  if (!modal) return;
  if (getComputedStyle(modal).position === "static") {
    modal.style.position = "relative";
  }
  if (modal.querySelector(".khoang-toggle-btn")) return;
  const btn = document.createElement("button");
  btn.className = "khoang-toggle-btn";
  btn.textContent = "<>";
  btn.style.cssText = `
  position:absolute;top:1.5px;right:8px;
  z-index:999999;background: rgba(255,255,255,0.03);
  color: #8b949e;border: none;outline: none;border-radius: 10px;padding: 6px 12px;
  cursor: pointer;font-size: 12px;font-weight: 500;letter-spacing: .4px;
  transition: all .25s ease;
`;

  btn.onmouseenter = () => {
    btn.style.background = "rgba(255,77,79,0.1)";
    btn.style.boxShadow = "0 0 10px rgba(255,77,79,.8)";
  };
  btn.onmouseleave = () => {
    btn.style.background = "transparent";
    btn.style.boxShadow = "0 0 6px rgba(255,77,79,.4)";
  };

  let on = false;
  btn.onclick = function () {
    on = !on;
    if (on) {
      injectFixStyle();
      btn.textContent = "↩";
    } else {
      removeFixStyle();
      btn.textContent = "<>";
    }
  };
  modal.appendChild(btn);
}
const observer = new MutationObserver(ensureButton);
observer.observe(document.body, { childList: true, subtree: true });
ensureButton();
(function () {
  const STYLE_ID = "khoang-fix-10-style";
  function injectFixStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.innerHTML = `
      /* ===== FIX 10 Ô + SCROLL ===== */
      #user-list {display: flex !important;flex-wrap: nowrap !important;overflow-x: auto !important;overflow-y: hidden !important;gap: 0 !important;margin-left: 0 !important;padding: 0 0 6px 0 !important;}
      .user-row {flex: 0 0 9.5% !important;width: 9.5% !important;max-width: 9.5% !important;min-width: 0 !important;box-sizing: border-box;padding: 4px !important;}
      .user-row * {min-width: 0 !important;max-width: 100% !important;box-sizing: border-box;}
      .modal-content {width: 100vw !important;max-width: none !important;}
      .pagination, #page-indicator {display: none !important;}
  @media (max-width: 768px) {
  .avatar-km {background: none !important;border: none !important;box-shadow: none !important;padding: 0 !important;
  }.avatar-km::before,.avatar-km::after { display: none !important;content: none !important;
  }
}.flag-default,.flag-item-6,.flag-item-7 { display: none !important; }[class^="tong-cap-"] {display: none !important; } }`;
    document.head.appendChild(style);
  }

  function removeFixStyle() {
    const s = document.getElementById(STYLE_ID);
    if (s) s.remove();
  }
function ensureButton() {
  const modal = document.querySelector(".modal-content");
  if (!modal) return;
  if (getComputedStyle(modal).position === "static") {
    modal.style.position = "relative";
  }
  if (modal.querySelector(".khoang-toggle-btn")) return;
  const btn = document.createElement("button");
  btn.className = "khoang-toggle-btn";
  btn.textContent = "<>";
  btn.style.cssText = `
  position:absolute;top:1.5px;right:8px;
  z-index:999999;background: rgba(255,255,255,0.03);
  color: #8b949e;border: none;outline: none;border-radius: 10px;padding: 6px 12px;
  cursor: pointer;font-size: 12px;font-weight: 500;letter-spacing: .4px;
  transition: all .25s ease;
`;
  btn.onmouseenter = () => {
    btn.style.background = "rgba(255,77,79,0.1)";
    btn.style.boxShadow = "0 0 10px rgba(255,77,79,.8)";
  };
  btn.onmouseleave = () => {
    btn.style.background = "transparent";
    btn.style.boxShadow = "0 0 6px rgba(255,77,79,.4)";
  };
  let on = false;
  btn.onclick = function () {
    on = !on;
    if (on) {
      injectFixStyle();
      btn.textContent = "↩";
    } else {
      removeFixStyle();
      btn.textContent = "<>";
    }
  };
  modal.appendChild(btn);
}
const observer = new MutationObserver(ensureButton);
observer.observe(document.body, { childList: true, subtree: true });
ensureButton();
    (function () {
const API_URL = "/wp-content/themes/halimmovies-child/hh3d-ajax.php";
  // ================== STORAGE =================
const KM_SEC = {
  attack_security: null,
  mine_security: null,
  refresh_nonce: null,
  token: null,
  actMap: {},      
  lastScan: 0
};

  const KM_STATE = {
    currentMineId: null
  };
  // UTILS
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
  // Local resolveAction for this IIFE (reads from KM_SEC.actMap or window.hh3dData)
  function resolveAction(actKey, fallback) {
    return KM_SEC.actMap?.[actKey] || window.hh3dData?.act?.[actKey] || fallback;
  }
  // QUÉT SECURITY TỪ DOM
  // Updated for new pattern: hh3dData.act.kmXxx : 'fallback_name' ... security: 'nonce'
  function scanSecurityFromDOM() {
    // 1) Try reading hh3dData directly from the page (fastest, most reliable)
    if (window.hh3dData) {
      if (window.hh3dData.act) KM_SEC.actMap = window.hh3dData.act;
      if (window.hh3dData.securityToken) KM_SEC.token = window.hh3dData.securityToken;
    }
    // 2) Scan inline scripts for per-action security nonces
    const html = document.documentElement.innerHTML;
const mMine = html.match(/(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmUsers\s*:\s*)?['"]get_users_in_mine['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i);
if (mMine?.[1]) {
  KM_SEC.mine_security = mMine[1];
}
    const m1 = html.match(/['"]attack_user_in_mine['"][\s\S]{0,400}?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i);
    if (m1?.[1]) {
      KM_SEC.attack_security = m1[1];
    }
    const m2 = html.match(/(?:hh3dData\.act\)?\s*\?\s*hh3dData\.act\.kmRefresh\s*:\s*)?['"]refresh_attack_count['"][\s\S]{0,400}?nonce:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i);
    if (m2?.[1]) {
      KM_SEC.refresh_nonce = m2[1];
    }
    // 3) Token fallback from HTML if not already found from hh3dData
    if (!KM_SEC.token) {
      const token =
        html.match(/"securityToken"\s*:\s*"([^"]+)"/i)?.[1] ||
        html.match(/security_token["']?\s*[:=]\s*["']([^"']+)/i)?.[1];
      if (token) {
        KM_SEC.token = token;
      }
    }
    KM_SEC.lastScan = Date.now();
  }
  async function getSecurityBundle() {
    if (!KM_SEC.attack_security || !KM_SEC.token || Date.now() - KM_SEC.lastScan > 5 * 60 * 1000) {
      scanSecurityFromDOM();
      await sleep(300);
    }
    if (!KM_SEC.attack_security || !KM_SEC.token) {
      throw new Error("❌ Chưa lấy được security / token");
    }
    return {
      security: KM_SEC.attack_security,
      token: KM_SEC.token
    };
  }
//  HOOK XHR
(function () {
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__km_url = url;
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (body) {
    try {
      if (this.__km_url && this.__km_url.includes("hh3d-ajax.php") && body) {
        let bodyText = "";
        if (typeof body === "string") {
          bodyText = body;
        } else if (body instanceof URLSearchParams) {
          bodyText = body.toString();
        }
        if (bodyText.includes("action=get_users_in_mine") || bodyText.includes("action=" + resolveAction("kmUsers", ""))) {
          const params = new URLSearchParams(bodyText);
          const mineId = params.get("mine_id");
          if (mineId) {
            KM_STATE.currentMineId = Number(mineId);
          }

        }
      }
    } catch (e) {
    }
    return origSend.call(this, body);
  };
})();
        // Hàm reset mỏ
        async function refreshMineUsers(mineId) {
  if (!mineId) return;
  if (!KM_SEC.token || !KM_SEC.mine_security || Date.now() - KM_SEC.lastScan > 5 * 60 * 1000) {
    scanSecurityFromDOM();
    await sleep(200);
  }
  if (!KM_SEC.token || !KM_SEC.mine_security) {
    console.warn("[KM] Chưa có token / mine_security để refresh mỏ");
    return;
  }
  const fd = new FormData();
  fd.append("action", resolveAction("kmUsers", "get_users_in_mine"));
  fd.append("mine_id", mineId);
  fd.append("security_token", KM_SEC.token);
  fd.append("security", KM_SEC.mine_security);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      credentials: "include",
      body: fd
    }).then(r => r.json());
    return res;
  } catch (e) {
    console.warn("[KM] Lỗi refresh mỏ:", e);
  }
}
  //  HÀM ĐÁNH
async function attackUserInMine(attackToken, mineId) {
  const { security, token } = await getSecurityBundle();

  await sleep(199);
  await sleep(100);

  const fd = new FormData();
  fd.append("action", resolveAction("kmAttack", "attack_user_in_mine"));
  fd.append("attack_token", attackToken); // 🔥 đổi ở đây
  fd.append("mine_id", mineId);
  fd.append("security", security);
  fd.append("security_token", token);

  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());

  const msg =
    res?.data?.message ||
    res?.message ||
    "Đánh thất bại";

  showToast(` ${msg}`);

  if (res && (res.success || res?.data)) {
    setTimeout(() => {
      refreshMineUsers(mineId);
    }, 100);
  }

  return res;
}
  window.attackUserInMine = attackUserInMine;
function createFastAttackBtn(row) {
  if (!row.classList.contains("user-row")) return;

  // ✅ Nếu đã có nút thì không tạo lại
  if (row.querySelector(".fast-attack-btn")) return;

  // 🔥 LẤY TRỰC TIẾP ATTACK TOKEN
  const attackToken = row.getAttribute("data-user-id");
  if (!attackToken) return;

  row.style.position = "relative";

  const btn = document.createElement("div");
  btn.className = "fast-attack-btn";
  btn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>';

  btn.title = "Đánh nhanh";

  btn.style.cssText = `
    position:absolute;
    top:8px;
    left:8px;
    width:24px;
    height:24px;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    background:rgba(255,255,255,.05);
    color:#9aa4b2;
    border-radius:50%;
    z-index:10;
  `;

  btn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (btn.dataset.loading === "1") return;
    if (!KM_STATE.currentMineId) {
      showToast("❌ Chưa có mineId");
      return;
    }

    btn.dataset.loading = "1";
    const old = btn.innerHTML;
    btn.innerHTML = "⏳";

    try {
      // 🔥 truyền attackToken (string), KHÔNG ép số
      await attackUserInMine(attackToken, KM_STATE.currentMineId);
      btn.innerHTML = "✔";
    } catch (err) {
      console.error(err);
      btn.innerHTML = "❌";
    }

    setTimeout(() => {
      btn.innerHTML = old;
      delete btn.dataset.loading;
    }, 800);
  };

  row.appendChild(btn);
}

  function scanAndAttach() {
    const rows = document.querySelectorAll(".user-row, .user-item, [data-user-id]");
    rows.forEach(createFastAttackBtn);
  }
  // Quét lần đầu
  scanAndAttach();
  // Theo dõi DOM nếu list load lại
  const obs = new MutationObserver(() => {
    scanAndAttach();
  });
  obs.observe(document.body, { childList: true, subtree: true });
(function addBuyTurnButton() {
  const modal = document.querySelector(".modal-content");
  if (!modal) return;
  if (document.getElementById("ak-buy-turn-btn")) return;
  const btn = document.createElement("button");
  btn.id = "ak-buy-turn-btn";
  const resetIcon = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6V3L8 7l4 4V8c2.8 0 5 2.2 5 5a5 5 0 11-9.9-1H5.1A7 7 0 1012 6z"/></svg>`;
  btn.innerHTML = resetIcon;
  btn.style.cssText = `
    position:absolute;top:1.5px;left:12px;z-index:999999;background:rgba(255,255,255,.03);
    color:#8b949e;border:none;outline:none;border-radius:10px;width:28px;
    height:28px;display:flex;
    align-items:center;justify-content:center;
    cursor:pointer;transition:all .25s ease;
  `;
  // Hover effect
  btn.onmouseenter = () => {btn.style.background = "rgba(0,194,255,.08)";btn.style.color = "#00c2ff";btn.style.boxShadow = "0 0 8px rgba(0,194,255,.3)";
  };
  btn.onmouseleave = () => {btn.style.background = "rgba(255,255,255,.03)";btn.style.color = "#8b949e";btn.style.boxShadow = "none";
  };
  btn.onclick = async () => {
    if (btn.dataset.loading === "1") return;
    btn.dataset.loading = "1";
    // Spinner
    btn.innerHTML = `
      <div style=" width:14px;  height:14px; border:2px solid #00c2ff; border-top:2px solid transparent;
        border-radius:50%; animation:akSpin .6s linear infinite">
      </div>
    `; btn.style.pointerEvents = "none"; try {
      await buyAttackTurn();} catch (e) {
      console.error(e);
      showToast("❌ Lỗi khi mua lượt đánh");
    } finally {
      btn.innerHTML = resetIcon;
      btn.dataset.loading = "0";
      btn.style.pointerEvents = "auto";
    }
  };
  if (!document.getElementById("ak-spin-style")) {
    const style = document.createElement("style");
    style.id = "ak-spin-style";
    style.innerHTML = `
      @keyframes akSpin {from { transform: rotate(0deg); }to { transform: rotate(360deg); } }
    `; document.head.appendChild(style);
  }
  modal.style.position = "relative";
  modal.appendChild(btn);
    // NÚT LỌC ĐÁNH
(function addFilterAttackBtn() {
  const modal = document.querySelector(".modal-content");
  if (!modal) return;
  if (document.getElementById("ak-filter-attack-btn")) return;

  const btn = document.createElement("button");
  btn.id = "ak-filter-attack-btn";

  const filterIcon = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM5 10a5 5 0 1110 0A5 5 0 015 10z"/>
    </svg>
  `;
  btn.innerHTML = filterIcon;
  btn.style.cssText = `
    position:absolute;top:1.5px;left:48px;
    z-index:999999;background:rgba(255,255,255,.03);color:#8b949e;border:none;outline:none;border-radius:10px;width:28px;height:28px;display:flex;
    align-items:center;justify-content:center;cursor:pointer;
    transition:all .25s ease;
  `;
  // Hover
  btn.onmouseenter = () => {
    btn.style.background = "rgba(0,194,255,.08)";
    btn.style.color = "#00c2ff";
    btn.style.boxShadow = "0 0 8px rgba(0,194,255,.3)";
  };
  btn.onmouseleave = () => {
    btn.style.background = "rgba(255,255,255,.03)";
    btn.style.color = "#8b949e";
    btn.style.boxShadow = "none";
  };
  btn.onclick = async () => {
    if (btn.dataset.loading === "1") return;
    if (!KM_STATE.currentMineId) {
      showToast("❌ Chưa mở mỏ");
      return;
    }
    btn.dataset.loading = "1";
    btn.style.pointerEvents = "none";
    // Spinner
    btn.innerHTML = `
      <div style="
        width:14px;height:14px;
        border:2px solid #00c2ff;border-top:2px solid transparent;border-radius:50%;animation:akSpin .6s linear infinite">
      </div>
    `;
    try {
      const res = await refreshMineUsers(KM_STATE.currentMineId);
      if (!res || !res.success) {
        showToast("❌ Không lấy được danh sách");
        return;
      }
const users = res?.data?.users || [];
const enemies = users
  .filter(u => {
    if (!u || !u.id) return false;
    //Không cùng liên minh
    const lienMinh =
      u.lien_minh === false ||
      u.lien_minh === "false" ||
      u.lien_minh === 0 ||
      u.lien_minh === "0";
    // Không đồng môn
    const dongMon =
      u.dong_mon === false ||
      u.dong_mon === "false" ||
      u.dong_mon === 0 ||
      u.dong_mon === "0";
    return lienMinh && dongMon;
  })
  .map(u => {
    // LẤY TÊN TÔNG
    let tongName = "";
    if (u.group_role_html) {
      const match = u.group_role_html.match(
        /<span class=["']bang-hoi-[^"']+["']>(.*?)<\/span>/
      );
      tongName = match ? match[1].trim() : "";
    }
    // LẤY SỐ PHÚT ĐÀO
    let minutes = 9999;
    if (u.time_spent) {
      const match = u.time_spent.match(/\d+/);
      minutes = match ? parseInt(match[0]) : 9999;
    }
    return {
      ...u,
      tongName,
      minutes
    };
  });
    if (!enemies.length) {
      showToast("Không có địch trong mỏ");
      return;
    }
    showEnemyPopup(enemies);
    } catch (e) {
      console.error(e);
      showToast("❌ Lỗi khi lọc");
    } finally {
      btn.innerHTML = filterIcon;
      btn.dataset.loading = "0";
      btn.style.pointerEvents = "auto";
    }
  };
  // Inject animation nếu chưa có
  if (!document.getElementById("ak-spin-style")) {
    const style = document.createElement("style");
    style.id = "ak-spin-style";
    style.innerHTML = `
      @keyframes akSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  modal.appendChild(btn);
})();
async function buyAttackTurn() {
  if (!KM_SEC.refresh_nonce || !KM_SEC.token || Date.now() - KM_SEC.lastScan > 5 * 60 * 1000) {
    scanSecurityFromDOM();
    await sleep(300);
  }
  if (!KM_SEC.refresh_nonce || !KM_SEC.token) {
    throw new Error("❌ Chưa lấy được nonce / token");
  }
  const fd = new FormData();
  fd.append("action", resolveAction("kmRefresh", "refresh_attack_count"));
  fd.append("nonce", KM_SEC.refresh_nonce);
  fd.append("security_token", KM_SEC.token);
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  const msg =
    res?.data?.message ||
    res?.message ||
    "Mua lượt thất bại";
  showToast(`🛒 ${msg}`);
  return res;
}
window.buyAttackTurn = buyAttackTurn;
    function getMyUserId() {
  const link = document.querySelector('a[href*="/profile/"]');
  if (!link) return null;
  const match = link.getAttribute("href").match(/\/profile\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}
function showEnemyPopup(list) {
  document.getElementById("ak-enemy-popup")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "ak-enemy-popup";
  overlay.style.cssText = `
    position: fixed;inset: 0;background: rgba(0,0,0,0.6);
    z-index: 9999999;display: flex;
    align-items: center;justify-content: center;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    width: 430px;max-height: 520px;
    background: #111;border-radius: 12px;padding: 15px;
    overflow-y: auto;box-shadow: 0 0 20px rgba(0,0,0,0.8);
  `;

  const title = document.createElement("div");
  title.style.cssText = `font-weight:700;color:#00eaff;margin-bottom:8px;`;
  title.textContent = `Danh sách địch (${list.length}) - Đã chọn: 0`;
  box.appendChild(title);

  const selected = new Set();

  // ===== SMART TIME OFFSET =====
  let timeOffset = 0;

  const activeUser = list.find(u =>
    u.time_spent && u.time_spent.includes("phút")
  );

  if (activeUser) {
    const entered = Number(activeUser.entered_at);
    const shownMinutes = parseInt(activeUser.time_spent);

    if (entered && !isNaN(shownMinutes)) {
      const localNow = Math.floor(Date.now() / 1000);
      const serverNow = entered + (shownMinutes * 60);
      timeOffset = serverNow - localNow;
    }
  }

  // ===== RENDER LIST =====
  list.forEach((user, index) => {

    // ===== TÍNH PHÚT REALTIME =====
    let minutesText = "";

    if (user.time_spent) {

      if (user.time_spent.includes("phút")) {
        minutesText = user.time_spent;

      } else if (user.time_spent.includes("Đạt tối đa")) {
        const enteredAt = Number(user.entered_at);

        if (enteredAt && timeOffset) {
          let now = Math.floor(Date.now() / 1000) + timeOffset;
          let diff = now - enteredAt;
          if (diff < 0) diff = 0;

          const minutes = Math.floor(diff / 60);

          minutesText = minutes > 0
            ? `🔥 ${minutes} phút`
            : "Đạt tối đa";
        } else {
          minutesText = "Đạt tối đa";
        }
      }
    }

    // ===== UI ROW =====
    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;align-items:center;gap:10px;
      padding:8px;margin-bottom:6px;
      background:#1c1c1c;border-radius:8px;
      cursor:pointer;transition:0.2s;
    `;

    row.innerHTML = `
      <div style="color:#888;font-size:12px;width:25px">
        ${index + 1}
      </div>

      <div class="avatar-container-header adjust-frame ${user.avatar_frame || ''}"
           style="width:40px;height:40px;flex-shrink:0;">

        <img src="${user.avatar || ''}"
             onerror="this.src='https://i.imgur.com/6VBx3io.png'"
             class="responsive-img"
             style="border-radius:50%;object-fit:cover;" />
      </div>

      <div style="flex:1">
        <div style="font-weight:600;color:#fff">
          ${user.name}
        </div>

        <div style="font-size:12px;color:#00c2ff">
        ${user.group_role_html || "<span style='color:#888'>Tán Tu</span>"}
        </div>

        <div style="font-size:12px;color:#aaa">
          ${minutesText}
        </div>
      </div>
    `;
// chặn link tông
row.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
  });
});
    row.onclick = () => {
      if (selected.has(user.id)) {
        selected.delete(user.id);
        row.style.background = "#1c1c1c";
        row.style.boxShadow = "none";
      } else {
        selected.add(user.id);
        row.style.background = "#003a4f";
        row.style.boxShadow = "0 0 8px #00c2ff";
      }
      title.textContent =
        `Danh sách địch (${list.length}) - Đã chọn: ${selected.size}`;
    };
    box.appendChild(row);
  });
  const attackBtn = document.createElement("button");
  attackBtn.textContent = "ĐÁNH ĐÃ CHỌN";
  attackBtn.style.cssText = `
    width:100%;margin-top:10px;
    padding:9px; border:none; border-radius:8px;background:#ff4d4f;
    color:#fff;font-weight:700;cursor:pointer;
  `;
  attackBtn.onclick = async () => {
    if (!selected.size) {
      showToast("❌ Chưa chọn ai");
      return;
    }
    attackBtn.textContent = "Đang đánh...";
    attackBtn.disabled = true;
    const mineId = KM_STATE.currentMineId;
    const selectedIds = Array.from(selected);
if (selectedIds.length >= 2) {
  showToast("⚔️ Đánh mục tiêu đầu tiên chờ xíu để chống band...");

  // đánh thằng đầu tiên
  const firstTarget = selectedIds.shift();
  await attackUserInMine(firstTarget, mineId);

  // chờ 5.5s
  await sleep(5500);

  showToast("⚡ Tiếp tục đánh các mục tiêu còn lại...");
}
    for (const id of selectedIds) {
      let res = await attackUserInMine(id, mineId);
      const msg =
        res?.data?.message ||
        res?.message ||
        "";
      const isOutOfTurn =
        msg.includes("Đạo hữu đã đạt giới hạn tấn công hôm nay.") ||
        msg.includes("0 lượt");
      if (isOutOfTurn) {
        showToast("⚠️ Hết lượt → Đang mua thêm...");
        const buyRes = await buyAttackTurn();
        const buyOk =
          buyRes?.success ||
          buyRes?.data?.success;

        if (!buyOk) {
          showToast("❌ Mua lượt thất bại");
          break;
        }
        await attackUserInMine(id, mineId);
      }
      await new Promise(r => setTimeout(r, 200));
    }
    attackBtn.textContent = "Xong";
    attackBtn.disabled = false;
    setTimeout(() => overlay.remove(), 400);
  };
  box.appendChild(attackBtn);
  overlay.appendChild(box);
  overlay.onclick = e => {
    if (e.target === overlay) overlay.remove();
  };
  document.body.appendChild(overlay);
}
(function hookMineXHRSmartLogic() {
  let latestUsers = [];

  // ===== HOOK XHR =====
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    this.addEventListener("load", function() {
      try {
        if (!this._url || !this._url.includes("hh3d-ajax.php")) return;
        let action = null;
        if (typeof body === "string") {
          action = new URLSearchParams(body).get("action");
        } else if (body instanceof FormData || body instanceof URLSearchParams) {
          action = body.get("action");
        }
        if (!action) return;

        if (!this.responseText || !this.responseText.includes("users")) return;

        const json = JSON.parse(this.responseText);

        if (!json?.data?.users) return;


        latestUsers = json.data.users;

        applySmartLogic();

      } catch (e) {
      }
    });

    return originalSend.apply(this, arguments);
  };

  // ===== LOGIC CHÍNH =====
function applySmartLogic() {
    if (!latestUsers.length) return;
    const activeUser = latestUsers.find(u =>
      u.time_spent && u.time_spent.includes("phút")
    );
    if (!activeUser) {
      return;
    }
    const entered = Number(activeUser.entered_at);
    const shownMinutes = parseInt(activeUser.time_spent);
    if (!entered || isNaN(shownMinutes)) return;
    const localNow = Math.floor(Date.now() / 1000);
    const serverNow = entered + (shownMinutes * 60);
    const offset = serverNow - localNow;
    latestUsers.forEach(user => {
      if (user.time_spent !== "Đạt tối đa") return;
      const enteredAt = Number(user.entered_at);
      if (!enteredAt) return;
      let now = Math.floor(Date.now() / 1000) + offset;
      let diff = now - enteredAt;
      if (diff < 0) diff = 0;
      const minutes = Math.floor(diff / 60);
      //tính ra <= 0 giữ nguyên
      if (minutes <= 0) return;
      updateDOM(user.id, minutes);
    });}
  function updateDOM(userId, minutes) {
    const row = document.querySelector(`.user-row[data-user-id="${userId}"]`);
    if (!row) return;
    const span = row.querySelector(".khai-thac"); if (!span) return;if (span.textContent.trim() === "Đạt tối đa") {span.textContent = minutes + " phút";
    }
  }
  // Theo dõi DOM khi đổi trang
  const observer = new MutationObserver(() => { applySmartLogic();
  }); observer.observe(document.body, {
    childList: true,subtree: true
  });

// ===== CLICK AVATAR =====
(function enableAvatarProfileClick(){
  document.addEventListener("click", function(e){
    const avatarBox = e.target.closest(".avatar-km, img.avatar-50px");
    if(!avatarBox) return;

    const img = avatarBox.querySelector("img.avatar-50px") || avatarBox;
    if(!img || !img.src) return;

    e.preventDefault();
    e.stopPropagation();

    const match = img.src.match(/ultimatemember\/(\d+)\//i);
    if(!match) return;

    const userId = match[1];
    const url = buildUrl(`/profile/${userId}`);
    window.location.href = url;
  }, true);
})();
  (function () {

const CURRENT_VERSION = GM_info.script.version;

const VERSION_URL =
"https://raw.githubusercontent.com/hoathinh3d173820-coder/hh3d-script/main/version.json?t=" + Date.now();


const SCRIPT_URL =
"https://raw.githubusercontent.com/hoathinh3d173820-coder/hh3d-script/main/hh3d.user.js";

async function checkUpdate() {


    try {

        const res = await fetch(VERSION_URL);
        const data = await res.json();
        const latest = data.version;

        if (latest !== CURRENT_VERSION) {

            showToast(`🚀 Script HH3D có phiên bản mới ${latest}`, true);

        }

    } catch (e) {

        console.log("Không check được update");
    }
}

function showToast(message, showButton = false) {
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "30px";
    toast.style.right = "30px";
    toast.style.background = "#1f2937";
    toast.style.color = "#fff";
    toast.style.padding = "14px 18px";
    toast.style.borderRadius = "10px";
    toast.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
    toast.style.zIndex = "999999";
    toast.style.fontSize = "14px";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "10px";
    toast.innerHTML = message;
    if (showButton) {
        const btn = document.createElement("button");
        btn.innerText = "Cập nhật";
        btn.style.background = "#4ade80";
        btn.style.border = "none";
        btn.style.padding = "6px 12px";
        btn.style.borderRadius = "6px";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";
        btn.onclick = () => {
            window.open(SCRIPT_URL, "_blank");

        };
        toast.appendChild(btn);

    }
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();


    }, 20000);
}
window.addEventListener("load", () => {
    setTimeout(checkUpdate, 3000);

});
(function(){

const DATA_URL="https://raw.githubusercontent.com/hoathinh3d173820-coder/tuvi-data/main/data.json";

let TUVI_DATA={};
let MY_TUVI=0;


// ===== LẤY TU VI BẢN THÂN =====
function getMyTuvi(){

const el=document.querySelector("#head_manage_acc");

if(!el) return;

const txt=el.innerText;

const num=txt.replace(/\D/g,"");


MY_TUVI=parseInt(num);

console.log("Tu Vi bản thân:",MY_TUVI);

}


function loadData(){
  fetch(DATA_URL)
    .then(res => res.json())
    .then(data => {
      TUVI_DATA = data;
      console.log("Load data OK");
    })
    .catch(err => console.log("Lỗi load data", err));
}


// ===== TÍNH TỈ LỆ THẮNG =====
function calcWinRate(enemy){

if(!MY_TUVI || !enemy) return 0;

const diff = MY_TUVI - enemy;
const ratio = MY_TUVI / enemy;

let per = 0.3;

// hệ số theo ratio
if(ratio >= 8) per = 1;
else if(ratio >= 7) per = 0.9;
else if(ratio >= 6) per = 0.8;
else if(ratio >= 5) per = 0.7;
else if(ratio >= 4) per = 0.6;
else if(ratio >= 3) per = 0.5;
else if(ratio >= 2) per = 0.4;
// % thay đổi
const bonus = (diff / 1000) * per;

// tỉ lệ thắng
const rate = 50 + bonus;

return Math.round(rate);
}


// ===== LẤY UID =====
function getUserId(img){

const m = img.src.match(/ultimatemember\/(\d+)\//);

return m ? m[1] : null;

}


// ===== CHÈN TU VI =====
function inject(){

document.querySelectorAll(".user-row").forEach(row=>{

if(row.dataset.tuviInjected) return;

const img=row.querySelector(".avatar-50px");

if(!img) return;

const uid=getUserId(img);

if(!uid) return;

const tuvi=TUVI_DATA[uid];

if(!tuvi) return;

const name=row.querySelector(".user-name");



if(!name) return;

const rate = calcWinRate(tuvi);


const div=document.createElement("div");

div.className="tuvi-show";

div.style.fontWeight="bold";

div.style.fontSize="13px";

div.style.color = rate>50 ? "green" : "red";

div.innerText="✨ "+Number(tuvi).toLocaleString()+" ("+rate+"%)";

name.after(div);
row.dataset.tuviInjected=true;
});

}
// ===== RUN =====
getMyTuvi();
loadData();
setInterval(inject,1000);

})();
})();
})();
})();
})();
})();
})();
})();
