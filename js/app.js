/* Aadinath Poly Plast — screens, weekly rate date, admin editing, rate alerts, opening screen */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ico = (n) => `<svg aria-hidden="true"><use href="#i-${n}"/></svg>`;
const fmt = (n) => { if (n == null || n === "") return null; const v = Number(n); const f = Number.isInteger(v) ? 0 : 2; return v.toLocaleString("en-IN", { minimumFractionDigits: f, maximumFractionDigits: 2 }); };
const uid = (p) => p + "-" + Math.random().toString(36).slice(2, 8);
const clone = (o) => JSON.parse(JSON.stringify(o));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- dates: rates run Friday 12 AM → Thursday 11:59 PM ---------- */
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s) => { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const dShort = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const dDay = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
function nextChange(from) { // the Thursday this week's rates run until
  const d = new Date(from); const add = (CONFIG.changeDay - d.getDay() + 7) % 7 || 7;
  // if rates were set on the change day itself (before midnight), they run till next week's change day
  d.setDate(d.getDate() + (d.getDay() === CONFIG.changeDay ? 7 : add)); return d;
}
function rateWeek() {
  const f = parse(data.rateDate.from), t = parse(data.rateDate.till);
  if (!f || !t) return null;
  const end = new Date(t); end.setHours(23, 59, 59, 999);
  return { from: f, till: t, stale: Date.now() > end.getTime() };
}

let data = Store.load();
let draft = null;
const view = $("#view");
const isAdmin = () => Store.user()?.role === "admin";
const items = (d = data) => d.groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title, unit: g.unit })));
const COLOURS = ["#C8402E", "#1E4F9C", "#2E8B57"];

/* ---------- pieces ---------- */
const price = (i) => i.price == null ? `<span class="none">—</span>` : `<span class="rs">₹</span><span class="num" data-num="${i.id}" data-v="${i.price}">${fmt(i.price)}</span>`;
const prevLine = (i) => {
  if (i.prev == null || i.price == null || Number(i.prev) === Number(i.price)) return "";
  const up = Number(i.price) > Number(i.prev);
  return `<span class="r-prev">Before ₹${fmt(i.prev)} · <b class="${up ? "up" : "down"}">${up ? "▲" : "▼"} ${fmt(Math.abs(i.price - i.prev))}</b></span>`;
};
function board() {
  const n = Store.alerts().some((a) => a.hit && !a.seen);
  return `<header class="board"><div class="b-top"><span class="b-line"></span>
      <div class="acts"><a class="ib" href="#alerts" aria-label="Rate alerts">${ico("bell")}${n ? '<i class="dot"></i>' : ""}</a>
        <a class="ib" data-wa href="#" aria-label="WhatsApp Ansh">${ico("whatsapp")}</a><a class="ib" data-tel href="#" aria-label="Call Ansh">${ico("phone")}</a></div></div>
      <a class="name" href="#rates"><b>Aadinath Poly Plast</b></a></header>
    <div class="ticker" aria-label="Notice"><div class="ticker-track">${[...data.notice, ...data.notice].map((t, k) => `<span ${k >= data.notice.length ? 'aria-hidden="true"' : ""}>${esc(t)}</span>`).join("")}</div></div>`;
}
const tabs = (on) => `<nav class="tabs" data-on="${on}"><span class="tabs-pill" aria-hidden="true"></span>
  <a href="#rates" ${on === "rates" ? 'aria-current="page"' : ""}>Live Rates</a><a href="#products" ${on === "products" ? 'aria-current="page"' : ""}>Product Info</a></nav>`;
