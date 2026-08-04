:root {
  --navy-900: #0F2340;
  --navy-800: #16305A;
  --gold-500: #E8A33D;
  --gold-600: #D18F2C;
  --bg: #F6F4EE;
  --card: #FFFFFF;
  --border: #E6E1D6;
  --text: #1D2430;
  --muted: #6B7280;
  --green: #2F9E44;
  --red: #C0392B;
  --amber-bg: #FFF4E0;
  --amber-border: #F0D9A8;
  --amber-text: #8A5A12;
  --tabbar-h: 60px;
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overscroll-behavior-y: none;
}

body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  /* 16px minimum on inputs, below that mobile browsers zoom on focus */
  font-size: 16px;
}

.hidden { display: none !important; }

/* ---------------- setup screens ---------------- */

.setup {
  min-height: 100dvh;
  background: var(--navy-900);
  color: #fff;
  padding: 40px 24px calc(24px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.setup-logo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  align-self: center;
  margin-bottom: 18px;
}

.setup h1 {
  font-size: 24px;
  margin: 0;
  text-align: center;
}

.setup-sub {
  text-align: center;
  color: rgba(255,255,255,0.6);
  margin: 4px 0 22px;
  font-size: 15px;
}

.setup-text {
  color: rgba(255,255,255,0.75);
  font-size: 15px;
  line-height: 1.5;
  margin: 0 0 22px;
}

.setup label {
  display: block;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  margin: 14px 0 6px;
}

.setup input {
  width: 100%;
  font-size: 16px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.setup input::placeholder { color: rgba(255,255,255,0.35); }

.setup-error {
  color: #FFB4A8;
  font-size: 14px;
  margin: 14px 0 0;
}

.setup .btn { margin-top: 24px; }

/* ---------------- buttons ---------------- */

.btn {
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 15px 18px;
  cursor: pointer;
}

.btn-primary { background: var(--gold-500); color: var(--navy-900); }
.btn-primary:active { background: var(--gold-600); }
.btn-ghost { background: #fff; border-color: var(--border); color: var(--text); }
.btn-danger { background: var(--red); color: #fff; }
.btn-block { width: 100%; }
.btn-half { flex: 1; }
.btn:disabled { opacity: 0.45; }

/* ---------------- app shell ---------------- */

.app {
  min-height: 100dvh;
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(14px + env(safe-area-inset-top)) 18px 10px;
  background: var(--navy-900);
  color: #fff;
}

.topbar h1 { font-size: 20px; margin: 0; }

.icon-btn {
  background: rgba(255,255,255,0.12);
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.icon-btn:active { background: rgba(255,255,255,0.24); }
.icon-btn.spinning { opacity: 0.5; }

.searchbar {
  padding: 12px 14px;
  background: var(--navy-900);
  position: sticky;
  top: 0;
  z-index: 5;
}

.searchbar input {
  width: 100%;
  font-size: 16px;
  padding: 13px 15px;
  border-radius: 10px;
  border: none;
  background: rgba(255,255,255,0.14);
  color: #fff;
}

.searchbar input::placeholder { color: rgba(255,255,255,0.5); }

/* ---------------- offline bar ---------------- */

.offline-bar {
  display: flex;
  align-items: center;
  gap: 9px;
  background: var(--amber-bg);
  border-bottom: 1px solid var(--amber-border);
  color: var(--amber-text);
  padding: 11px 14px;
  font-size: 13.5px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.offline-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--gold-500); flex: 0 0 auto;
}

.offline-retry {
  margin-left: auto;
  background: #fff;
  border: 1px solid var(--amber-border);
  color: var(--amber-text);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

/* ---------------- lists ---------------- */

.list { padding: 10px 12px 20px; }

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 9px;
}

.card:active { background: #FBFAF6; }

.card.recent { border-left: 3px solid var(--green); }

.card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 5px;
}

.card-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--navy-800);
  margin-bottom: 6px;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
  font-size: 13px;
  color: var(--muted);
}

.chip {
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 999px;
  background: #EFE9DA;
  color: var(--navy-800);
}

.chip-added { background: #E7F5E9; color: var(--green); }
.chip-updated { background: #FFF3DE; color: var(--gold-600); }
.chip-deleted { background: #FBEAE8; color: var(--red); }

.empty {
  padding: 50px 24px;
  text-align: center;
  color: var(--muted);
  font-size: 15px;
}

/* ---------------- fab + tabbar ---------------- */

.fab {
  position: fixed;
  right: 18px;
  bottom: calc(var(--tabbar-h) + 18px + env(safe-area-inset-bottom));
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: none;
  background: var(--gold-500);
  color: var(--navy-900);
  font-size: 30px;
  line-height: 1;
  box-shadow: 0 6px 18px rgba(15,35,64,0.28);
  cursor: pointer;
  z-index: 15;
}

.fab:active { background: var(--gold-600); }
.fab:disabled { opacity: 0.4; }

.tabbar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  height: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--navy-900);
  display: flex;
  z-index: 16;
}

.tab {
  flex: 1;
  background: none;
  border: none;
  color: rgba(255,255,255,0.55);
  font-family: inherit;
  font-size: 11.5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
}

.tab-icon { font-size: 18px; line-height: 1; }
.tab.active { color: var(--gold-500); }

/* ---------------- sheets (full screen forms) ---------------- */

.sheet {
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: 40;
  display: flex;
  flex-direction: column;
}

.sheet-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(14px + env(safe-area-inset-top)) 16px 14px;
  background: var(--navy-900);
  color: #fff;
}

.sheet-bar h2 { font-size: 18px; margin: 0; }

.sheet-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  line-height: 1;
  padding: 4px 8px;
  cursor: pointer;
}

.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px 24px;
}

.sheet-body label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  margin: 16px 0 6px;
}

.sheet-body label:first-child { margin-top: 0; }

.sheet-body input,
.sheet-body select,
.sheet-body textarea {
  width: 100%;
  font-family: inherit;
  font-size: 16px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: var(--text);
}

.sheet-body textarea { resize: vertical; }

.row-2 { display: flex; gap: 12px; }
.row-2 > div { flex: 1; }
.row-2 label { margin-top: 16px; }

.sheet-actions {
  display: flex;
  gap: 10px;
  padding: 14px 16px calc(14px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid var(--border);
}

/* detail view */

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
}

.detail-row:last-child { border-bottom: none; }
.detail-label { color: var(--muted); flex: 0 0 auto; }
.detail-value { text-align: right; font-weight: 500; word-break: break-word; }
.detail-value a { color: var(--navy-800); }

.detail-hero {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 16px;
  text-align: center;
}

.detail-hero .h-title { font-size: 17px; font-weight: 600; margin-bottom: 8px; }
.detail-hero .h-price { font-size: 26px; font-weight: 700; color: var(--navy-800); }

/* ---------------- dialog ---------------- */

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,35,64,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 60;
}

.dialog {
  background: #fff;
  border-radius: 14px;
  padding: 22px;
  width: 100%;
  max-width: 400px;
}

.dialog h3 { margin: 0 0 8px; font-size: 18px; }
.dialog p { margin: 0 0 20px; color: var(--muted); font-size: 14.5px; line-height: 1.5; }
.dialog-actions { display: flex; gap: 10px; }

/* ---------------- toasts ---------------- */

.toasts {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: calc(var(--tabbar-h) + 20px + env(safe-area-inset-bottom));
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  background: var(--navy-900);
  color: #fff;
  padding: 13px 16px;
  border-radius: 10px;
  font-size: 14.5px;
  box-shadow: 0 6px 20px rgba(15,35,64,0.3);
}

.toast.error { background: var(--red); }
