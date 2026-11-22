/* core.js — tiện ích, kho dữ liệu, logic học tập */
'use strict';
const H = window.H = {};

/* ---------- Tiện ích ---------- */
H.uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2));
H.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
H.pad = n => String(n).padStart(2, '0');
H.dayStr = (d = new Date()) => `${d.getFullYear()}-${H.pad(d.getMonth() + 1)}-${H.pad(d.getDate())}`;
H.today = () => H.dayStr();
H.parseDay = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
H.addDays = (s, n) => { const d = H.parseDay(s); d.setDate(d.getDate() + n); return H.dayStr(d); };
H.diffDays = (a, b) => Math.round((H.parseDay(a) - H.parseDay(b)) / 864e5);
H.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
H.fmtMin = m => { m = Math.round(m || 0); if (m < 60) return `${m} phút`; const h = Math.floor(m / 60), r = m % 60; return r ? `${h} giờ ${r} phút` : `${h} giờ`; };
H.fmtMinShort = m => { m = Math.round(m || 0); if (m < 60) return `${m}p`; const h = Math.floor(m / 60), r = m % 60; return r ? `${h}g${H.pad(r)}` : `${h}g`; };
H.fmtClock = ms => { const neg = ms < 0; ms = Math.abs(ms); const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); return (neg ? '+' : '') + `${H.pad(m)}:${H.pad(s % 60)}`; };
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
H.WD = WD;
H.fmtDay = s => { const d = H.parseDay(s); const t = H.today(); if (s === t) return 'Hôm nay'; if (s === H.addDays(t, -1)) return 'Hôm qua'; if (s === H.addDays(t, 1)) return 'Ngày mai'; return `${WD[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`; };
H.fmtDayL = s => { const t = H.fmtDay(s); return /^(Hôm|Ngày mai)/.test(t) ? t.toLowerCase() : t; };
H.fmtDate = s => { const d = H.parseDay(s); return `${H.pad(d.getDate())}/${H.pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
H.isoWeek = (s) => { const d = H.parseDay(s); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return `${t.getUTCFullYear()}-W${H.pad(Math.ceil(((t - y0) / 864e5 + 1) / 7))}`; };
H.weekStart = s => { const d = H.parseDay(s); const dn = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dn); return H.dayStr(d); };
H.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
H.sum = a => a.reduce((x, y) => x + (Number(y) || 0), 0);
H.avg = a => a.length ? H.sum(a) / a.length : 0;
H.pct = v => `${Math.round(v * 100)}%`;
H.greeting = () => { const h = new Date().getHours(); return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'; };

/* ---------- Icon (SVG nét) ---------- */
const IC = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  skills: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 5 9-5" opacity=".5"/>',
  play: '<path d="M7 4.5v15l13-7.5-13-7.5Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  cards: '<rect x="3" y="6" width="14" height="15" rx="2.5"/><path d="M7 3h11.5A2.5 2.5 0 0 1 21 5.5V17"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flame: '<path d="M12 21c4 0 7-2.7 7-6.6 0-3.1-2-5.3-3.6-7-.4 1.7-1.3 3-2.6 3.6.3-2.9-.8-5.8-3.3-8-.2 3.2-1.5 5-3 6.6C5.3 11.1 5 12.6 5 14.4 5 18.3 8 21 12 21Z"/>',
  ai: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/><path d="M20 21v-5h-5"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  cloud: '<path d="M7 18h10.5a4.5 4.5 0 0 0 .6-9A6 6 0 0 0 6.5 10 4 4 0 0 0 7 18Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  bug: '<rect x="7" y="7" width="10" height="13" rx="5"/><path d="M12 7V4M9 4l1 3M15 4l-1 3M3 13h4M17 13h4M4 8l3 2M20 8l-3 2M4 19l3-2M20 19l-3-2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  plan: '<path d="M9 5h11M9 12h11M9 19h11"/><path d="m3 5 1.5 1.5L7 4M3 12l1.5 1.5L7 11M3 19l1.5 1.5L7 18"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  sport: '<circle cx="12" cy="12" r="9"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M3 12h18"/>',
  spark: '<path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>'
};
H.icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;

/* ---------- Kho dữ liệu cục bộ (offline trước) ---------- */
const LS_DB = 'hhkn.db.v1', LS_META = 'hhkn.meta.v1', LS_LOCAL = 'hhkn.local.v1';
const Store = H.Store = {
  recs: {},          // id -> {id, kind, data, updated_at, deleted}
  meta: { dirty: {}, lastPull: null, syncedUser: null },
  local: {},         // chỉ trên máy: buổi tập đang chạy, cấu hình kết nối riêng
  listeners: new Set(),
  ver: 0, _cache: {}, _ptimer: null,
  bump() { this.ver++; this._cache = {}; },
  memo(key, fn) { const c = this._cache; return key in c ? c[key] : (c[key] = fn()); },
  load() {
    try { this.recs = JSON.parse(localStorage.getItem(LS_DB) || '{}'); } catch { this.recs = {}; }
    try { this.meta = Object.assign({ dirty: {}, lastPull: null, syncedUser: null }, JSON.parse(localStorage.getItem(LS_META) || '{}')); } catch { }
    try { this.local = JSON.parse(localStorage.getItem(LS_LOCAL) || '{}'); } catch { this.local = {}; }
    if ('geminiKey' in this.local || 'geminiModel' in this.local) { delete this.local.geminiKey; delete this.local.geminiModel; this.saveLocal(); }
    this.bump();
  },
  saveSoon: null,
  // ghi gộp: nhiều thay đổi liên tiếp chỉ ghi localStorage 1 lần
  persist() { clearTimeout(this._ptimer); this._ptimer = setTimeout(() => this.flush(), 250); },
  flush() {
    clearTimeout(this._ptimer); this._ptimer = null;
    try { localStorage.setItem(LS_DB, JSON.stringify(this.recs)); localStorage.setItem(LS_META, JSON.stringify(this.meta)); }
    catch (e) { console.error(e); H.toast && H.toast('Bộ nhớ trình duyệt đầy. Hãy Xuất JSON để sao lưu.'); }
  },
  saveLocal() { localStorage.setItem(LS_LOCAL, JSON.stringify(this.local)); },
  emit(src) { this.listeners.forEach(f => { try { f(src); } catch (e) { console.error(e); } }); },
  all(kind) {
    const idx = this.memo('#idx', () => { const m = {}; for (const r of Object.values(this.recs)) { if (r.deleted) continue; (m[r.kind] || (m[r.kind] = [])).push(r.data); } return m; });
    return (idx[kind] || []).slice();
  },
  get(id) { const r = this.recs[id]; return r && !r.deleted ? r.data : null; },
  put(kind, data, { silent } = {}) {
    if (!data.id) data.id = H.uid();
    const now = new Date().toISOString();
    this.recs[data.id] = { id: data.id, kind, data, updated_at: now, deleted: false };
    this.meta.dirty[data.id] = now;
    this.bump(); this.persist();
    if (!silent) this.emit('local');
    H.Sync && H.Sync.schedule();
    return data;
  },
  del(id) {
    const r = this.recs[id]; if (!r) return;
    const now = new Date().toISOString();
    r.deleted = true; r.updated_at = now;
    this.meta.dirty[id] = now;
    this.bump(); this.persist(); this.emit('local');
    H.Sync && H.Sync.schedule();
  },
  // nhận bản ghi từ server (last-write-wins)
  applyRemote(row) {
    const cur = this.recs[row.id];
    if (cur && cur.updated_at > row.updated_at) return false;
    if (cur && this.meta.dirty[row.id] && this.meta.dirty[row.id] > row.updated_at) return false;
    this.recs[row.id] = { id: row.id, kind: row.kind, data: row.data, updated_at: row.updated_at, deleted: !!row.deleted };
    if (this.meta.dirty[row.id] && this.meta.dirty[row.id] <= row.updated_at) delete this.meta.dirty[row.id];
    this.bump();
    return true;
  }
};

/* ---------- Cài đặt ---------- */
H.DEFAULT_SETTINGS = {
  id: 'settings', dailyMin: 120, restDays: [], tz: 'Asia/Ho_Chi_Minh',
  reminders: [{ time: '06:00', on: true }, { time: '20:00', on: true }],
  evening: { on: true, time: '21:30' }
};
H.settings = () => Object.assign({}, H.DEFAULT_SETTINGS, Store.get('settings') || {});
H.saveSettings = patch => Store.put('settings', Object.assign(H.settings(), patch, { id: 'settings' }));

/* ---------- Màu kỹ năng ---------- */
H.COLORS = [
  { c: '#4F46E5', s: '#ECEBFC' }, { c: '#0F8B8D', s: '#E0F2F2' }, { c: '#D9480F', s: '#FCEAE1' },
  { c: '#9C36B5', s: '#F4E6F7' }, { c: '#2F9E44', s: '#E5F4E8' }, { c: '#C2255C', s: '#F9E4EB' }, { c: '#1C7ED6', s: '#E3F0FB' }
];
H.soft = c => (H.COLORS.find(x => x.c === c) || { s: '#EEEEEA' }).s;
H.TYPES = { planning: { label: 'Lập kế hoạch', icon: 'plan' }, coding: { label: 'Lập trình', icon: 'code' }, sport: { label: 'Thể thao', icon: 'sport' }, other: { label: 'Khác', icon: 'target' } };
H.LEVELS = ['Chưa biết', 'Biết lý thuyết', 'Làm được khi có hướng dẫn', 'Tự làm được, còn chậm', 'Nhanh và ổn định', 'Thành thạo, dạy được người khác'];
H.REVIEW_STEPS = [1, 3, 7, 14, 30, 60];

H.createSkillFromSpec = (spec) => {
  const skills = Store.all('skill');
  const used = new Set(skills.map(s => s.color));
  const color = spec.color && !used.has(spec.color) ? spec.color : (H.COLORS.find(c => !used.has(c.c)) || H.COLORS[skills.length % H.COLORS.length]).c;
  const skill = Store.put('skill', {
    id: H.uid(), name: spec.name, type: spec.type || 'other', color, goal: spec.goal || '', targetDate: spec.targetDate || '',
    dailyMin: spec.dailyMin || 30, archived: false, createdAt: H.today(), order: skills.length
  }, { silent: true });
  (spec.subs || []).forEach((s, i) => {
    const o = Array.isArray(s) ? { name: s[0], desc: s[1], importance: s[2], drills: s[3], model: s[4] } : s;
    Store.put('subskill', {
      id: H.uid(), skillId: skill.id, name: o.name, desc: o.desc || '', importance: H.clamp(o.importance || 2, 1, 3),
      drills: o.drills || [], model: o.model || '', level: H.clamp(o.level || 0, 0, 5), levelHistory: [{ d: H.today(), l: H.clamp(o.level || 0, 0, 5) }],
      review: null, lastPracticed: null, order: i, levels: o.levels || null
    }, { silent: true });
  });
  (spec.benches || []).forEach(b => {
    const o = Array.isArray(b) ? { name: b[0], unit: b[1], higherBetter: b[2], howTo: b[3] } : b;
    Store.put('benchmark', { id: H.uid(), skillId: skill.id, name: o.name, unit: o.unit || '', higherBetter: o.higherBetter !== false, howTo: o.howTo || '', everyDays: 14 }, { silent: true });
  });
  (spec.cards || []).forEach(c => H.newCard(skill.id, c.front, c.back, true));
  Store.emit('local');
  return skill;
};

/* ---------- Truy vấn ---------- */
H.skills = () => Store.all('skill').filter(s => !s.archived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
H.subsOf = sid => Store.memo('sub:' + sid, () => Store.all('subskill').filter(s => s.skillId === sid).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
H.sessions = () => Store.memo('sessions', () => Store.all('session').sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || '')));
H.sessionsOfSkill = sid => Store.memo('ss:' + sid, () => H.sessions().filter(s => s.skillId === sid));
H.sessionsOfSub = id => Store.memo('su:' + id, () => H.sessions().filter(s => s.subId === id));
H.minutesOn = day => H.minutesByDay()[day] || 0;
H.minutesByDay = () => Store.memo('byDay', () => { const m = {}; H.sessions().forEach(s => { m[s.day] = (m[s.day] || 0) + (s.minutes || 0); }); return m; });
H.streak = () => {
  const m = H.minutesByDay(); const rest = new Set(H.settings().restDays || []);
  let d = H.today(), n = 0;
  if (!m[d]) d = H.addDays(d, -1);
  for (let i = 0; i < 1000; i++) {
    if (m[d]) n++; else if (!rest.has(H.parseDay(d).getDay())) break;
    d = H.addDays(d, -1);
  }
  return n;
};
H.skillLevel = sid => { const subs = H.subsOf(sid); return subs.length ? H.avg(subs.map(s => s.level || 0)) : 0; };
H.skillMinutes = sid => H.sum(H.sessionsOfSkill(sid).map(s => s.minutes));

/* ---------- Ưu tiên kỹ năng con ---------- */
H.subPriority = (sub) => {
  const lvl = sub.level || 0; if (lvl >= 5) return -1;
  const since = sub.lastPracticed ? H.diffDays(H.today(), sub.lastPracticed) : 14;
  return (5 - lvl) * (sub.importance || 2) * 2 + Math.min(since, 14) * 0.6;
};
H.pickSub = sid => { const subs = H.subsOf(sid).filter(s => (s.level || 0) < 5); subs.sort((a, b) => H.subPriority(b) - H.subPriority(a)); return subs[0] || null; };
H.dueReviews = (day = H.today()) => Store.all('subskill').filter(s => s.review && s.review.due && s.review.due <= day && H.Store.get(s.skillId) && !H.Store.get(s.skillId).archived);
H.dueCards = (day = H.today(), sid = null) => Store.all('card').filter(c => (c.due || '') <= day && (!sid || c.skillId === sid) && H.Store.get(c.skillId));

/* ---------- Ôn giãn cách cho kỹ năng con ---------- */
H.ensureReview = (sub) => {
  if ((sub.level || 0) >= 3 && !sub.review) sub.review = { stage: 0, due: H.addDays(H.today(), H.REVIEW_STEPS[0]) };
  if ((sub.level || 0) < 3) sub.review = null;
  return sub;
};
H.gradeReview = (sub, good) => {
  if (!sub.review) return sub;
  if (good) { const st = Math.min(sub.review.stage + 1, H.REVIEW_STEPS.length - 1); sub.review = { stage: st, due: H.addDays(H.today(), H.REVIEW_STEPS[st]) }; }
  else { sub.review = { stage: 0, due: H.addDays(H.today(), 1) }; }
  return sub;
};
H.setLevel = (sub, lvl) => {
  sub.level = H.clamp(lvl, 0, 5);
  sub.levelHistory = (sub.levelHistory || []).filter(h => h.d !== H.today()).concat([{ d: H.today(), l: sub.level }]);
  H.ensureReview(sub);
  Store.put('subskill', sub);
};

/* ---------- Vùng độ khó & gợi ý nâng mức ---------- */
H.zone = (rate, n) => {
  if (!n) return { key: 'none', label: 'Chưa có lần thử', cls: '' };
  if (rate < 0.6) return { key: 'hard', label: 'Quá khó → giảm độ khó', cls: 'bad' };
  if (rate <= 0.85) return { key: 'good', label: 'Vừa sức → giữ nguyên', cls: 'ok' };
  return { key: 'easy', label: 'Quá dễ → tăng độ khó', cls: 'warn' };
};
H.levelUpCheck = (subId) => {
  const ss = H.sessionsOfSub(subId).filter(s => s.type === 'deliberate' && (s.attempts || 0) >= 5).slice(0, 3);
  if (ss.length < 3) return false;
  return ss.every(s => s.success / s.attempts >= 0.85);
};

/* ---------- Thẻ tự kiểm tra (SM-2 rút gọn) ---------- */
H.newCard = (skillId, front, back, silent) => Store.put('card', { id: H.uid(), skillId, front, back, ef: 2.5, interval: 0, reps: 0, lapses: 0, due: H.today(), created: H.today() }, { silent });
H.gradeCard = (card, g) => { // g: 1 Quên, 2 Khó, 3 Được, 4 Dễ
  const q = [0, 1, 3, 4, 5][g];
  if (q < 3) { card.reps = 0; card.interval = 1; card.lapses = (card.lapses || 0) + 1; }
  else {
    card.reps = (card.reps || 0) + 1;
    if (card.reps === 1) card.interval = 1; else if (card.reps === 2) card.interval = 3; else card.interval = Math.round(card.interval * card.ef);
    if (g === 4) card.interval = Math.round(card.interval * 1.3) || 2;
  }
  card.ef = Math.max(1.3, (card.ef || 2.5) + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  card.due = H.addDays(H.today(), card.interval);
  card.last = H.today();
  Store.put('card', card);
};
H.cardPreview = (card, g) => { const c = Object.assign({}, card); const q = [0, 1, 3, 4, 5][g]; if (q < 3) return 1; const reps = (c.reps || 0) + 1; let iv = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(c.interval * c.ef); if (g === 4) iv = Math.round(iv * 1.3) || 2; return iv; };

/* ---------- Test mốc ---------- */
H.benchResults = bid => Store.all('bench_result').filter(r => r.benchId === bid).sort((a, b) => a.date.localeCompare(b.date));
H.benchDue = (b) => { const rs = H.benchResults(b.id); if (!rs.length) return true; return H.diffDays(H.today(), rs[rs.length - 1].date) >= (b.everyDays || 14); };

/* ---------- Kế hoạch hôm nay ---------- */
H.buildPlan = () => {
  const st = H.settings(); const today = H.today();
  const skills = H.skills();
  const isRest = (st.restDays || []).includes(new Date().getDay());
  const blocks = [];
  const cardsDue = H.dueCards().length;
  const reviewsDue = H.dueReviews();
  let budget = st.dailyMin || 120;
  if (isRest) return { isRest: true, blocks: cardsDue ? [{ kind: 'cards', min: 10, title: 'Ôn thẻ nhẹ nhàng', meta: `${cardsDue} thẻ đến hạn` }] : [], budget };
  if (cardsDue) { const m = cardsDue > 30 ? 15 : 10; blocks.push({ kind: 'cards', min: m, title: 'Khởi động: tự kiểm tra bằng thẻ', meta: `${cardsDue} thẻ đến hạn` }); budget -= m; }
  const benchDue = [];
  skills.forEach(s => Store.all('benchmark').filter(b => b.skillId === s.id).forEach(b => { if (H.benchDue(b) && H.benchResults(b.id).length) benchDue.push({ b, s }); }));
  const deliberate = [];
  const w = H.sum(skills.map(s => s.dailyMin || 30)) || 1;
  const reviewMin = reviewsDue.length ? H.clamp(reviewsDue.length * 5, 10, 20) : 0;
  const benchMin = benchDue.length ? 15 : 0;
  const pool = Math.max(budget - reviewMin - benchMin, 0);
  skills.forEach(s => {
    const sub = H.pickSub(s.id);
    let min = Math.max(15, Math.round((pool * (s.dailyMin || 30) / w) / 5) * 5);
    let note = '';
    if (s.type === 'sport') {
      const y = H.sessionsOfSkill(s.id).find(x => x.day === H.addDays(today, -1) && (x.rpe || 0) >= 8);
      if (y) note = `Hôm qua tập nặng (RPE ${y.rpe}) → hôm nay tập kỹ thuật nhẹ hoặc phục hồi.`;
    }
    if (sub) deliberate.push({ kind: 'deliberate', min, skillId: s.id, subId: sub.id, title: sub.name, skillName: s.name, color: s.color, meta: `${s.name} · mức ${sub.level || 0}/5`, note });
  });
  blocks.push(...deliberate);
  if (reviewsDue.length) blocks.push({ kind: 'review', min: reviewMin, title: 'Ôn xen kẽ kỹ năng con đến hạn', meta: reviewsDue.slice(0, 3).map(r => r.name).join(' · ') + (reviewsDue.length > 3 ? ` +${reviewsDue.length - 3}` : ''), subs: reviewsDue.map(r => r.id) });
  if (benchDue.length) blocks.push({ kind: 'bench', min: benchMin, title: 'Bài test mốc', meta: benchDue.map(x => x.b.name).slice(0, 2).join(' · '), skillId: benchDue[0].s.id, benchId: benchDue[0].b.id });
  // trạng thái hoàn thành
  const todays = H.sessions().filter(s => s.day === today);
  blocks.forEach(b => {
    let done = 0;
    if (b.kind === 'deliberate') done = H.sum(todays.filter(s => s.skillId === b.skillId && s.type === 'deliberate').map(s => s.minutes));
    if (b.kind === 'cards') done = H.sum(todays.filter(s => s.type === 'cards').map(s => s.minutes));
    if (b.kind === 'review') done = H.sum(todays.filter(s => s.type === 'review').map(s => s.minutes));
    if (b.kind === 'bench') done = todays.some(s => s.type === 'benchmark') ? b.min : 0;
    b.done = done; b.complete = done >= b.min * 0.8;
  });
  return { isRest: false, blocks, budget: st.dailyMin || 120, planned: H.sum(blocks.map(b => b.min)) };
};

/* ---------- Nhật ký lỗi ---------- */
H.errorLog = (sid) => {
  const cnt = {};
  H.sessionsOfSkill(sid).forEach(s => {
    [s.mainError, ...(s.errors || [])].filter(Boolean).forEach(e => {
      const k = e.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!k) return; cnt[k] = cnt[k] || { text: e.trim(), n: 0, last: s.day, sub: s.subId }; cnt[k].n++; if (s.day > cnt[k].last) cnt[k].last = s.day;
    });
  });
  return Object.values(cnt).sort((a, b) => b.n - a.n || b.last.localeCompare(a.last));
};

/* ---------- Toast & sheet ---------- */
H.toast = (msg, action) => {
  const w = document.getElementById('toast-wrap'); const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span>${H.esc(msg)}</span>${action ? `<button>${H.esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { action.fn(); t.remove(); };
  w.appendChild(t); setTimeout(() => t.remove(), action ? 7000 : 3200);
};
H.openSheet = (html, { onMount, wide } = {}) => {
  const root = document.getElementById('sheet-root');
  document.body.classList.add('sheet-open');
  root.innerHTML = `<div class="sheet-bg" data-sheet-bg><div class="sheet" role="dialog" aria-modal="true" ${wide ? 'style="max-width:760px"' : ''}><div class="grab"></div>${html}</div></div>`;
  const bg = root.firstElementChild;
  bg.addEventListener('click', e => { if (e.target === bg) H.closeSheet(); });
  const f = bg.querySelector('input,textarea,select'); if (f && matchMedia('(min-width:1024px)').matches) setTimeout(() => f.focus(), 50);
  onMount && onMount(bg.querySelector('.sheet'));
  return bg.querySelector('.sheet');
};
H.closeSheet = () => { document.getElementById('sheet-root').innerHTML = ''; document.body.classList.remove('sheet-open'); };
H.sheetOpen = () => !!document.querySelector('#sheet-root .sheet');
H.confirm = (msg, okLabel = 'Đồng ý', danger) => new Promise(res => {
  const sh = H.openSheet(`<h2 style="margin-bottom:8px">${H.esc(msg)}</h2><div class="sheet-foot"><button class="btn" data-no>Hủy</button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes>${H.esc(okLabel)}</button></div>`);
  sh.querySelector('[data-no]').onclick = () => { H.closeSheet(); res(false); };
  sh.querySelector('[data-yes]').onclick = () => { H.closeSheet(); res(true); };
});

/* ---------- Âm báo ---------- */
H.beep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach(t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.22); });
  } catch { }
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch { }
};