const adminStrip = (label, to) => isAdmin() ? `<div class="admin rise" style="--d:2"><span>${ico("shield-check")}Admin</span><a class="btn sm" href="${to}">${ico("pencil")}${label}</a></div>` : "";
function weekCard() {
  const w = rateWeek();
  if (!w) return `<div class="week rise" style="--d:1"><span class="cal"><small>RATES</small><b>–</b></span>
      <div><div class="week-t">This week's rates</div><div class="week-d">Coming soon</div><div class="week-s">Rates will be updated shortly</div></div></div>`;
  const mon = w.from.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
  return `<div class="week rise ${w.stale ? "stale" : ""}" style="--d:1">
      <span class="cal"><small>${mon}</small><b>${w.from.getDate()}</b></span>
      <div><div class="week-t">${w.stale ? "Last week's rates" : "Rates valid for this week"}</div>
        <div class="week-d">${dShort(w.from)} – ${dShort(w.till)}</div>
        <div class="week-s">${w.stale ? `Ended ${dDay(w.till)}` : `Valid from ${dDay(w.from)} to ${dDay(w.till)}`}</div></div>
      ${w.stale ? `<div class="stale-msg"><span>New rates are being updated. Call to confirm today's rate.</span><a class="btn sm" data-tel href="#">${ico("phone")}Call</a></div>` : ""}</div>`;
}

