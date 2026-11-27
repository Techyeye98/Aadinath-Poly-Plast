/* Aadinath Poly Plast — data layer.
   Everything is saved in this browser for now so the app can be tried end to end.
   To make admin price changes reach every customer, replace the three functions marked BACKEND
   with calls to a shared database (Firebase / Supabase / own server). Nothing else changes. */

const CONFIG = {
  splashImage: "img/ganesh.webp",    // opening screen picture
  splashSound: true,                 // soft background tune on the opening screen
  splashMs: 5500,                    // opening screen shows on every open/refresh; tap skips
  adminPin: "1234",                  // DEMO ONLY. Real admin login moves to the backend.
  changeDay: 4,                      // rates usually change after 12 midnight on Thursday (0 = Sunday … 4 = Thursday)
  version: "1.3.1",
  // Shared database. Paste the Firebase web config here (Firebase console > Project settings > Your apps).
  // While this is null, rates are saved only in this browser (demo mode, admin PIN above).
  firebase: null,
};

const DEFAULT_DATA = {
  notice: [
    "All sizes available",
    "Call or WhatsApp to book",
  ],
  contact: { phone: "+918320855756", whatsapp: "918320855756" },   // Ansh
  rateDate: { from: null, till: null },    // set by admin when saving rates
  groups: [
    { id: "g-bag", title: "PP Bag Price", unit: "₹ per kg", note: "All sizes available",
      items: [
        { id: "bag-5-below", name: "Size 5 below", price: null, prev: null },
        { id: "bag-5-up", name: "Size 5 up", price: null, prev: null },
      ] },
    { id: "g-flex", title: "Flex Printing", unit: "₹ per bag", note: "",
      items: [
        { id: "flex-1", name: "1 colour", price: null, prev: null },
        { id: "flex-2", name: "2 colour", price: null, prev: null },
        { id: "flex-3", name: "3 colour", price: null, prev: null },
      ] },
  ],
  products: [
    { id: "p2", title: "Flex Printed Bags", body: "Your brand name and design flex printed on the bag in 1, 2 or 3 colours." },
  ],
  about: "Aadinath Poly Plast makes bags in all sizes, plain and flex printed.\nCheck this week's rates here any time, free. Call or WhatsApp us to place an order.",
  updatedAt: null,
};

const KEY = "ap-data-v4", USER_KEY = "ap-user-v1", ALERT_KEY = "ap-alerts-v2";
const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const Store = {
  listeners: new Set(),
  // BACKEND: load shared rates
  load() {
    const d = read(KEY, null) || JSON.parse(JSON.stringify(DEFAULT_DATA));
    d.contact ||= {}; d.contact.phone ||= DEFAULT_DATA.contact.phone; d.contact.whatsapp ||= DEFAULT_DATA.contact.whatsapp;
    d.rateDate ||= { from: null, till: null };
    return d;
  },
  // save shared rates (admin only): this browser + Firebase when connected
  save(data) {
    data.updatedAt = Date.now(); write(KEY, data); this.emit(data);
    if (this.cloud) return this.cloud.save(data).catch((e) => { console.warn(e); throw e; });
    return Promise.resolve();
  },
  cloud: null,
  get cloudOn() { return !!CONFIG.firebase; },
  // admin login: Firebase email + password when connected, demo PIN otherwise
  async adminLogin(email, secret) {
    if (!this.cloud) { if (secret === CONFIG.adminPin) { this.setUser({ role: "admin", name: "Admin" }); return true; } return false; }
    try { await this.cloud.login(email, secret); this.setUser({ role: "admin", name: "Admin", email }); return true; } catch { return false; }
  },
  adminLogout() { this.setUser(null); this.cloud?.logout(); },
  // BACKEND: subscribe to live changes made by the admin
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit(data) { this.listeners.forEach((fn) => fn(data)); },

  user() { return read(USER_KEY, null); },
  setUser(u) { u ? write(USER_KEY, u) : localStorage.removeItem(USER_KEY); },
  alerts() { return read(ALERT_KEY, []); },
  setAlerts(a) { write(ALERT_KEY, a); },
};

// other open tabs see admin changes instantly
window.addEventListener("storage", (e) => { if (e.key === KEY) Store.emit(Store.load()); });

// connect Firebase (live rates for everyone) when a config is set
if (CONFIG.firebase) {
  const sc = document.createElement("script"); sc.src = "js/cloud.js"; sc.async = true;
  sc.onload = () => {
    Store.cloud = window.Cloud.start(CONFIG.firebase, {
      onData(d) { write(KEY, d); Store.emit(Store.load()); },
      onAdmin(signedIn, email) {
        const u = Store.user();
        if (!signedIn && u?.role === "admin") { Store.setUser(null); Store.emit(Store.load()); }
        if (signedIn && u?.role !== "admin") { Store.setUser({ role: "admin", name: "Admin", email }); Store.emit(Store.load()); }
      },
    });
  };
  document.head.appendChild(sc);
}
