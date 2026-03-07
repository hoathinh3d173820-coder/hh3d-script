// ==UserScript==
// @name         HH3D
// @namespace    https://github.com/hoathinh3d173820-coder
// @version      5.0
// @description  Script HH3D
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/hoathinh3d173820-coder/hh3d-script/main/hh3d.user.js
// @downloadURL  https://raw.githubusercontent.com/hoathinh3d173820-coder/hh3d-script/main/hh3d.user.js
// ==/UserScript==
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
menu.innerHTML='<div style="text-align:center;margin-bottom:8px"><img src="'+buildUrl("/wp-content/uploads/2025/05/logo.png")+'" style="max-width:130px;border-radius:6px"></div><div id="autoProfileInfo" style="margin:8px 0;padding:6px;background:#333;border-radius:6px;font-size:13px;line-height:1.4em"><div style="color:#bbb;text-align:center">⏳ Đang tải...</div></div>'+
[["Phúc Lợi","PhucLoi",4],["Thí Luyện","ThiLuyen",3],["Hoang Vực","HoangVuc",5],["Bí Cảnh","BiCanh",5]].map(([t,k,m])=>'<label class="menu-row"><span class="menu-title">'+t+' <span id="count'+k+'" class="menu-count">0/'+m+'</span></span><div class="switch"><input type="checkbox" id="toggle'+k+'"><span class="slider"></span></div></label>').join("")+
'<button id="hapThuBtn" class="hapthu-btn hapthu-hint">✨ Hấp Thụ Linh Thạch</button><label class="menu-row"><span class="menu-title">Tiến Độ</span><div class="switch"><input type="checkbox" id="toggleTienDo"><span class="slider"></span></div></label><div style="margin-top:6px;font-size:12px"><div style="color:#bbb;margin-bottom:2px">🌐 URL web</div><div style="display:flex;align-items:center;gap:6px;width:100%"><input id="domainConfigInput" type="text" placeholder="vd: hoathinh3d.li" style="flex:1;min-width:0;box-sizing:border-box;padding:4px 6px;border-radius:4px;border:1px solid #555;background:#111;color:#fff;font-size:12px"><button id="autoLoginSettingBtn" style="flex:0 0 auto;width:32px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px;border:1px solid #555;background:#222;color:#fff;cursor:pointer;font-size:14px">⚙️</button></div></div>';
document.body.appendChild(menu);
    document.getElementById("autoLoginSettingBtn")
  ?.addEventListener("click", openSettingsPopup);
async function openSettingsPopup() {
  if (document.getElementById("hh3d-setting-popup")) return;
const raw = await GM_getValue(STORAGE_KEY, null);
      
let saved;
if (!raw || !Array.isArray(raw.accounts)) {
  saved = {
    accounts: [],
    activeId: null
  };
  await GM_setValue(STORAGE_KEY, saved);
} else {
  saved = raw;
}
  const popup = document.createElement("div");
  popup.id = "hh3d-setting-popup";
  popup.style.cssText = `position:fixed;top:50%;left:50%; transform:translate(-50%,-50%);background:#fff;color:#000; padding:20px; border-radius:12px;z-index:2147483647;
    width:300px; box-shadow:0 10px 30px rgba(0,0,0,.3);font-family:sans-serif;
  `;
  popup.innerHTML = `
    <h3 style="margin:0 0 12px;text-align:center;"> Auto Login </h3><input id="hh3d-user" placeholder="Username"
      style="width:100%;margin-bottom:8px;padding:8px;border-radius:8px;border:1px solid #ccc;box-sizing:border-box;"><div style="position:relative;margin-bottom:10px;"><input id="hh3d-pass" type="password"
    placeholder="Password"
    style="width:100%;padding:8px 36px 8px 8px;border-radius:8px;border:1px solid #ccc;box-sizing:border-box;">
  <span id="hh3d-toggle-pass" style="position:absolute;right:10px; top:50%;transform:translateY(-50%);
      cursor:pointer; font-size:14px; user-select:none;
    ">👁</span></div>
    <button id="hh3d-add" style="width:100%;padding:8px;border:none;border-radius:8px;background:#28a745;color:#fff;font-weight:bold;cursor:pointer;">➕ Add </button>
    <button id="hh3d-login"
  style="width:100%;margin-top:6px;padding:8px;border:none;border-radius:8px;background:#007bff;color:#fff;font-weight:bold;cursor:pointer;">
   Đăng nhập
</button>
    <div id="hh3d-list"
      style="margin-top:12px;max-height:140px;overflow:auto;"></div>
    <button id="hh3d-close"
      style="width:100%;margin-top:10px;padding:8px;border:none;border-radius:8px;background:#ddd;cursor:pointer;">
      Close
    </button>
  `;
 document.body.appendChild(popup);
const passInput = document.getElementById("hh3d-pass");
const toggleBtn = document.getElementById("hh3d-toggle-pass");
toggleBtn.onclick = () => {
  if (passInput.type === "password") {
    passInput.type = "text";
    toggleBtn.textContent = "🙈";
  } else {
    passInput.type = "password";
    toggleBtn.textContent = "👁";
  }
};
  const listDiv = document.getElementById("hh3d-list");
function renderList() {
  listDiv.innerHTML = "";
  if (!saved.accounts || saved.accounts.length === 0) {
    listDiv.innerHTML = `
      <div style="font-size:12px;color:#777;text-align:center;">
        No accounts saved
      </div>`;
    return;
  }
      
  saved.accounts.forEach(acc => {
    const item = document.createElement("div");
    const isActive = acc.id === saved.activeId;
    item.style.cssText = `
      padding:6px 8px;
      border-radius:6px;margin-bottom:6px; cursor:pointer;
      display:flex;justify-content:space-between;align-items:center; background:${isActive ? "#007bff" : "#f1f1f1"};color:${isActive ? "#fff" : "#000"};font-size:13px;
    `;
    item.innerHTML = ` <span>  ${acc.username}${isActive ? " ✔" : ""}
      </span>  <span class="material-icons" style="cursor:pointer;">delete</span>
    `;
// CLICK cả dòng để active
    item.onclick = async () => {
      saved.activeId = acc.id;
      await GM_setValue(STORAGE_KEY, saved);
      // fill input theo acc được chọn
      document.getElementById("hh3d-user").value = acc.username;
      document.getElementById("hh3d-pass").value = acc.password;
      renderList();
    };
    // Xóa
    item.querySelector("span:last-child").onclick = async (e) => {
      e.stopPropagation();
      saved.accounts = saved.accounts.filter(a => a.id !== acc.id);
      if (saved.activeId === acc.id) {
        saved.activeId = null;
        document.getElementById("hh3d-user").value = "";
        document.getElementById("hh3d-pass").value = "";
      }
      await GM_setValue(STORAGE_KEY, saved);
      renderList();
    };

    listDiv.appendChild(item);
  });
  // Sau khi render xong -> nếu có active thì fill input
  const activeAcc = saved.accounts.find(a => a.id === saved.activeId);
  if (activeAcc) {
    document.getElementById("hh3d-user").value = activeAcc.username;
    document.getElementById("hh3d-pass").value = activeAcc.password;
  }
}
  // ADD ACCOUNT
  document.getElementById("hh3d-add").onclick = async () => {
    const username = document.getElementById("hh3d-user").value.trim();
    const password = document.getElementById("hh3d-pass").value.trim();
    if (!username || !password) return;
    const newAcc = {
      id: Date.now(),
      username,
      password
    };
          
    saved.accounts.push(newAcc);
    saved.activeId = newAcc.id;
    await GM_setValue(STORAGE_KEY, saved);
    document.getElementById("hh3d-user").value = "";
    document.getElementById("hh3d-pass").value = "";
    renderList();
  };
document.getElementById("hh3d-login").onclick = async () => {

  const saved = await GM_getValue(STORAGE_KEY, {
    accounts: [],
    activeId: null
  });

  if (!saved.activeId) {
    showToast("Chưa chọn tài khoản!");
    return;
  }
  // luôn bắt đầu bộ đếm 10s reload
  showToast("Sẽ Hoàn thành sau 10s");
  setTimeout(() => {
    location.reload();
  }, 10000);
  const logoutBtn = document.querySelector('a[href="/my-account/user-logout"]');

  if (logoutBtn) {
    showToast("Đang đăng xuất...");

    await logoutViaIframe();

    showToast("Đang đăng nhập tài khoản mới...");
    setTimeout(() => autoLogin(), 800);

    return;
  }

  showToast("Đang đăng nhập...");
  autoLogin();

};
async function logoutViaIframe() {
  return new Promise(resolve => {

    const iframe = document.createElement("iframe");

        
iframe.style.cssText = `
  position:fixed;
  bottom:0;
  right:0;
  width:1px;
  height:1px;
  border:none;
  opacity:0;
`;

    iframe.src = "/my-account/user-logout";

    document.body.appendChild(iframe);

    iframe.onload = () => {
      console.log("iframe loaded:", iframe.contentWindow.location.href);

      const watcher = setInterval(() => {
        try {
          console.log("iframe url:", iframe.contentWindow.location.href);
        } catch (e) {}
      }, 500);

      setTimeout(() => {
        clearInterval(watcher);
        console.log("iframe logout done");
        resolve();
      }, 2000);
    };

  });
}
  document.getElementById("hh3d-close").onclick = () => popup.remove();
    renderList();
}

  /* ================= TURNSTILE ================= */
  function waitTurnstile() {
    return new Promise(resolve => {
      const timer = setInterval(() => {
        const el = document.querySelector("#cf-turnstile-response");
        if (el && el.value && el.value.length > 20) {
          clearInterval(timer);
          resolve(el.value);
        }
      }, 300);
    });
  }
  /* ================= AUTO LOGIN ================= */