/* ---------- screens ---------- */
const V = {
  rates() {
    const boxes = data.groups.map((g, gi) => `<section class="box rise" style="--d:${3 + gi}">
        <div class="box-h"><h2>${esc(g.title)}</h2><span>${esc(g.unit)}</span></div>
        ${g.items.map((i, k) => `<div class="r" data-row="${i.id}">
          <div><span class="r-name">${/colour/i.test(i.name) && gi > 0 ? `<span class="dots" aria-hidden="true">${COLOURS.slice(0, Math.min(3, k + 1)).map((c) => `<i style="--c:${c}"></i>`).join("")}</span>` : ""}${esc(i.name)}</span>${prevLine(i)}</div>
          <div class="r-price">${price(i)}</div></div>`).join("")}
        ${g.note ? `<div class="box-ok">${ico("badge-check")}${esc(g.note)}</div>` : ""}</section>`).join("");
    return `${board()}${tabs("rates")}${weekCard()}${adminStrip("Edit rates", "#edit")}${boxes}
      <p class="fine rise" style="--d:6">${ico("info")}<span>For the latest rate, please call or WhatsApp before booking.</span></p>
      <div class="row-btns rise" style="--d:7"><a class="btn wa" data-wa href="#">${ico("whatsapp")}Book on WhatsApp</a><button class="btn ghost" data-share>${ico("share-2")}Share rates</button></div>
      <a class="alert-cta rise" style="--d:8" href="#alerts"><span class="bi">${ico("bell-plus")}</span><span><b>Rate Alert</b><span>Get notified when a rate reaches your price</span></span>${ico("chevron-right")}</a>`;
  },

  products() {
    return `${board()}${tabs("products")}
      ${data.products.map((p, k) => `<article class="prod rise" style="--d:${2 + k}"><h3>${esc(p.title)}</h3>${esc(p.body).split(/\n+/).map((l) => `<p>${l}</p>`).join("")}</article>`).join("")}
      <div class="row-btns rise" style="--d:6"><a class="btn wa" data-wa href="#">${ico("whatsapp")}WhatsApp</a><a class="btn ghost" data-tel href="#">${ico("phone")}Call</a></div>`;
  },

  alerts() {
    const u = Store.user(), all = items(), list = Store.alerts();
    const rows = list.length ? list.map((a, i) => {
      const it = all.find((x) => x.id === a.itemId);
      return `<div class="arow"><div><b>${esc(it ? `${it.group} · ${it.name}` : "Removed item")}<span class="pill ${a.hit ? "hit" : "on"}">${a.hit ? "Reached" : "Watching"}</span></b>
        <span>${a.dir === "below" ? "Falls to" : "Rises to"} ₹${fmt(a.target)}${it?.price != null ? ` · now ₹${fmt(it.price)}` : ""}</span></div>
        <button class="del" aria-label="Delete alert" data-del-alert="${i}">${ico("trash-2")}</button></div>`;
    }).join("") : `<p class="empty">No alerts yet.</p>`;
    return `${pageTop("Rate Alert", "Pick an item and your price. When the rate reaches it, you get a notification.")}
      <div class="stack">
        <div class="free rise" style="--d:1">${ico("shield-check")}<span>Seeing rates is always free, no login needed. Sign up only for alerts.</span></div>
        <form class="card rise" style="--d:2" id="alert-form">
          <div class="field"><label for="a-item">Item</label><select class="input" id="a-item">
            ${all.map((i) => `<option value="${i.id}">${esc(i.group)} · ${esc(i.name)}${i.price != null ? ` (₹${fmt(i.price)})` : ""}</option>`).join("")}</select></div>
          <div class="choice" role="radiogroup" aria-label="When">
            <input type="radio" name="dir" id="d-below" value="below" checked><label for="d-below">${ico("arrow-down")}Falls to</label>
            <input type="radio" name="dir" id="d-above" value="above"><label for="d-above">${ico("arrow-up")}Rises to</label></div>
          <div class="field"><label for="a-target">Your price (₹)</label><input class="input" id="a-target" inputmode="decimal" placeholder="e.g. 120"></div>
          <button class="btn block">${ico("bell-plus")}${u ? "Set alert" : "Sign up free & set alert"}</button></form>
        <section class="card rise" style="--d:3"><h3>Your alerts</h3>${rows}</section></div>`;
  },

  login() {
    const u = Store.user();
    if (u) return `${pageTop(u.role === "admin" ? "Admin" : `Namaste, ${esc(u.name.split(" ")[0])}`)}
      <div class="stack">${u.role === "admin" ? settings() : `<div class="card rise" style="--d:1"><h3>${esc(u.name)}</h3><p>${esc(u.phone)}</p></div>
        <a class="btn ghost block rise" style="--d:2;margin-bottom:10px" href="#alerts">${ico("bell-ring")}My rate alerts</a>`}
        <button class="btn danger block rise" style="--d:3" data-logout>${ico("log-out")}Log out</button></div>`;
    return `${pageTop("Login", "No account needed to see rates. Sign up only to get rate alerts.")}
      <div class="stack">
        <form class="card rise" style="--d:1" id="signup-form"><h3>Sign up / Login</h3>
          <div class="field"><label for="s-name">Name</label><input class="input" id="s-name" autocomplete="name" required></div>
          <div class="field"><label for="s-phone">Mobile number</label><input class="input" id="s-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile" required pattern="[0-9+ ]{10,15}"></div>
          <button class="btn block">Continue, it's free</button></form>
        <form class="card rise" style="--d:2" id="admin-form"><h3>Admin</h3>
          ${Store.cloudOn ? `<div class="field"><label for="a-email">Email</label><input class="input" id="a-email" type="email" autocomplete="username" required></div>
          <div class="field"><label for="a-pin">Password</label><input class="input" id="a-pin" type="password" autocomplete="current-password" required></div>`
          : `<div class="field"><label for="a-pin">PIN</label><input class="input" id="a-pin" type="password" inputmode="numeric" autocomplete="current-password" required></div>`}
          <button class="btn ghost block">${ico("shield-check")}Admin login</button></form></div>`;
  },

  booking() {
    return `${pageTop("Booking Desk", "Fill this in and send it on WhatsApp. We'll confirm the rate and delivery.")}
      <div class="stack"><form class="card rise" style="--d:1" id="book-form">
        <div class="field"><label for="b-item">Item</label><select class="input" id="b-item">${items().map((i) => `<option>${esc(i.group)} · ${esc(i.name)}</option>`).join("")}</select></div>
        <div class="two"><div class="field"><label for="b-qty">Quantity</label><input class="input" id="b-qty" placeholder="5000 bags" required></div>
          <div class="field"><label for="b-size">Size</label><input class="input" id="b-size" placeholder="18 × 30"></div></div>
        <div class="field"><label for="b-name">Your name</label><input class="input" id="b-name" value="${esc(Store.user()?.role === "user" ? Store.user().name : "")}" required></div>
        <div class="field"><label for="b-note">Note</label><textarea class="input" id="b-note" placeholder="Flex printing colours, delivery place…"></textarea></div>
        <button class="btn wa block">${ico("whatsapp")}Send on WhatsApp</button></form></div>`;
  },

  about() {
    return `${pageTop("About Us")}
      <div class="stack"><article class="card rise" style="--d:1">${esc(data.about).split(/\n+/).map((l) => `<p>${l}</p>`).join("")}</article>
        <div class="two rise" style="--d:2"><a class="btn ghost" data-tel href="#">${ico("phone")}Call</a><a class="btn wa" data-wa href="#">${ico("whatsapp")}WhatsApp</a></div></div>`;
  },

  edit() {
    if (!isAdmin()) return V.login();
    if (!draft) {
      draft = clone(data);
      const today = new Date();
      draft.rateDate = { from: iso(today), till: iso(nextChange(today)) }; // new rates start today by default
    }
    return `${pageTop("Edit Rates", "Type the new prices and save. Customers see them right away.")}
      <div class="stack">
        <section class="egroup rise" style="--d:1"><h3 class="eh">Rates valid for</h3>
          <div class="two"><div class="field"><label for="rd-from">From</label><input class="input" type="date" id="rd-from" value="${draft.rateDate.from}"></div>
            <div class="field"><label for="rd-till">Till</label><input class="input" type="date" id="rd-till" value="${draft.rateDate.till}"></div></div>
          <p class="hint" style="margin-top:-4px">Filled in for one week automatically. Change if needed.</p></section>
        ${draft.groups.map((g, gi) => `<section class="egroup rise" style="--d:${2 + gi}"><h3 class="eh">${esc(g.title)} <small>${esc(g.unit)}</small></h3>
          ${g.items.map((i, ii) => `<div class="erow"><label class="ename" for="p-${gi}-${ii}">${esc(i.name)}</label>
            <input class="input price-in" id="p-${gi}-${ii}" inputmode="decimal" placeholder="₹" value="${i.price ?? ""}" data-g="${gi}" data-i="${ii}" data-f="price"></div>`).join("")}</section>`).join("")}
        <div class="savebar"><a class="btn ghost" href="#rates" data-cancel>Cancel</a><button class="btn" data-save="rates">${ico("save")}Save rates</button></div></div>`;
  },
};

