/* ------------------------------------------------------------------
   Lombok Biru - supplier prices, mobile

   Talks to Supabase over its REST API with plain fetch, no library.
   That keeps the app small enough to load on a weak site connection
   and removes a dependency that would need a CDN to be reachable.

   Offline behaviour, decided with the team:
     - reading works from a local copy, with its age shown
     - writing is blocked outright rather than queued, so nobody types
       a price that silently goes nowhere
------------------------------------------------------------------ */

const LS = {
  url: "lb.url",
  key: "lb.key",
  user: "lb.user",
  cache: (name) => `lb.cache.${name}`,
};

const state = {
  screen: "prices",
  prices: [],
  suppliers: [],
  history: [],
  offline: false,
  cachedAt: null,
  editingPrice: null,
  editingSupplier: null,
  viewingPrice: null,
  confirmFn: null,
};

const el = (id) => document.getElementById(id);
const show = (id) => el(id).classList.remove("hidden");
const hide = (id) => el(id).classList.add("hidden");

// ------------------------------------------------------------------
// supabase rest
// ------------------------------------------------------------------

function creds() {
  return { url: localStorage.getItem(LS.url), key: localStorage.getItem(LS.key) };
}

async function sb(pathAndQuery, options = {}) {
  const { url, key } = creds();
  if (!url || !key) throw new Error("Not configured");

  const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.message || body.hint || "";
    } catch (e) {
      // response wasn't json, the status alone will have to do
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ------------------------------------------------------------------
// local cache
// ------------------------------------------------------------------

function writeCache(name, data) {
  try {
    localStorage.setItem(
      LS.cache(name),
      JSON.stringify({ cachedAt: new Date().toISOString(), data })
    );
  } catch (e) {
    // storage full or blocked, not worth breaking the app over
  }
}

function readCache(name) {
  try {
    return JSON.parse(localStorage.getItem(LS.cache(name)));
  } catch (e) {
    return null;
  }
}

async function loadWithCache(name, fetcher) {
  try {
    const data = await fetcher();
    writeCache(name, data);
    return { data, fromCache: false, cachedAt: null };
  } catch (err) {
    const cached = readCache(name);
    if (cached) return { data: cached.data, fromCache: true, cachedAt: cached.cachedAt };
    throw err;
  }
}

// ------------------------------------------------------------------
// connection state
// ------------------------------------------------------------------

function setOffline(isOffline, cachedAt) {
  state.offline = isOffline;
  if (cachedAt) state.cachedAt = cachedAt;

  el("offlineBar").classList.toggle("hidden", !isOffline);
  if (isOffline) {
    const when = state.cachedAt ? ` from ${formatDateTime(state.cachedAt)}` : "";
    el("offlineText").textContent = `No connection. Showing saved prices${when}.`;
  }
  el("fab").disabled = isOffline;
}

async function retry() {
  const btn = el("retryBtn");
  btn.disabled = true;
  btn.textContent = "...";
  await refreshCurrent();
  btn.disabled = false;
  btn.textContent = "Retry";
  if (!state.offline) toast("Back online");
}

// ------------------------------------------------------------------
// boot
// ------------------------------------------------------------------

function boot() {
  const { url, key } = creds();

  if (!url || !key) {
    show("setupScreen");
    el("setupBtn").addEventListener("click", saveSetup);
    return;
  }
  if (!localStorage.getItem(LS.user)) {
    show("nameScreen");
    el("nameBtn").addEventListener("click", saveName);
    return;
  }

  show("app");
  wire();
  loadPrices();
  loadSuppliers();
}

async function saveSetup() {
  const url = el("setupUrl").value.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const key = el("setupKey").value.trim();
  const err = el("setupError");
  err.classList.add("hidden");

  if (!url || !key) {
    err.textContent = "Both fields are needed.";
    err.classList.remove("hidden");
    return;
  }

  el("setupBtn").disabled = true;
  el("setupBtn").textContent = "Checking...";

  localStorage.setItem(LS.url, url);
  localStorage.setItem(LS.key, key);

  try {
    await sb("suppliers?select=id&limit=1");
    location.reload();
  } catch (e) {
    localStorage.removeItem(LS.url);
    localStorage.removeItem(LS.key);
    err.textContent = "Could not connect. Check both values and your internet.";
    err.classList.remove("hidden");
    el("setupBtn").disabled = false;
    el("setupBtn").textContent = "Connect";
  }
}

function saveName() {
  const name = el("nameInput").value.trim();
  if (!name) return;
  localStorage.setItem(LS.user, name);
  location.reload();
}

// ------------------------------------------------------------------
// wiring
// ------------------------------------------------------------------

function wire() {
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => switchScreen(t.dataset.screen))
  );

  el("retryBtn").addEventListener("click", retry);
  el("fab").addEventListener("click", onFab);

  el("refreshPrices").addEventListener("click", () => manualRefresh("refreshPrices", loadPrices));
  el("refreshSuppliers").addEventListener("click", () => manualRefresh("refreshSuppliers", loadSuppliers));
  el("refreshHistory").addEventListener("click", () => manualRefresh("refreshHistory", loadHistory));

  el("priceSearch").addEventListener("input", debounce(renderPrices, 120));
  el("supplierSearch").addEventListener("input", debounce(renderSuppliers, 120));

  document.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", () => hide(b.dataset.close))
  );

  el("priceSave").addEventListener("click", savePrice);
  el("supplierSave").addEventListener("click", saveSupplier);
  el("supplierDelete").addEventListener("click", () => askDeleteSupplier(state.editingSupplier));

  el("detailEdit").addEventListener("click", () => {
    hide("priceDetail");
    openPriceForm(state.viewingPrice);
  });
  el("detailDelete").addEventListener("click", () => askDeletePrice(state.viewingPrice));

  el("confirmNo").addEventListener("click", () => hide("confirmOverlay"));
  el("confirmYes").addEventListener("click", async () => {
    hide("confirmOverlay");
    if (state.confirmFn) await state.confirmFn();
    state.confirmFn = null;
  });
}