async function autoLogin() {
  const saved = await GM_getValue(STORAGE_KEY, {
    accounts: [],
    activeId: null
  });

      
  if (!saved.activeId) return;

  const activeAcc = saved.accounts.find(a => a.id === saved.activeId);
  if (!activeAcc) return;

  const token = await waitTurnstile();

  const payload = {
    username: activeAcc.username,
    password: activeAcc.password,
    remember: 0,
    cf_turnstile_response: token
  };
  const res = await fetch("/wp-json/hh3d/v1/dang-nhap", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data?.message) showToast(data.message);
  if (res.ok) {
    setTimeout(() => location.reload(), 1500);
  }
}
function isLoggedOut() {
  return document.querySelector("#cf-turnstile-response");
}
let runCount = 0;
const MAX_RUN = 3;
const loginInterval = setInterval(() => {
  runCount++;
  console.log(`interval running: ${runCount}`);
  if (isLoggedOut()) {
    console.log("calling autoLogin");
    autoLogin();
  }

  if (runCount >= MAX_RUN) {
    console.log("stop interval");
    clearInterval(loginInterval);
  }
}, 7500);
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
  const menu=document.getElementById("autoMenu");if(!menu)return;
  let x=localStorage.getItem("autoMenuX"),y=localStorage.getItem("autoMenuY");
  if(x&&y){menu.style.left=x+"px";menu.style.top=y+"px";menu.style.right="auto";menu.style.position="fixed";}
  let drag=false,off=[0,0];
  const getClient=e=>e.touches&&e.touches.length?{x:e.touches[0].clientX,y:e.touches[0].clientY}:{x:e.clientX,y:e.clientY};
  const start=e=>{if(["INPUT","BUTTON","LABEL","SPAN"].includes(e.target.tagName))return;let{ x,y}=getClient(e);drag=true;off=[menu.offsetLeft-x,menu.offsetTop-y];e.preventDefault();};
  const stop=()=>{if(drag){localStorage.setItem("autoMenuX",menu.offsetLeft);localStorage.setItem("autoMenuY",menu.offsetTop);}drag=false;};
  const move=e=>{if(!drag)return;let{ x,y}=getClient(e);menu.style.left=(x+off[0])+"px";menu.style.top=(y+off[1])+"px";menu.style.right="auto";menu.style.position="fixed";e.preventDefault();};
  menu.addEventListener("mousedown",start,true);
  document.addEventListener("mouseup",stop,true);
  document.addEventListener("mousemove",move,true);
  menu.addEventListener("touchstart",start,true);
  document.addEventListener("touchend",stop,true);
  document.addEventListener("touchmove",move,true);})();
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
  <button id="btnLuanVo" class="menu-btn" title="Luận Võ">⚔️</button>
    <button id="btnSeal" class="menu-btn" title="Khắc Trận Văn">🧿</button>
  <button id="btnToastHistory" class="menu-btn" title="Lịch sử thông báo">📜</button>