function pageTop(title, lede) {
  return `<header class="ptop"><div class="ptop-row"><a class="ib" href="#rates" aria-label="Back">${ico("chevron-left")}</a><svg class="seal-sm" style="margin-right:6px"><use href="#seal"/></svg></div>
    <h1 class="rise">${title}</h1>${lede ? `<p class="rise" style="--d:1">${lede}</p>` : ""}</header>`;
}
function settings() {
  return `<a class="btn block rise" style="--d:1;margin-bottom:12px" href="#edit">${ico("pencil")}Edit rates</a>
    <form class="card rise" style="--d:2" id="contact-form"><h3>Contact number</h3>
      <div class="two"><div class="field"><label for="c-phone">Call</label><input class="input" id="c-phone" type="tel" inputmode="tel" value="${esc(data.contact.phone)}" required></div>
        <div class="field"><label for="c-wa">WhatsApp</label><input class="input" id="c-wa" type="tel" inputmode="tel" value="${esc(data.contact.whatsapp)}" required></div></div>
      <p class="hint" style="margin:-4px 0 12px">WhatsApp number with 91 in front, e.g. 918320855756</p>
      <button class="btn ghost block">${ico("save")}Save number</button></form>`;
}
function oldSettings() {
  return `
    <form class="card rise" style="--d:2" id="settings-form"><h3>Contact and notice</h3>
      <div class="two"><div class="field"><label for="c-phone">Call number</label><input class="input" id="c-phone" type="tel" value="${esc(data.contact.phone)}"></div>
        <div class="field"><label for="c-wa">WhatsApp</label><input class="input" id="c-wa" type="tel" value="${esc(data.contact.whatsapp)}"></div></div>
      <div class="field"><label for="c-notice">Scrolling notice, one line each</label><textarea class="input" id="c-notice">${esc(data.notice.join("\n"))}</textarea></div>
      <div class="field"><label for="c-about">About us</label><textarea class="input" id="c-about">${esc(data.about)}</textarea></div>
      <button class="btn block">${ico("save")}Save</button></form>`;
}