async function manualRefresh(btnId, loader) {
  const btn = el(btnId);
  btn.classList.add("spinning");
  btn.disabled = true;
  await loader();
  btn.classList.remove("spinning");
  btn.disabled = false;
  if (!state.offline) toast("Up to date");
}

function refreshCurrent() {
  if (state.screen === "prices") return Promise.all([loadPrices(), loadSuppliers()]);
  if (state.screen === "suppliers") return loadSuppliers();
  return loadHistory();
}

function switchScreen(name) {
  state.screen = name;
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.screen === name)
  );
  ["prices", "suppliers", "history"].forEach((s) =>
    el(`screen-${s}`).classList.toggle("hidden", s !== name)
  );
  el("fab").classList.toggle("hidden", name === "history");
  if (name === "history" && !state.history.length) loadHistory();
}

function onFab() {
  if (state.offline) return toast("No connection. You can't add while offline.", true);
  if (state.screen === "suppliers") openSupplierForm(null);
  else openPriceForm(null);
}

// ------------------------------------------------------------------
// prices
// ------------------------------------------------------------------

async function loadPrices() {
  try {
    const res = await loadWithCache("prices", () =>
      sb("prices?select=*,suppliers(id,name)&order=updated_at.desc")
    );
    state.prices = res.data;
    setOffline(res.fromCache, res.cachedAt);
    renderPrices();
  } catch (e) {
    toast(e.message, true);
  }
}