</div>
`;
menu.appendChild(bottomTools);
// Popup tặng bông
const popupDiv=document.createElement("div");
popupDiv.style="position:fixed;top:120px;right:20px;background:#1e1e1e;border:1px solid #555;border-radius:8px;padding:10px;color:#fff;font-size:14px;z-index:100000;display:none;min-width:200px;";
const savedState=localStorage.getItem("menuCollapsed")==="1";
const collapseBtn=document.createElement("button");
collapseBtn.textContent=savedState?"+":"–";
collapseBtn.style="position:absolute;top:4px;right:4px;background:transparent;color:#fff;border:none;cursor:pointer;font-size:16px;z-index:100000;";
[...menu.children].forEach(ch=>{if(ch!==collapseBtn)ch.dataset.origDisplay=getComputedStyle(ch).display;});
let collapsed=savedState,savedWidth=null;
function applyMenuState(state,instant=false){
  collapsed=state;
  if(collapsed){
    if(!savedWidth)savedWidth=menu.offsetWidth+"px";
    [...menu.children].forEach(ch=>{if(ch!==collapseBtn)ch.style.display="none";});
    menu.style.minWidth=savedWidth;
    collapseBtn.textContent="+";
  }else{
    [...menu.children].forEach(ch=>{if(ch!==collapseBtn)ch.style.display=ch.dataset.origDisplay||"block";});
    menu.style.minWidth="";
    collapseBtn.textContent="–";
  }
  localStorage.setItem("menuCollapsed",collapsed?"1":"0");
}
      
applyMenuState(savedState, true);
menu.appendChild(collapseBtn);
collapseBtn.onclick = () => { applyMenuState(!collapsed);};
menu.appendChild(collapseBtn);
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
    // 🥋 Nhận Luận Võ
    await receiveLuanVoReward();
    await spinLottery();
    showToast("✅ Đã nhận hoạt động + Luận Võ+ Vòng Quay");
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
document.getElementById("btnRewardLV").addEventListener("click", receiveLuanVoReward);
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
  async function getSecurityNonce(url, regex) {
    try {
      const html = await fetch(url, {
          credentials: "include",
        cache: "no-store"
      }).then(r => r.text());
      const m = html.match(regex);
      if (m) return m[1];
    } catch (e) {
      console.error("getSecurityNonce error", e);
    }
    return null;
  }
  async function fetchHapThuNonce() {
    const regex =
      /['"]action['"]\s*:\s*['"]redeem_linh_thach['"][\s\S]*?['"]nonce['"]\s*:\s*['"]([a-f0-9]+)['"]/i;
    const nonce = await getSecurityNonce(
      HAPTHU_PAGE_URL + "?t=" + Date.now(),
      regex
    );
    if (nonce) {
      hapThuNonce = nonce;
      localStorage.setItem("HH3D_REDEEM_NONCE", nonce);
      return true;
    }
    showToast("❌ Không lấy được nonce Hấp Thụ");
    return false;
  }
async function fetchLatestHapThuCode(){
  console.log("[HAPTHU] Fetch code...");
  const fd=new FormData();
  fd.append("action","wpdLoadMoreComments");
  fd.append("sorting","newest");
  fd.append("offset","0");
  fd.append("isFirstLoad","1");
  fd.append("wpdType","post");
  fd.append("postId",HAPTHU_POST_ID);
  fd.append("lastParentId","0");
  const res=await fetch(HAPTHU_COMMENT_API,{method:"POST",credentials:"include",body:fd}).then(r=>r.json());
  if(!res?.data?.comment_list){console.warn("[HAPTHU] Không có comment_list");return null;}
  const div=document.createElement("div");
  div.innerHTML=res.data.comment_list;
  const nodes=div.querySelectorAll(".wpd-comment,.wpd-comment-text");
  for(const cmt of nodes){
    let text=(cmt.innerText||"").replace(/\u00a0/g," ").trim();
    let m=text.match(/code\s*[:：]?\s*([a-z0-9]{4,})/i);
    if(m){
      const code=m[1].toUpperCase();
      showToast(` Bắt được code mới nhất: ${code}`);
      return code;
    }
    const idMatch=(cmt.id||"").match(/wpd-comm-(\d+)_/);
    if(!idMatch) continue;
    const fullText=await fetchFullCommentById(idMatch[1]);
    if(!fullText) continue;
    const ft=fullText.replace(/\u00a0/g," ").trim();
    m=ft.match(/code\s*[:：]?\s*([a-z0-9]{4,})/i);
    if(m){
      const code=m[1].toUpperCase();
      showToast(`🎁 Bắt được code: ${code}`);
      return code;
    }
  }
  console.warn("[HAPTHU] Không tìm thấy code");
  showToast("❌ Không tìm thấy code mới");
  return null;
}
/* ========= REDEEM ========= */
async function redeemHapThu(code) {
  if (!hapThuNonce) {
    showToast("⚠️ Chưa có nonce Hấp Thụ");
    return false;
  }
  const fd = new FormData();
  fd.append("action", "redeem_linh_thach");
  fd.append("code", code);
  fd.append("nonce", hapThuNonce);
  let res;
  try {
    res = await fetch(HAPTHU_REDEEM_API, {
      method: "POST",
      credentials: "include",
      body: fd
    }).then(r => r.json());
  } catch (e) {
    showToast("❌ Lỗi mạng khi hấp thụ");
    return false;
  }
  if (res?.data?.message) {
    showToast(res.data.message);
  } else {
    showToast("⚠️ Không nhận được message từ server");
  }
  // 👉 success hay fail cũng coi là xử lý xong
  return !!res?.success;
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
/* --- fetch + update UI --- */
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
      const luanVo = progress["Luận Võ"] || 0;

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

      /* ===== Luận Võ ===== */
      if (luanVo < 100) {
        console.log("⚔️ Auto BHD: Chạy Luận Võ");

        if (typeof runLuanVoAuto === "function") {
          await runLuanVoAuto();
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
    await receiveLuanVoReward();
    await spinLottery();
    showToast("✅ Đã nhận Hoạt Động + Luận Võ + Vòng Quay");
    localStorage.setItem("ACTIVITY_DONE_DAY", today);
  } catch {
    showToast("❌ Lỗi nhận hoạt động");
  }
  activityRewardRunning = false;
}
    // LẤy TOKEN PHÁP TƯỚNG
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
  await callPtApi("/wp-json/phap-tuong/v1/activate-seal", async (data) => {
    // ❌ LỖI THẬT
    if (!data?.success && !data?.is_pity_failure) {
      showToast(data?.message || "❌ Khắc thất bại", false);
      return;
    }
    // ⚠️ XỊT – PITY
    if (data?.is_pity_failure) {
      showToast(data.message || "🔸 Khắc thất bại (tích lũy)", "warn");
      await loadSealInfo();
      return;
    }
    // ✅ THÀNH CÔNG
    showToast(data.message || "✨ Khắc trận văn thành công!", true);
    await loadSealInfo();
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
document.getElementById("btnActivateSeal").onclick = activateSeal;
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
async function sendBlessing(id) {
  const msg = "🌌 Định mệnh an bài, chúc hai vị đạo hữu bách niên hảo hợp!";

  const res = await callApi({
    action: "hh3d_add_blessing",
    wedding_room_id: id,
    message: msg
  });

  // 👉 CHỈ HIỆN MESSAGE
  showApiMessage("💌 Chúc phúc", id, res?.data);
}

async function openLiXi(id) {
  const res = await callApi({
    action: "hh3d_receive_li_xi",
    wedding_room_id: id
  });

  // 👉 VD: "Chúc mừng đạo hữu nhận được 64 Tinh Thạch!"
  showApiMessage("🧧 Lì xì", id, res?.data);
}

// ================== PARSE PHÒNG CƯỚI (CHUẨN THEO BACKEND) ==================
function parseWeddingRooms(rooms) {
  const blessList = [];
  const giftList = [];

  for (const r of rooms) {
    const id = Number(r.wedding_room_id);
    if (!id) continue;

    const hasBlessed = toBool(r.has_blessed);
    const hasLiXi = toBool(r.has_li_xi);

    // ===== DEBUG LOG =====
    console.log("[WEDDING]", id, {
      hasBlessed,
      hasLiXi,
      has_sent_li_xi: r.has_sent_li_xi
    });

    // ✅ CHƯA CHÚC → CHÚC
    if (!hasBlessed) {
      blessList.push(id);
    }

    // ✅ CÓ LÌ XÌ (true = đang có, cần mở)
    if (hasLiXi) {
      giftList.push(id);
    }
  }

  return { blessList, giftList };
}

// ================== MAIN AUTO ==================
async function runWeddingAuto() {
  try {
    showToast("💒 Tiên Duyên đang chạy...", "info");

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
    for (const id of blessList) {
      showToast(`💌 Đang chúc phòng ${id}`, "info");
      await sendBlessing(id);
      await wait(1500);
    }
    // 6️⃣ MỞ LÌ XÌ
    for (const id of giftList) {
      showToast(`🧧 Đang mở lì xì phòng ${id}`, "info");
      await openLiXi(id);
      await wait(1500);
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
// ========== LUẬN VÕ  – FULL ) ==========
const LV_BASE = buildUrl("/wp-json/luan-vo/v1");
    let LV_RUNNING = false;
let LV_TARGET_LEFT = 0;
const LV_MAX_BATTLES = 5;
let LV_TOKEN = null;
let LV_SENT = 0;
let LV_RECEIVED = 0;
let LV_AUTO_ACCEPT = false;
let currentTarget = null;
    async function getLvTokenFromHome() {
  // lấy security token
  const token = await getSecurityToken(location.href);
  if (!token) throw new Error("NO_SECURITY_TOKEN");
  return token;
}
/* ================== FETCH PAGE + PARSE ================== */
    function extractLvMessage(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (typeof data.message === "string") return data.message;
  if (typeof data.data === "string") return data.data;
  if (typeof data.data?.message === "string") return data.data.message;
  return "";
}
async function fetchLvPageInfo() {
  const url = "/luan-vo-duong?t=" + Date.now();
  const resp = await fetch(url, {
    credentials: "include",
    cache: "no-store"
  });
  if (!resp.ok) {
    throw new Error("Không load được trang Luận Võ");
  }
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  /* ===== PARSE ĐÃ GỬI / ĐÃ NHẬN ===== */
  let sent = 0;
  let received = 0;
  doc.querySelectorAll("p").forEach(p => {
    const t = p.innerText || "";
    if (t.includes("Đã gửi")) {
      const m = t.match(/(\d+)\s*\/\s*5/);
      if (m) sent = Number(m[1]);
    }
    if (t.includes("Đã nhận")) {
      const m = t.match(/(\d+)\s*\/\s*5/);
      if (m) received = Number(m[1]);
    }
  });
  /* ===== AUTO ACCEPT ===== */
  const autoAccept =
    doc.querySelector("#auto_accept_toggle")?.checked || false;
  /* ===== CẦN JOIN HAY KHÔNG ===== */
  const needJoin = !!doc.querySelector("#joinBattleImg");
  /* ===== CÓ THƯỞNG HAY KHÔNG ===== */
  const hasReward = !!doc.querySelector("#receive-reward-btn");
  return {sent,received,autoAccept, needJoin, hasReward};}
let LV_NEED_JOIN = false;
    async function joinLuanVoBattle() {
  const securityToken = await getSecurityToken(location.href);
  if (!securityToken) {
    showToast("❌ Không lấy được security token");
    return false;
  }
  const resp = await fetch(LV_BASE + "/join-battle", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "X-WP-Nonce": getWpNonce()
    },
    body: JSON.stringify({
      action: "join_battle",
      security_token: securityToken
    })
  });
  const data = await resp.json();
  console.log("[LV] join-battle:", data);
  if (data.success) {
    showToast("✅ Đã gia nhập Luận Võ");
    return true;
  }
  showToast("⚠️ Không join được Luận Võ");
  return false;
}
async function ensureLvContext() {
  //  lấy trạng thái
  const info = await fetchLvPageInfo();
  //  lấy token từ trang chủ
  if (!LV_TOKEN) {
    try {
      LV_TOKEN = await getLvTokenFromHome();
      console.log("[LV] dùng security_token làm x-lv-token");
    } catch (e) {
      console.warn("[LV] không lấy được security_token");
    }
  }
  LV_SENT = info.sent;
  LV_RECEIVED = info.received;
  LV_AUTO_ACCEPT = info.autoAccept;
  LV_NEED_JOIN = info.needJoin;
  return info;
}
/* ================== FETCH CORE ================== */
async function lvFetch(url, body = {}) {
  if (!LV_TOKEN) {
    await ensureLvContext();
  }
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "X-WP-Nonce": getWpNonce(),
      "x-lv-token": LV_TOKEN
    },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  const msg = extractLvMessage(data);
  // ❌ token hết hạn / sai
  if (msg.includes("token") || msg.includes("x-lv-token")) {
    console.warn("[LV] token lỗi → refresh từ trang chủ");
    LV_TOKEN = null;
    await ensureLvContext();
    return lvFetch(url, body);
  }
  return data;
}
/* ================== AUTO ACCEPT ================== */
async function ensureAutoAccept() {
  if (LV_AUTO_ACCEPT) {
    showToast("👌 Tự động chấp nhận đã bật");
    return;
  }
  const data = await lvFetch(LV_BASE + "/toggle-auto-accept", {});
  if (data.success) {
    showToast("✅ Đã bật Tự động chấp nhận");
    LV_AUTO_ACCEPT = true;
  } else {
    showToast("❌ Không bật được Tự động chấp nhận");
  }
}
/* ================== USERS ================== */
const getFollowingUsers = (page = 1) =>
  lvFetch(LV_BASE + "/get-following-users", { page });
const getOnlineUsers = () =>
  lvFetch(LV_BASE + "/online-users", {});
/* ================== COMBAT ================== */
async function autoApproveChallenge(challengeId, targetUserId) {
  return lvFetch(LV_BASE + "/auto-approve-challenge", {
    challenge_id: String(challengeId),
    target_user_id: String(targetUserId)
  });
}
    async function cancelChallenge(targetUserId, challengeId) {
  return lvFetch(LV_BASE + "/cancel-challenge", {
    target_user_id: String(targetUserId),
    challenge_id: String(challengeId)
  });
}

    async function getSentChallengeIdByUser(targetUserId) {
  const resp = await lvFetch(LV_BASE + "/get-sent-challenges", {});
  if (!resp?.success || !resp?.data?.html) return null;

  const html = resp.data.html;
  const doc = new DOMParser().parseFromString(html, "text/html");

  const btn = doc.querySelector(
    `.reject-request[data-user-id="${String(targetUserId)}"]`
  );
  if (!btn) return null;

  const cid = btn.getAttribute("data-challenge-id");
  console.log("[LV] found sent challenge:", targetUserId, cid);
  return cid || null;
}

async function challengeUser(userId, userName) {
  const resp = await lvFetch(LV_BASE + "/send-challenge", {
    target_user_id: String(userId)
  });
  const msg = extractLvMessage(resp);
  // ❌ hết lượt mình
  if (msg.includes("đã gửi tối đa")) {
    showToast("🏁 Đã đủ 5/5 — dừng auto");
    LV_RUNNING = false;
    return;
  }
if (!resp.success) {
  // Case: đã gửi khiêu chiến trước đó
  if (msg.includes("đã gửi khiêu chiến")) {
    showToast("♻️ Đã gửi trước đó → lấy danh sách để hủy");

    const oldChallengeId = await getSentChallengeIdByUser(userId);
    if (oldChallengeId) {
      const cancel = await cancelChallenge(userId, oldChallengeId);
      if (cancel?.success) {
        showToast("✅ Đã hủy challenge cũ → gửi lại");
        await new Promise(r => setTimeout(r, 800));
        return challengeUser(userId, userName); // gửi lại
      } else {
        showToast("❌ Hủy challenge thất bại → bỏ target");
        currentTarget = null;
        return huntLuanVoTargets();
      }
    } else {
      showToast("⚠️ Không tìm thấy challenge đã gửi → bỏ target");
      currentTarget = null;
      return huntLuanVoTargets();
    }
  }

  // Các lỗi khác
  showToast("❌ Gửi fail — làm lại");
  currentTarget = null;
  return huntLuanVoTargets();
}

  const challengeId = resp.data?.challenge_id;
  if (!challengeId) return;
  showToast(`Gửi Khiêu chiến ${userName} còn(${LV_TARGET_LEFT}lượt)`);
setTimeout(async () => {
  try {
    const result = await autoApproveChallenge(challengeId, userId);
    if (result?.success) {
      showToast(result.data?.message || "⚔️ Hoàn tất Luận Võ");
      LV_SENT++;
      LV_TARGET_LEFT--;
    }
  } catch (e) {
    showToast("❌ Lỗi nhận kết quả Luận Võ");
  }
  attackCurrentTarget();
}, 4400);
}
/* ================== TARGET SCAN ================== */
async function huntLuanVoTargets() {
  if (!LV_RUNNING) return;
  if (currentTarget) {
    return attackCurrentTarget();
  }
  const res = await getFollowingUsers(1);
  if (!res.success) {
    showToast("❌ Không lấy được danh sách follow");
    return;
  }
  const users = res.data?.users || [];
  const target = users.find(u => Number(u.can_receive_count) > 0);
  if (!target) {
    showToast("⚠️ Follow full — chuyển ONLINE");
    return huntFromOnline();
  }
  currentTarget = target;
  // số lượt đánh = min(lượt mình còn, lượt nó nhận được)
  LV_TARGET_LEFT = Math.min(
    target.can_receive_count,
    LV_MAX_BATTLES - LV_SENT
  );
  showToast(`🎯 Chọn ${target.name} còn(${LV_TARGET_LEFT}lượt)`);
  attackCurrentTarget();
}
async function attackCurrentTarget() {
  if (!LV_RUNNING) return;
  // ✅ đủ 5 lượt → STOP
  if (LV_SENT >= LV_MAX_BATTLES) {
    showToast("🏁 Đã đủ 5/5 — dừng auto");
    LV_RUNNING = false;
    return;
  }
  // ❌ target hết lượt → chuyển online
  if (LV_TARGET_LEFT <= 0) {
    showToast("🔄 Target hết lượt — chuyển ONLINE");
    currentTarget = null;
    return huntFromOnline();
  }
  await challengeUser(currentTarget.id, currentTarget.name);
}
async function huntFromOnline() {
  if (currentTarget) return attackCurrentTarget();
  const res = await getOnlineUsers();
  if (!res.success) return;
  const users = res.data?.users || [];
  const t = users.find(u => Number(u.challenges_remaining) > 0);
  if (!t) {
    showToast("😴 Online full — nghỉ 60s");
    return setTimeout(huntLuanVoTargets, 60000);
  }
  currentTarget = t;
  LV_TARGET_LEFT = Math.min(
    t.challenges_remaining,
    LV_MAX_BATTLES - LV_SENT
  );
  showToast(`⚔️ Online: ${t.name} còn(${LV_TARGET_LEFT}lượt)`);
  attackCurrentTarget();
}
/* ================== MAIN ================== */
async function runLuanVoAuto() {
  try {
      LV_RUNNING = true;
    currentTarget = null;
    LV_TARGET_LEFT = 0;
    let info = await ensureLvContext();
    showToast(`📊 Đã gửi: ${info.sent}/5 | Đã nhận: ${info.received}/5`);
    if (info.needJoin) {
      showToast("⚔️ Chưa tham gia Luận Võ — đang TG...");
      const joined = await joinLuanVoBattle();
      if (!joined) {
        showToast("❌ Join thất bại — dừng auto");
        return;
      }
      await new Promise(r => setTimeout(r, 1500));
      info = await ensureLvContext();
      if (info.needJoin) {
        showToast("❌ Join chưa thành công — thử lại sau");
        return;
      }
      showToast("✅ TG thành công — tiếp tục ");
    }
    if (info.sent >= LV_MAX_BATTLES) {
      showToast("🏆 Hôm nay đã đủ 5/5");
      return;
    }
    await ensureAutoAccept();
    showToast("🔍 Bắt đầu auto Luận Võ...");
    await huntLuanVoTargets();
  } catch (e) {
    showToast("❌ Lỗi Luận Võ: " + e.message);
  }
}
/* ================== BUTTON ================== */
document.getElementById("btnLuanVo") ?.addEventListener("click", runLuanVoAuto);
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
    // VÒNG QUAY
const SPIN_API = buildUrl("/wp-json/lottery/v1/spin");
async function spinLottery(times) {
  try {
    const securityToken = await getSecurityToken(location.href);
    if (!securityToken) {
      showToast("❌ Không lấy được security token");
      return;
    }
    const wpNonce = localStorage.getItem("HH3D_NONCE_WP") || "";
    times = Number(times);
    if (!times || times < 1) times = 4;
    for (let i = 1; i <= times; i++) {
  const resp = await fetch(SPIN_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WP-Nonce": wpNonce,
      "x-security-token": securityToken
    },
    credentials: "include"
  });
  const data = await resp.json();
  if (!data.success) {
    showToast(`❌ ${data.message || "Quay lỗi"}`);
    break;
  }
  showToast(`🎉 ${data.message}`);
  await sleep(600);
}
  } catch (e) {
  }
}
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
// ===== API SHOP & URL HOANG VỰC =====
const SHOP_API = buildUrl("/wp-content/themes/halimmovies-child/hh3d-ajax.php");
const HOANG_VUC = buildUrl("/hoang-vuc");
const shopNoncePatterns = [
  {
    name: "purchase_item_shop_boss",
    regex: /action\s*:\s*['"]purchase_item_shop_boss['"][\s\S]*?nonce\s*:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i
  }
];
async function getShopNonce() {
  try {
    const resp = await fetch(HOANG_VUC, { credentials: "include" });
    const html = await resp.text();
    for (const pat of shopNoncePatterns) {
      const m = html.match(pat.regex);
      if (m) {
        return m[1];
      }
    }
  } catch (e) {
  }
  return null;
}
// ===== HÀM MUA RƯƠNG LINH BẢO =====
async function buyRuongLB() {
  try {
    let nonce = await getShopNonce();
    if (!nonce) {
      showToast("❌ Không tìm thấy nonce từ Hoang Vực");
      return;
    }
    let payload = new URLSearchParams({
      action: "purchase_item_shop_boss",
      item_id: "ruong_linh_bao",
      item_type: "tinh_thach",
      quantity: "5",
      nonce: nonce
    });
  let resp = await fetch(SHOP_API, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
  body: payload,
  credentials: "include"
});
let data = await resp.json();
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
  showToast("❌ Lỗi kết nối khi mua pháp bảo");
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
  running: false,selectedMineId: null,selectedMineName: null,selectedType: null,timer: null,checkMinutes: 5,enableTakeover: false,enableAttack : false};
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
  attack_user_in_mine: /action:\s*['"]attack_user_in_mine['"][\s\S]*?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  load_mines_by_type: /action:\s*['"]load_mines_by_type['"][\s\S]*?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  get_users_in_mine:  /action:\s*['"]get_users_in_mine['"][\s\S]*?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  enter_mine:         /action:\s*['"]enter_mine['"][\s\S]*?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  claim_reward_km:    /action:\s*['"]claim_reward_km['"][\s\S]*?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  claim_mycred_reward:/action:\s*['"]claim_mycred_reward['"][\s\S]*?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  change_mine_owner:  /action:\s*['"]change_mine_owner['"][\s\S]*?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  buy_item_khoang:    /action:\s*['"]buy_item_khoang['"][\s\S]*?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
  refresh_attack_count:/action:\s*['"]refresh_attack_count['"][\s\S]*?nonce:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i,
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
    async function buyBatQuai() {
  const security = await getSecurity("buy_item_khoang");
  await sleep(500);

  const fd = new FormData();
  fd.append("action", "buy_item_khoang");
  fd.append("item_id", "1"); // 🔮 Bát Quái
  fd.append("security", security);

  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  const msg =
    res?.message ||
    res?.data?.message ||
    "Mua Bát Quái thất bại";
  if (res?.success) {
    akLog(`🔮 ${msg}`);
  } else {
    akLog(`❌ ${msg}`);
  }
  return res;
}
async function buyAnThan() {
  const security = await getSecurity("buy_item_khoang");
  await sleep(500);
  const fd = new FormData();
  fd.append("action", "buy_item_khoang");
  fd.append("item_id", "2"); // 🥷 Ẩn Thân
  fd.append("security", security);
  const res = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    body: fd
  }).then(r => r.json());
  const msg =
    res?.message ||
    res?.data?.message ||
    "Mua Ẩn Thân thất bại";
  if (res?.success) {
    akLog(`🥷 ${msg}`);
  } else {
    akLog(`❌ ${msg}`);
  }
  return res;
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
</div>
<div class="ak-bad-header">
  <span>🚫 Danh sách né đánh</span>
  <div style="display:flex; gap:4px; align-items:center;">
    <input id="akBadInput" placeholder="Nhập ID..." style="width:80px;font-size:12px">
    <button id="akBadAdd" title="Thêm">➕</button>
    <button id="akBuyBatQuai" title="Mua Bát Quái">Mua BQ</button>
      <button id="akBuyAnThan" title="Mua Ẩn Thân">Mua AT</button>
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
#akBuyBatQuai, #akBuyAnThan{background:#1b2230;border:1px solid #2b3445; color:#caa7ff;border-radius:4px;cursor:pointer;padding:2px 6px;}
#akBuyBatQuai:hover, #akBuyAnThan:hover{background:#263149;}`);
// ================== EVENTS ==================
const badAddBtn = popup.querySelector("#akBadAdd");
const badInput = popup.querySelector("#akBadInput");
const buyBQBtn = popup.querySelector("#akBuyBatQuai");
const buyAnThanBtn = popup.querySelector("#akBuyAnThan");
buyBQBtn.onclick = async () => {
  await buyBatQuai();
};
buyAnThanBtn.onclick = async () => {
  await buyAnThan();
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
    AK.timer = setTimeout(loop, delayMin * 60 * 1000);
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
  akLog("⚠ Không lấy được dữ liệu mỏ → vẫn tiếp tục vòng sau");
  return gotoNextLoop();
}
      // ===== INFO =====
      const info = res.data || {};
      const bonus = info.bonus_percentage ?? 0;
      const bonusMin = +localStorage.getItem(STORAGE_BONUS_MIN) || 100;
      akLog(`ℹ Bonus hiện tại: ${bonus}%`);