/* ---------- render + router ---------- */
let route = null;
function paintGlobal() {
  const tel = (data.contact.phone || "").replace(/[^\d+]/g, ""), wa = (data.contact.whatsapp || "").replace(/\D/g, "");
  $$("[data-tel]").forEach((a) => (a.href = tel ? `tel:${tel}` : "#about"));
  $$("[data-wa]").forEach((a) => { a.href = wa ? `https://wa.me/${wa}` : "#about"; if (wa) { a.target = "_blank"; a.rel = "noopener"; } });
  const u = Store.user(), label = u ? (u.role === "admin" ? "Admin" : "Account") : "Login";
  $("#acct-label").textContent = label; $$("[data-acct]").forEach((e) => (e.textContent = label));
  const map = { rates: 1, products: 1, login: 2 }, i = map[route] ?? -1;
  const dock = $(".dock"); dock.dataset.i = i; if (i >= 0) dock.style.setProperty("--i", i);
  $$(".dock-btn[data-nav]").forEach((b) => (b.dataset.nav === (i === 1 ? "rates" : route) ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")));
}
function render({ changed, animate = true } = {}) {
  const r = (location.hash.slice(1) || "rates").split("?")[0];
  const next = V[r] ? r : "rates";
  if (next !== route) draft = null;
  route = next;
  view.innerHTML = V[route]();
  view.classList.toggle("enter", animate && !reduce);
  paintGlobal();
  if (changed) tween(changed);
  if (route === "alerts") { const a = Store.alerts(); if (a.some((x) => x.hit && !x.seen)) { a.forEach((x) => (x.seen = true)); Store.setAlerts(a); } }
}
function go() {
  closeSheet();
  const swap = () => { render(); scrollTo(0, 0); view.focus({ preventScroll: true }); };
  if (document.startViewTransition && !reduce) document.startViewTransition(swap); else swap();
}
addEventListener("hashchange", go);

function tween(changed) { // numbers roll to the new rate
  Object.entries(changed).forEach(([id, from]) => {
    const el = $(`[data-num="${id}"]`); if (!el) return;
    const to = Number(el.dataset.v), t0 = performance.now(), dur = 900, dec = Number.isInteger(to) && Number.isInteger(from) ? 0 : 2;
    el.closest(".r")?.classList.add("flash");
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(+(from + (to - from) * e).toFixed(dec)); if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(to); };
    requestAnimationFrame(step);
  });
}

/* ---------- menu sheet ---------- */
const sheet = $("#sheet"), scrim = $("#scrim");
function openSheet() { scrim.classList.add("on"); sheet.classList.add("on"); sheet.removeAttribute("inert"); sheet.setAttribute("aria-hidden", "false"); }
function closeSheet() { scrim.classList.remove("on"); sheet.classList.remove("on"); sheet.setAttribute("inert", ""); sheet.setAttribute("aria-hidden", "true"); }
scrim.addEventListener("click", closeSheet);
addEventListener("keydown", (e) => e.key === "Escape" && closeSheet());
sheet.addEventListener("click", (e) => { const a = e.target.closest("a"); if (a && (a.getAttribute("href") === location.hash || a.target === "_blank" || a.href.startsWith("tel:"))) closeSheet(); });
let y0 = null;
sheet.addEventListener("touchstart", (e) => { y0 = e.touches[0].clientY; sheet.style.transition = "none"; }, { passive: true });
sheet.addEventListener("touchmove", (e) => { if (y0 == null) return; sheet.style.transform = `translate(-50%,${Math.max(0, e.touches[0].clientY - y0)}px)`; }, { passive: true });
sheet.addEventListener("touchend", (e) => { const dy = e.changedTouches[0].clientY - (y0 ?? 0); y0 = null; sheet.style.transition = ""; sheet.style.transform = ""; if (dy > 90) closeSheet(); });

function toast(msg, icon = "check") {
  const t = $("#toast"); t.innerHTML = ico(icon) + `<span>${esc(msg)}</span>`; t.classList.add("on");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2600);
}