function renderPrices() {
  const kw = el("priceSearch").value.trim().toLowerCase();
  const rows = state.prices.filter((p) => {
    if (!kw) return true;
    const s = p.suppliers ? p.suppliers.name : "";
    return (
      (p.description || "").toLowerCase().includes(kw) ||
      (p.category || "").toLowerCase().includes(kw) ||
      s.toLowerCase().includes(kw)
    );
  });

  const list = el("priceList");
  list.innerHTML = "";
  el("priceEmpty").classList.toggle("hidden", rows.length > 0);

  const weekAgo = Date.now() - 7 * 86400000;

  rows.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card" + (new Date(p.updated_at).getTime() >= weekAgo ? " recent" : "");
    card.innerHTML = `
      <div class="card-title">${esc(p.description)}</div>
      <div class="card-price">${money(p.price, p.currency)}<span style="font-size:13px;font-weight:400;color:#6B7280"> / ${esc(p.unit || "")}</span></div>
      <div class="card-meta">
        <span class="chip">${esc(p.category || "—")}</span>
        <span>${esc(p.suppliers ? p.suppliers.name : "—")}</span>
        <span>${date(p.updated_at)}</span>
      </div>`;
    card.addEventListener("click", () => openPriceDetail(p));
    list.appendChild(card);
  });
}

function openPriceDetail(p) {
  state.viewingPrice = p;
  el("priceDetailBody").innerHTML = `
    <div class="detail-hero">
      <div class="h-title">${esc(p.description)}</div>
      <div class="h-price">${money(p.price, p.currency)}</div>
      <div style="color:#6B7280;font-size:14px;margin-top:4px">per ${esc(p.unit || "—")}</div>
    </div>
    <div class="detail-row"><span class="detail-label">Supplier</span><span class="detail-value">${esc(p.suppliers ? p.suppliers.name : "—")}</span></div>
    <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${esc(p.category || "—")}</span></div>
    <div class="detail-row"><span class="detail-label">Updated</span><span class="detail-value">${date(p.updated_at)}</span></div>
    <div class="detail-row"><span class="detail-label">By</span><span class="detail-value">${esc(p.updated_by || "—")}</span></div>
    ${p.link ? `<div class="detail-row"><span class="detail-label">Link</span><span class="detail-value"><a href="${esc(p.link)}" target="_blank" rel="noopener">Open</a></span></div>` : ""}
    ${p.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${esc(p.notes)}</span></div>` : ""}
  `;
  el("detailEdit").disabled = state.offline;
  el("detailDelete").disabled = state.offline;
  show("priceDetail");
}

function openPriceForm(existing) {
  state.editingPrice = existing;
  el("priceFormTitle").textContent = existing ? "Edit a price" : "Add a price";

  fillSuppliers(existing ? existing.supplier_id : null);
  el("fDescription").value = existing ? existing.description : "";
  el("fPrice").value = existing ? existing.price : "";
  el("fCurrency").value = existing ? existing.currency || "IDR" : "IDR";
  el("fUnit").value = existing ? existing.unit || "Other" : "m3";
  el("fCategory").value = existing ? existing.category || "Other" : "Structural work";
  el("fLink").value = existing ? existing.link || "" : "";
  el("fNotes").value = existing ? existing.notes || "" : "";

  show("priceForm");
}

function fillSuppliers(selectedId) {
  const sorted = [...state.suppliers].sort((a, b) => a.name.localeCompare(b.name));
  el("fSupplier").innerHTML = sorted
    .map((s) => `<option value="${s.id}">${esc(s.name)}</option>`)
    .join("");
  if (selectedId) el("fSupplier").value = selectedId;
}

async function savePrice() {
  const description = el("fDescription").value.trim();
  const price = parseFloat(el("fPrice").value);
  const supplierId = el("fSupplier").value;

  if (!description) return toast("Item description is needed", true);
  if (isNaN(price)) return toast("Price must be a number", true);
  if (!supplierId) return toast("Pick a supplier", true);

  const user = localStorage.getItem(LS.user) || "Unknown";
  const supplier = state.suppliers.find((s) => s.id === supplierId);
  const body = {
    category: el("fCategory").value,
    description,
    unit: el("fUnit").value,
    supplier_id: supplierId,
    price,
    currency: el("fCurrency").value,
    link: el("fLink").value.trim(),
    notes: el("fNotes").value.trim(),
    updated_at: new Date().toISOString(),
    updated_by: user,
  };

  const btn = el("priceSave");
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const editing = state.editingPrice;
    if (editing) {
      await sb(`prices?id=eq.${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      await logHistory("Updated", description, editing.price, price, supplier);
    } else {
      await sb("prices", { method: "POST", body: JSON.stringify(body) });
      await logHistory("Added", description, null, price, supplier);
    }
    hide("priceForm");
    toast(editing ? "Price updated" : "Price added");
    await loadPrices();
  } catch (e) {
    toast(e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Save";
  }
}