let finishedCombat = false;
let didAttackSomething = false;
let abortCombat = false;
// ===== AUTO ĐÁNH =====
if (AK.enableAttack && Array.isArray(info.users)) {
const badIds = getBadEnemies();
const enemies = info.users.filter(
  u =>
    u.id &&
    !badIds.includes(String(u.id)) &&
    u.lien_minh === false &&
    u.dong_mon === false
);
         
if (abortCombat || !AK.enableAttack || !AK.running) {
  akLog("⛔ Đã tắt auto đánh → bỏ qua combat vòng này");
  gotoNextLoop();
  return;
}
  if (enemies.length > 15) {
    akLog(`⚠ ${enemies.length} địch → quá đông, bỏ đánh`);
    return gotoNextLoop();
  }
  if (enemies.length === 0) {
    akLog("✅ Không còn địch hợp lệ → bỏ đánh");
    finishedCombat = true;
  }
  if (!finishedCombat) {
    akLog(`⚔ Phát hiện ${enemies.length} địch → bắt đầu đánh`);
 for (const enemy of enemies) {
  if (!AK.running) break;
  let loseCount = 0;
while (AK.running) {
  // ⚔ ĐÁNH NGAY
  let atk = await callWithRetry(
    attackUserInMine,
    [enemy.id, AK.selectedMineId]
  );
  didAttackSomething = true;
  const msg = atk?.message || atk?.data?.message || "";
  // 🚨 DÍNH RATE LIMIT / PHONG ẤN
  if (
    msg.includes("thao tác quá nhanh") ||
    msg.includes("phong ấn")
  ) {
    akLog("🚫 Bị giới hạn thao tác / phong ấn → DỪNG AUTO NGAY");
    stopAuto();
    return;
  }
       
  // 🚫 HẾT LƯỢT ĐÁNH
  if (
    atk?.success === false &&
    msg.includes("giới hạn tấn công")
  ) {
    akLog("🔄 Hết lượt đánh → refresh");
    const ref = await callWithRetry(refreshAttackCount);
    const refMsg = ref?.message || ref?.data?.message || "";
    if (!ref?.success) {
      if (refMsg.includes("giới hạn làm mới")) {
        akLog("⛔ Tắt auto đánh để ngưng");
        AK.enableAttack = false;
        localStorage.setItem(STORAGE_ATTACK, "0");
        document.getElementById("akAttack")?.classList.remove("active");
        abortCombat = true;
        finishedCombat = true;
        break; // thoát while
      } else {
        akLog("🛑 Không refresh được lượt → dừng đánh");
        abortCombat = true;
        finishedCombat = true;
        break;
      }
    }
    // ⏳ CHỜ 5.5s RỒI ĐÁNH TIẾP
    akLog("⏳ Chờ 5s rồi đánh tiếp...");
    await sleep(ATTACK_COOLDOWN);
    continue;
  }
  // ❌ THUA
  if (
    atk?.data?.result === "lose" ||
    msg.includes("thiếu chút nữa")
  ) {
    loseCount++;
    akLog(`❌ Thua ${loseCount}/3 với ID ${enemy.id}`);
    if (loseCount >= 3) {
      akLog(`🚫 Thua 3 lần → thêm vào danh sách né: ${enemy.id}`);
      addBadEnemy(enemy.id);
      renderBadEnemyList();
      break; // bỏ thằng này
    }
    // ⏳ CHỜ 5.5s RỒI ĐÁNH LẠI
    akLog("⏳ Chờ cooldown rồi đánh lại...");
    await sleep(ATTACK_COOLDOWN);
    continue;
  }
  // ✅ THẮNG hoặc case khác → thoát để refresh mỏ
  break;
}
if (abortCombat) break; // 🔴 thoát luôn vòng for enemies
// sau khi xử lý xong 1 enemy → chờ rồi check lại mỏ
await sleep(ATTACK_COOLDOWN);
  const re = await getUsersInMine(AK.selectedMineId);
  if (!re?.success) break;
  const info2 = re.data || {};
  const bonus2 = info2.bonus_percentage ?? 0;
  if (bonus2 >= 100) {
    akLog("🎯 Bonus đã 100% → ngưng đánh");
    finishedCombat = true;
    break;
  }
  const remainEnemies = (info2.users || []).filter(
    u =>
      u.id &&
      !badIds.includes(String(u.id)) &&
      u.lien_minh === false &&
      u.dong_mon === false
  );
  if (remainEnemies.length === 0) {
    akLog("✅ Hết địch trong mỏ");
    finishedCombat = true;
    break;
  }
}
  }
}
   // ===== REFRESH TRẠNG THÁI TRƯỚC KHI XỬ LÝ =====