/* share this week's rate card on WhatsApp */
function shareText() {
  const w = rateWeek();
  const lines = [`*Aadinath Poly Plast*`, w ? `Rates for ${dShort(w.from)} – ${dShort(w.till)}` : "This week's rates", ""];
  data.groups.forEach((g) => { lines.push(`*${g.title}* (${g.unit})`); g.items.forEach((i) => lines.push(`${i.name}: ${i.price == null ? "—" : "₹" + fmt(i.price)}`)); lines.push(""); });
  lines.push(`Call / WhatsApp: ${data.contact.phone}`, location.origin + location.pathname);
  return lines.join("\n");
}

/* ---------- clicks ---------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button,a"); if (!t) return; const d = t.dataset;
  if (d.go === "menu") return sheet.classList.contains("on") ? closeSheet() : openSheet();
  if ("share" in d) { const text = shareText(); if (navigator.share) navigator.share({ text }).catch(() => {}); else open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener"); return; }
  if ("cancel" in d) { draft = null; return; }
  if (d.save) return save(d.save);
  if (d.addItem != null) { e.preventDefault(); draft.groups[+d.addItem].items.push({ id: uid("it"), name: "", price: null, prev: null }); render({ animate: false }); return $$(`[data-g="${d.addItem}"][data-f="name"]`).pop()?.focus(); }
  if (d.delItem) { const [g, i] = d.delItem.split(":").map(Number); draft.groups[g].items.splice(i, 1); return render({ animate: false }); }
  if (d.delGroup != null) { if (!t.dataset.armed) { t.dataset.armed = 1; t.querySelector("span").textContent = "Tap again to remove"; setTimeout(() => { delete t.dataset.armed; const s = t.querySelector("span"); if (s) s.textContent = "Remove list"; }, 3000); return; } draft.groups.splice(+d.delGroup, 1); return render({ animate: false }); }
  if ("addGroup" in d) { draft.groups.push({ id: uid("g"), title: "New list", unit: "₹", note: "", items: [] }); return render({ animate: false }); }
  if (d.delProd != null) { draft.products.splice(+d.delProd, 1); return render({ animate: false }); }
  if ("addProd" in d) { draft.products.push({ id: uid("p"), title: "", body: "" }); return render({ animate: false }); }
  if (d.delAlert != null) { const a = Store.alerts(); a.splice(+d.delAlert, 1); Store.setAlerts(a); toast("Alert removed", "trash-2"); return render({ animate: false }); }
  if ("logout" in d) { Store.user()?.role === "admin" ? Store.adminLogout() : Store.setUser(null); toast("Logged out", "log-out"); location.hash = "#rates"; }
});
document.addEventListener("input", (e) => {
  const el = e.target, d = el.dataset; if (!draft) return;
  if (d.f) draft.groups[+d.g].items[+d.i][d.f] = d.f === "price" ? (el.value.trim() === "" ? null : el.value.replace(/[^\d.]/g, "")) : el.value;
  if (d.gf) draft.groups[+d.g][d.gf] = el.value;
  if (d.pf) draft.products[+d.p][d.pf] = el.value;
  if (el.id === "rd-from") { draft.rateDate.from = el.value; const f = parse(el.value); if (f) { draft.rateDate.till = iso(nextChange(f)); $("#rd-till").value = draft.rateDate.till; } }
  if (el.id === "rd-till") draft.rateDate.till = el.value;
});
function save(what) {
  const old = items();
  draft.groups.forEach((g) => { g.items = g.items.filter((i) => i.name.trim()); g.items.forEach((it) => {
    const o = old.find((x) => x.id === it.id), np = it.price == null || it.price === "" ? null : Number(it.price);
    if (o && o.price != null && np != null && Number(o.price) !== np) it.prev = o.price;
    it.price = np; }); });
  draft.products = draft.products.filter((p) => p.title.trim());
  const next = draft; draft = null;
  Store.save(next).then(() => toast(what === "rates" ? "Saved. Everyone sees this week's rates." : "Product info saved", "check"))
    .catch(() => toast("Not saved online. Check internet and try again.", "triangle-alert"));
  location.hash = what === "rates" ? "#rates" : "#products";
}

/* ---------- forms ---------- */
let pendingAlert = null;
document.addEventListener("submit", (e) => {
  e.preventDefault(); const f = e.target;
  if (f.id === "signup-form") {
    Store.setUser({ role: "user", name: $("#s-name").value.trim(), phone: $("#s-phone").value.trim() });
    if (pendingAlert) { addAlert(pendingAlert); pendingAlert = null; } else toast("You're in. Set your first alert.", "check");
    location.hash = "#alerts"; return;
  }
  if (f.id === "admin-form") {
    const btn = f.querySelector("button"); btn.disabled = true;
    Store.adminLogin($("#a-email")?.value.trim(), $("#a-pin").value).then((ok) => {
      btn.disabled = false;
      if (ok) { toast("Admin on. You can edit rates now.", "shield-check"); render(); }
      else { toast(Store.cloudOn ? "Wrong email or password" : "Wrong PIN", "x"); $("#a-pin").select(); }
    });
    return;
  }
  if (f.id === "alert-form") {
    const a = { itemId: $("#a-item").value, dir: f.dir.value, target: Number($("#a-target").value.replace(/[^\d.]/g, "")) };
    if (!a.target) { toast("Type the price you want", "x"); $("#a-target").focus(); return; }
    if (!Store.user()) { pendingAlert = a; location.hash = "#login"; toast("Sign up free to save your alert", "circle-user-round"); return; }
    addAlert(a); render({ animate: false }); return;
  }
  if (f.id === "contact-form") {
    const wa = $("#c-wa").value.replace(/\D/g, ""), ph = $("#c-phone").value.trim();
    if (wa.length < 10 || ph.replace(/\D/g, "").length < 10) { toast("Check the number", "x"); return; }
    data.contact = { phone: ph, whatsapp: wa.length === 10 ? "91" + wa : wa };
    Store.save(data).then(() => { toast("Number saved", "check"); paintGlobal(); }).catch(() => toast("Not saved online. Check internet.", "triangle-alert")); return;
  }
  if (f.id === "settings-form") {
    data.contact = { phone: $("#c-phone").value.trim(), whatsapp: $("#c-wa").value.trim() };
    data.notice = $("#c-notice").value.split("\n").map((s) => s.trim()).filter(Boolean);
    data.about = $("#c-about").value.trim(); Store.save(data).then(() => toast("Saved", "check")).catch(() => toast("Not saved online. Check internet.", "triangle-alert")); return;
  }
  if (f.id === "book-form") {
    const msg = `New booking\nItem: ${$("#b-item").value}\nQuantity: ${$("#b-qty").value}\nSize: ${$("#b-size").value || "-"}\nName: ${$("#b-name").value}\nNote: ${$("#b-note").value || "-"}`;
    open(`https://wa.me/${(data.contact.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }
});
function addAlert(a) {
  const list = Store.alerts(); list.push({ ...a, hit: false, seen: false, at: Date.now() }); Store.setAlerts(list);
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  toast("Alert set. We'll notify you.", "bell-ring"); checkAlerts();
}
function checkAlerts() {
  const all = items(), list = Store.alerts(); let fired = false;
  list.forEach((a) => {
    if (a.hit) return; const it = all.find((x) => x.id === a.itemId); if (!it || it.price == null) return;
    if ((a.dir === "below" && it.price <= a.target) || (a.dir === "above" && it.price >= a.target)) {
      a.hit = true; a.seen = false; fired = true;
      const text = `${it.group} · ${it.name} is now ₹${fmt(it.price)}`; toast(text, "bell-ring");
      if ("Notification" in window && Notification.permission === "granted")
        navigator.serviceWorker?.ready.then((r) => r.showNotification("Aadinath Poly Plast", { body: text, icon: "icons/icon-192.png", tag: a.itemId })).catch(() => {});
    }
  });
  if (fired) { Store.setAlerts(list); if (route === "rates" || route === "products") render({ animate: false }); }
}

Store.subscribe((next) => {
  const before = Object.fromEntries(items().map((i) => [i.id, i.price])); data = next;
  const changed = {}; items().forEach((i) => { if (before[i.id] != null && i.price != null && before[i.id] !== i.price) changed[i.id] = before[i.id]; });
  if (!route?.startsWith("edit")) render({ changed, animate: false });
  checkAlerts();
});
// re-check the week card every minute (it turns to "last week's rates" after Thursday night)
setInterval(() => { if (route === "rates") { const w = $(".week"); const s = rateWeek()?.stale; if (w && s !== w.classList.contains("stale")) render({ animate: false }); } }, 60000);

/* ---------- opening screen ---------- */
function splash() {
  const el = document.createElement("div");
  el.className = "splash"; el.setAttribute("role", "img"); 
  el.innerHTML = `<div class="nebula"></div><canvas></canvas>
    <div class="stage"><div class="aura"></div><img class="murti" alt="" src="${CONFIG.splashImage}"><div class="floor"></div></div>
    <button class="skip">Skip</button>${CONFIG.splashSound ? `<button class="snd" aria-label="Sound on or off"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path class="w" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/><path class="x" d="m16 9 6 6m0-6-6 6"/></svg></button>` : ""}`;
  el.setAttribute("aria-label", "Aadinath Poly Plast");
  document.body.appendChild(el);
  const music = CONFIG.splashSound ? Tune.start() : null;
  el.querySelector(".snd")?.addEventListener("click", (e) => { e.stopPropagation(); music?.toggle(); setTimeout(sync, 150); });
  const cv = el.querySelector("canvas"), cx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
  let W, H, raf, alive = true;
  const size = () => { W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; };
  size(); addEventListener("resize", size);
  const spr = document.createElement("canvas"); spr.width = spr.height = 32; const sc = spr.getContext("2d");
  const g = sc.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, "rgba(255,240,200,1)"); g.addColorStop(.25, "rgba(255,200,110,.85)"); g.addColorStop(1, "rgba(255,170,60,0)");
  sc.fillStyle = g; sc.fillRect(0, 0, 32, 32);
  const stars = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.1 + .2, p: Math.random() * 6.28, s: Math.random() * .02 + .004 }));
  const P = Array.from({ length: 45 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 5 + 2, v: Math.random() * .0004 + .0001, w: Math.random() * 6.28, dw: Math.random() * .03 + .008, a: Math.random() * .6 + .3 }));
  const tick = () => {
    cx.clearRect(0, 0, W, H); cx.globalCompositeOperation = "source-over";
    for (const st of stars) { if (!reduce) st.p += st.s; cx.globalAlpha = .25 + .6 * Math.abs(Math.sin(st.p)); cx.fillStyle = "#fff6e0"; cx.beginPath(); cx.arc(st.x * W, st.y * H, st.r * dpr, 0, 7); cx.fill(); }
    cx.globalCompositeOperation = "lighter";
    for (const p of P) {
      if (!reduce) { p.y -= p.v; p.w += p.dw; if (p.y < -.03) { p.y = 1.03; p.x = Math.random(); } }
      const x = (p.x + Math.sin(p.w) * .006) * W, y = p.y * H, s = p.s * dpr;
      cx.globalAlpha = p.a * (.45 + .55 * Math.abs(Math.sin(p.w * 1.7))); cx.drawImage(spr, x - s / 2, y - s / 2, s, s);
    }
    if (alive) raf = requestAnimationFrame(tick);
  };
  tick();
  const done = () => { if (!alive) return; alive = false; el.classList.add("out"); music?.stop(); setTimeout(() => { cancelAnimationFrame(raf); el.remove(); }, 900); render(); };
  const snd = el.querySelector(".snd");
  const sync = () => snd?.classList.toggle("off", !(music?.started() && music?.on()));
  setTimeout(sync, 300);
  // phones block sound until the first touch: first tap turns the tune on, Skip always skips
  el.addEventListener("click", (e) => {
    if (e.target.closest(".skip")) return done();
    if (music && !music.started()) { music.resume(); setTimeout(sync, 200); return; }
    done();
  });
  setTimeout(done, CONFIG.splashMs);
}

$("#ver").textContent = CONFIG.version;
splash(); render(); checkAlerts();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