function askDeletePrice(p) {
  confirmDialog("Delete this price?", `"${p.description}" will be removed permanently.`, async () => {
    try {
      await sb(`prices?id=eq.${p.id}`, { method: "DELETE" });
      await logHistory("Deleted", p.description, p.price, null, p.suppliers);
      hide("priceDetail");
      toast("Price deleted");
      await loadPrices();
    } catch (e) {
      toast(e.message, true);
    }
  });
}

// ------------------------------------------------------------------
// suppliers
// ------------------------------------------------------------------

async function loadSuppliers() {
  try {
    const res = await loadWithCache("suppliers", () => sb("suppliers?select=*&order=name.asc"));
    state.suppliers = res.data;
    setOffline(res.fromCache, res.cachedAt);
    renderSuppliers();
  } catch (e) {
    toast(e.message, true);
  }
}

function renderSuppliers() {
  const kw = el("supplierSearch").value.trim().toLowerCase();
  const rows = state.suppliers.filter(
    (s) =>
      !kw ||
      (s.name || "").toLowerCase().includes(kw) ||
      (s.category || "").toLowerCase().includes(kw)
  );

  const list = el("supplierList");
  list.innerHTML = "";
  el("supplierEmpty").classList.toggle("hidden", rows.length > 0);

  rows.forEach((s) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-title">${esc(s.name)}</div>
      <div class="card-meta">
        <span class="chip">${esc(s.category || "—")}</span>
        ${s.contact ? `<span>${esc(s.contact)}</span>` : ""}
      </div>
      ${s.phone ? `<div class="card-meta" style="margin-top:6px"><a href="tel:${esc(s.phone)}" style="color:#16305A">${esc(s.phone)}</a></div>` : ""}`;
    card.addEventListener("click", (ev) => {
      if (ev.target.tagName === "A") return;
      openSupplierForm(s);
    });
    list.appendChild(card);
  });
}

function openSupplierForm(existing) {
  state.editingSupplier = existing;
  el("supplierFormTitle").textContent = existing ? "Edit a supplier" : "Add a supplier";
  el("sName").value = existing ? existing.name : "";
  el("sCategory").value = existing ? existing.category || "Other" : "Structural work";
  el("sContact").value = existing ? existing.contact || "" : "";
  el("sPhone").value = existing ? existing.phone || "" : "";
  el("sNotes").value = existing ? existing.notes || "" : "";

  el("supplierDelete").classList.toggle("hidden", !existing);
  el("supplierSave").disabled = state.offline;
  el("supplierDelete").disabled = state.offline;
  show("supplierForm");
}

async function saveSupplier() {
  const name = el("sName").value.trim();
  if (!name) return toast("Supplier name is needed", true);

  const body = {
    name,
    category: el("sCategory").value,
    contact: el("sContact").value.trim(),
    phone: el("sPhone").value.trim(),
    notes: el("sNotes").value.trim(),
  };

  const btn = el("supplierSave");
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    if (state.editingSupplier) {
      await sb(`suppliers?id=eq.${state.editingSupplier.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    } else {
      await sb("suppliers", { method: "POST", body: JSON.stringify(body) });
    }
    hide("supplierForm");
    toast(state.editingSupplier ? "Supplier updated" : "Supplier added");
    await loadSuppliers();
  } catch (e) {
    toast(e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Save";
  }
}

async function askDeleteSupplier(s) {
  if (!s) return;

  let linked = 0;
  try {
    const rows = await sb(`prices?select=id&supplier_id=eq.${s.id}`);
    linked = rows.length;
  } catch (e) {
    // fall through, the confirm message just won't have a count
  }

  const msg =
    linked > 0
      ? `This supplier has ${linked} price(s). Deleting it removes those prices too, permanently.`
      : `"${s.name}" will be removed permanently.`;

  confirmDialog("Delete this supplier?", msg, async () => {
    try {
      // history first: once the rows are gone we can't read them back
      if (linked > 0) {
        const rows = await sb(`prices?select=description,price&supplier_id=eq.${s.id}`);
        const user = localStorage.getItem(LS.user) || "Unknown";
        if (rows.length) {
          await sb("history", {
            method: "POST",
            body: JSON.stringify(
              rows.map((r) => ({
                user_name: user,
                action: "Deleted (supplier removed)",
                description: r.description,
                old_price: r.price,
                supplier_name: s.name,
              }))
            ),
          });
        }
      }
      await sb(`suppliers?id=eq.${s.id}`, { method: "DELETE" });
      hide("supplierForm");
      toast(linked > 0 ? `Supplier and ${linked} price(s) deleted` : "Supplier deleted");
      await Promise.all([loadSuppliers(), loadPrices()]);
    } catch (e) {
      toast(e.message, true);
    }
  });
}

// ------------------------------------------------------------------
// history
// ------------------------------------------------------------------

async function logHistory(action, description, oldPrice, newPrice, supplier) {
  try {
    await sb("history", {
      method: "POST",
      body: JSON.stringify({
        user_name: localStorage.getItem(LS.user) || "Unknown",
        action,
        description,
        old_price: oldPrice,
        new_price: newPrice,
        supplier_name: supplier ? supplier.name : "",
      }),
    });
  } catch (e) {
    // the price change itself already went through, a missing log line
    // is not worth showing the user an error over
  }
}

async function loadHistory() {
  try {
    const res = await loadWithCache("history", () =>
      sb("history?select=*&order=at.desc&limit=300")
    );
    state.history = res.data;
    setOffline(res.fromCache, res.cachedAt);
    renderHistory();
  } catch (e) {
    toast(e.message, true);
  }
}

function renderHistory() {
  const list = el("historyList");
  list.innerHTML = "";
  el("historyEmpty").classList.toggle("hidden", state.history.length > 0);

  state.history.forEach((h) => {
    const a = (h.action || "").toLowerCase();
    const chip = a.includes("added")
      ? "chip-added"
      : a.includes("updated")
      ? "chip-updated"
      : "chip-deleted";

    const change =
      h.old_price != null && h.new_price != null
        ? `${money(h.old_price)} &rarr; ${money(h.new_price)}`
        : h.new_price != null
        ? money(h.new_price)
        : h.old_price != null
        ? money(h.old_price)
        : "";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-meta" style="margin-bottom:6px">
        <span class="chip ${chip}">${esc(h.action || "")}</span>
        <span>${formatDateTime(h.at)}</span>
      </div>
      <div class="card-title" style="font-size:15px">${esc(h.description || "")}</div>
      <div class="card-meta" style="margin-top:5px">
        ${change ? `<span style="font-weight:600;color:#16305A">${change}</span>` : ""}
        <span>${esc(h.supplier_name || "")}</span>
        <span>by ${esc(h.user_name || "")}</span>
      </div>`;
    list.appendChild(card);
  });
}

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

function confirmDialog(title, text, fn) {
  el("confirmTitle").textContent = title;
  el("confirmText").textContent = text;
  state.confirmFn = fn;
  show("confirmOverlay");
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function money(v, cur) {
  if (v == null) return "—";
  const n = Number(v).toLocaleString("en-US");
  return cur ? `${n} ${cur}` : n;
}

function date(iso) {
  return iso ? new Date(iso).toLocaleDateString("en-GB") : "—";
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function toast(msg, isError) {
  const t = document.createElement("div");
  t.className = "toast" + (isError ? " error" : "");
  t.textContent = msg;
  el("toasts").appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

// ------------------------------------------------------------------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", boot);