let curInfo = info;
let curBonus = bonus;
let curInMine = isMeInMine(info);
// nếu có đánh hoặc bonus gần ngưỡng → refresh
if (AK.enableAttack || bonus >= bonusMin - 5) {
  akLog("🔄 Refresh mỏ trước khi xử lý...");
  const re = await getUsersInMine(AK.selectedMineId);
  if (re?.success) {
    curInfo = re.data || {};
    curBonus = curInfo.bonus_percentage ?? 0;
    curInMine = curInfo.is_in_mine === true;
    akLog(`ℹ Bonus cập nhật: ${curBonus}%`);
  }
}
// ===== ĐANG NGỒI MỎ =====
if (curInMine) {

  const TAKE_MIN = 30;
  const TAKE_MAX = 80;

  // 🔄 Check lại mỏ lần nữa cho chắc
  const check = await callWithRetry(
    getUsersInMine,
    [AK.selectedMineId]
  );

  if (!check?.success) {
    akLog("⚠ Không check được mỏ");
    return gotoNextLoop();
  }

  let bonusNow = check.data?.bonus_percentage ?? 0;
  let meInMine = isMeInMine(check.data);

  akLog(`📊 Bonus hiện tại: ${bonusNow}%`);

  // ===== NẰM TRONG VÙNG 30-80% =====
  if (
    AK.enableTakeover &&
    bonusNow >= TAKE_MIN &&
    bonusNow <= TAKE_MAX
  ) {
// 🗡 LUÔN ĐOẠT TRƯỚC (nếu bật takeover)
akLog("🗡 Trong vùng xử lý → đoạt mỏ");
const tk = await callWithRetry(
  takeoverMine,
  [AK.selectedMineId]
);
if (tk?.success) {
  await sleep(1200);
}
    // 🧿 MUA BÙA SAU
    akLog("🧿 Mua Linh Quang Phù");
    await callWithRetry(buyLingQuangPhu);
    await sleep(1200);
    // 🔄 CHECK LẠI BONUS
    const re = await callWithRetry(
      getUsersInMine,
      [AK.selectedMineId]
    );
    if (!re?.success) return gotoNextLoop();
    bonusNow = re.data?.bonus_percentage ?? 0;
    akLog(`✨ Bonus sau xử lý: ${bonusNow}%`);
  }

  // ===== CLAIM CUỐI =====
  if (bonusNow >= bonusMin) {
    akLog("🎁 Đủ bonus → nhận thưởng");
    const claim = await callWithRetry(
      claimReward,
      [AK.selectedMineId]
    );
    if (!claim?.success) {
      const msg = claim?.message || "";
      if (msg.includes("đạt đủ thưởng")) {
        akLog("🛑 Hết lượt ngày → dừng auto");
        stopAuto();
        return;
      }
    }
  } else {
    akLog(`⏳ Chưa đủ bonus (${bonusNow}%/${bonusMin}%)`);
  }
  return gotoNextLoop();
}
// ===== CHƯA NGỒI MỎ =====
else {
  akLog("🟢 Chưa ngồi mỏ → vào mỏ ngay");
  const enter = await callWithRetry(
    enterMine,
    [AK.selectedMineId]
  );
  // enterMine đã tự log → chỉ xử lý case đặc biệt
  if (!enter?.success) {
    const msg = enter?.message || enter?.data?.message || "";
    if (msg.includes("đạt đủ thưởng")) {
      akLog("🛑 Hết lượt ngày → dừng auto");
      stopAuto();
      return;
    }
    akLog("⚠️ Vào mỏ thất bại → thử lại vòng sau");
  }
} } catch (e) {
      akLog("❌ Lỗi auto: " + e.message);
    }
    AK.timer = setTimeout(loop, AK.checkMinutes * 60 * 1000);
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
async function receiveLuanVoReward() {
  try {const info = await fetchLvPageInfo(); if (!info.hasReward) {
      showToast("🎁 Chưa có thưởng để nhận");
      return;
    }
    const securityToken = await getSecurityToken(location.href);
    if (!securityToken) {
      showToast("❌ Không lấy được security token");
      return;
    }
    const resp = await fetch(LV_BASE + "/receive-reward", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-WP-Nonce": getWpNonce(),
        "x-lv-token": securityToken
      },
      body: "{}"
    });
    const data = await resp.json();
    let msg =
      data?.data?.message ||
      data?.message ||
      JSON.stringify(data, null, 2);
    showToast(msg);
  } catch (e) {
    showToast("❌ Lỗi nhận thưởng: " + e.message);
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
const ACTIVITY_API = buildUrl("/wp-admin/admin-ajax.php");
async function claimActivityReward(stage) {
  try {
    const securityToken = await getSecurityToken(location.href);
    if (!securityToken) {
      showToast("❌ Không lấy được security token");
      return;
    }
    const resp = await fetch(ACTIVITY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      credentials: "include",
      body: new URLSearchParams({
        action: "daily_activity_reward",
        stage: stage,
        security_token: securityToken
      })
    });
    const data = await resp.json();
    if (data?.data?.message) {
      showToast(` ${data.data.message}`);
    } else if (data?.message) {
      showToast(` ${data.message}`);
    } else {
      showToast(`⚠️ Không có phản hồi (stage: ${stage})`);
    }
  } catch (e) {
    showToast(`❌ Lỗi nhận rương ${stage}: ${e.message}`);
  }
}
async function claimAllActivityRewards() {
    await claimActivityReward("stage1");
    await new Promise(r => setTimeout(r, 1000));
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
    const resp = await fetch("https://hoathinh3d.ai/nhiem-vu-hang-ngay/",{
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
          <b style="color:${color}">${value}%</b>
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
      "Luận Võ",
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
// HIỆN THÔNG TIN MỎ
(function HH3D_MINE_UI_STABLE() {
    let LAST_MINE_DATA = null;
    let BATQUAI_FIXED = false;
    // VẼ UI – INFO
    function renderStats(data) {
        if (!data || !data.users) return;
        const bonus_display = document.querySelector('#bonus-display');
        const batquai_section = document.querySelector('#batquai-section');
        const pagination = document.querySelector('.pagination');
        const page_indicator = document.querySelector('#page-indicator');
        if (!bonus_display) return;
        let enemies = 0;
        let dongMon = 0;
        let lienMinh = 0;
        data.users.forEach(u => {
            if (u.dong_mon) dongMon++;
            else if (u.lien_minh) lienMinh++;
            else enemies++;
        });
        let info = bonus_display.querySelector('.hh3d-mine-info');
        if (!info) {
            info = document.createElement('div');
            info.className = 'hh3d-mine-info';
            info.style.fontSize = '11px';
            info.style.marginTop = '2px';
            info.style.lineHeight = '1.4';
            bonus_display.prepend(info);
        }
        info.innerHTML = `<div>🩸 Kẻ địch: <b>${enemies}</b></div><div>🤝 Liên minh: <b>${lienMinh}</b></div><div>☯️ Đồng môn: <b>${dongMon}</b></div><div>⚔️ Lượt còn lại: <b>${data.attacks_left ?? 0}</b></div>`;
        [bonus_display, batquai_section, pagination, page_indicator].forEach(el => {
            if (!el) return;
            el.style.setProperty('display', 'block', 'important');
        });
    }
    // BÁT QUÁI
    function fixBatQuaiOnce(data) {
        if (BATQUAI_FIXED) return;
        if (!data || typeof data.bat_quai_tran_do_count !== 'number') return;
        const section = document.querySelector('#batquai-section');
        if (!section) return;
        const target = Array.from(section.querySelectorAll('span, div'))
            .find(el => /\d+\s*\/\s*8/.test(el.textContent));
        if (!target) return;
        target.textContent = `${data.bat_quai_tran_do_count}/8`;
        BATQUAI_FIXED = true;
    }
    // HANDLER DATA
    function handleMineData(data) {
        LAST_MINE_DATA = data;
        BATQUAI_FIXED = false;
        renderStats(data);
        // delay nhẹ để đợi UI render xong
        setTimeout(() => fixBatQuaiOnce(data), 300);
        setTimeout(() => fixBatQuaiOnce(data), 800);
    }
    // XHR HOOK
    const _open = XMLHttpRequest.prototype.open;
    const _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
        this.__hh3d_url = url;
        return _open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (body) {
        this.addEventListener('load', () => {
            try {
                if (
                    this.__hh3d_url?.includes('ajax') &&
                    typeof body === 'string' &&
                    body.includes('action=get_users_in_mine')
                ) {
                    const json = JSON.parse(this.responseText);
                    if (json?.success && json?.data) { handleMineData(json.data);
                    }
                } } catch (e) {console.error('[HH3D] parse error', e); } });return _send.apply(this, arguments);};
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
  lastScan: 0
};

  const KM_STATE = {
    currentMineId: null
  };
  // UTILS
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
  // QUÉT SECURITY TỪ DOM
  function scanSecurityFromDOM() {
    const html = document.documentElement.innerHTML;
const mMine = html.match(/action:\s*['"]get_users_in_mine['"][\s\S]*?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i);
if (mMine?.[1]) {
  KM_SEC.mine_security = mMine[1];
}
    const m1 = html.match(/action:\s*['"]attack_user_in_mine['"][\s\S]*?security:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i);
    if (m1?.[1]) {
      KM_SEC.attack_security = m1[1];
    }
    const m2 = html.match(/action:\s*['"]refresh_attack_count['"][\s\S]*?nonce:\s*['"]([A-Za-z0-9\-_]{6,80})['"]/i);
    if (m2?.[1]) {
      KM_SEC.refresh_nonce = m2[1];
    }
    const token =
      html.match(/"securityToken"\s*:\s*"([^"]+)"/i)?.[1] ||
      html.match(/security_token["']?\s*[:=]\s*["']([^"']+)/i)?.[1];
    if (token) {
      KM_SEC.token = token;
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
        if (bodyText.includes("action=get_users_in_mine")) {
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
  fd.append("action", "get_users_in_mine");
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
  fd.append("action", "attack_user_in_mine");
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
  fd.append("action", "refresh_attack_count");
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
  title.style.cssText = `font-weight:700;color:#00eaff;margin-bottom:8px;
  `;
  title.textContent = `Danh sách địch (${list.length}) - Đã chọn: 0`;
  box.appendChild(title);
  const selected = new Set();
  list.forEach((user, index) => {
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

  <div style="flex:1">
    <div style="font-weight:600;color:#fff">
      ${user.name}
    </div>

    <div style="font-size:12px;color:#00c2ff">
      ${user.tongName || "Tán Tu"}
    </div>

    <div style="font-size:12px;color:#aaa">
      ${user.time_spent || ""}
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
        if (body instanceof FormData) {
          action = body.get("action");
        } else if (typeof body === "string") {
          const params = new URLSearchParams(body);
          action = params.get("action");
        }
        if (action !== "get_users_in_mine") return;
        const json = JSON.parse(this.responseText);
        if (!json?.data?.users) return;
        latestUsers = json.data.users;
        setTimeout(applySmartLogic, 300);
      } catch (e) {
      }
    });
    return originalSend.apply(this, arguments);
  };
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


// ===== LOAD DATA =====
function loadData(){

GM_xmlhttpRequest({

method:"GET",
url:DATA_URL,

onload:function(res){

try{

TUVI_DATA = JSON.parse(res.responseText);

}catch(e){

console.log("Lỗi đọc data.json");

}

}

});

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

div.style.color = rate>50 ? "blue" : "red";

div.innerText="✨ "+Number(tuvi).toLocaleString()+" ("+rate+"%)";

name.after(div);
row.dataset.tuviInjected=true;
});

}
// ===== RUN =====
getMyTuvi();
loadData();
setInterval(inject,1000);
"use strict";

const TOKEN="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";
const OWNER="hoathinh3d173820-coder";
const REPO="tuvi-data";
const FILE="data.json";
const CLAN_URL="/danh-sach-thanh-vien-tong-mon";

const COOLDOWN=5*60*1000;
const LAST_UPDATE_KEY="tuvi_last_update";

// ===== COOLDOWN =====
function canRun(){

const last=localStorage.getItem(LAST_UPDATE_KEY);

if(!last) return true;

const diff=Date.now()-parseInt(last);

if(diff<COOLDOWN){

console.log("⏳ Cooldown:",Math.round((COOLDOWN-diff)/1000),"giây");

return false;

}

return true;

}

// ===== LẤY TU VI =====
function getTuviData(doc){

const data={};

const rows=doc.querySelectorAll("tr[data-id]");

console.log("Tìm thấy thành viên:",rows.length);

rows.forEach(row=>{

const id=row.getAttribute("data-id");

const tuviEl=row.querySelector(".display-show-red b");

if(!tuviEl) return;

const tuvi=parseInt(tuviEl.innerText.replace(/\D/g,""));

data[id]=tuvi;

});

return data;

}


// ===== UPDATE GITHUB =====
function updateGithub(newData){

const url=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`;

GM_xmlhttpRequest({

method:"GET",
url:url,

headers:{
"Authorization":"token "+TOKEN
},

onload:function(res){

let sha=null;
let oldData={};

try{

if(res.status===200){

const file=JSON.parse(res.responseText);

sha=file.sha;

oldData=JSON.parse(
atob(file.content.replace(/\n/g,""))
);

console.log("📦 Data cũ:",oldData);

}else if(res.status===404){

console.log("📁 File chưa tồn tại -> sẽ tạo mới");

}

}catch(e){

console.log("⚠ Lỗi đọc file GitHub");

}

const merged={...oldData};
let changed=false;

// ===== UPDATE MEMBER =====
Object.keys(newData).forEach(id=>{

if(!oldData[id] || oldData[id]!==newData[id]){

merged[id]=newData[id];
changed=true;

}

});



if(!changed){

console.log("⚡ Không có thay đổi");

return;

}

console.log("📊 Có thay đổi -> update GitHub");


const content=btoa(
unescape(
encodeURIComponent(
JSON.stringify(merged,null,2)
)
)
);

const body={
message:"auto update tuvi",
content:content
};

if(sha) body.sha=sha;

GM_xmlhttpRequest({

method:"PUT",
url:url,

headers:{
"Authorization":"token "+TOKEN,
"Content-Type":"application/json"
},

data:JSON.stringify(body),

onload:function(){

console.log("✅ Update GitHub thành công");

localStorage.setItem(LAST_UPDATE_KEY,Date.now());

},

onerror:function(){

console.log("❌ Lỗi update GitHub");

}

});

}

});

}


// ===== FETCH TRANG TÔNG =====
function fetchClanPage(){

console.log("🚀 Fetch trang tông môn...");

fetch(CLAN_URL)

.then(r=>r.text())

.then(html=>{

const parser=new DOMParser();

const doc=parser.parseFromString(html,"text/html");

const data=getTuviData(doc);

updateGithub(data);

});

}


// ===== CHECK PAGE =====
function checkPage(){

if(location.href.includes("danh-sach-thanh-vien-tong-mon")){

if(!canRun()) return;

setTimeout(fetchClanPage,2000);

}

}

checkPage();

})();
})();
})();
})();
})();
})();
})();
})();
})();
