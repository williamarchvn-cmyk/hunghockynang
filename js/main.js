/* main.js — điều hướng, vẽ màn hình, sự kiện, PWA */
'use strict';
(() => {
  const H = window.H, S = H.Store, I = H.icon, V = H.Views, A = H.Act;
  const NAV = [
    { r: 'today', t: 'Hôm nay', i: 'today', k: '1' },
    { r: 'skills', t: 'Kỹ năng', i: 'skills', k: '2' },
    { r: 'practice', t: 'Tập', i: 'play', k: 'N', fab: true },
    { r: 'cards', t: 'Thẻ', i: 'cards', k: '3' },
    { r: 'stats', t: 'Thống kê', i: 'stats', k: '4' },
    { r: 'settings', t: 'Cài đặt', i: 'settings', k: '5', side: true }
  ];
  const parse = () => {
    const h = (location.hash || '#/today').slice(2); const [path, qs] = h.split('?');
    const [name, arg] = path.split('/'); return { name: name || 'today', arg, q: new URLSearchParams(qs || '') };
  };
  let lastRoute = '';
  H.render = () => {
    const { name, arg, q } = parse();
    const view = document.getElementById('view');
    const keepScroll = lastRoute === location.hash;
    const y = window.scrollY;
    let html = '';
    try {
      switch (name) {
        case 'today': html = V.today(); break;
        case 'skills': html = V.skills(); break;
        case 'skill': html = V.skill(arg, q); break;
        case 'practice': html = V.practice(q); break;
        case 'session': html = V.session(); break;
        case 'cards': html = V.cards(q); break;
        case 'stats': html = V.stats(); break;
        case 'settings': html = V.settings(); break;
        default: html = V.today();
      }
    } catch (e) { console.error(e); html = `<div class="note bad">Có lỗi khi hiển thị: ${H.esc(e.message)}</div>`; }
    view.innerHTML = html;
    renderNav(name);
    H.Sync.setStatus(H.Sync.status, H.Sync.lastError);
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
    lastRoute = location.hash;
    document.title = ({ today: 'Hôm nay', skills: 'Kỹ năng', skill: 'Kỹ năng', practice: 'Tập', session: 'Đang tập', cards: 'Thẻ', stats: 'Thống kê', settings: 'Cài đặt' }[name] || '') + ' · Hùng học kỹ năng';
    updateWakeLock();
  };
  const renderNav = (name) => {
    const cur = name === 'skill' ? 'skills' : name === 'session' ? 'practice' : name;
    const live = !!S.local.active;
    document.getElementById('bottom-nav').innerHTML = NAV.filter(n => !n.side).map(n => n.fab
      ? `<button class="bn-fab ${live ? 'live' : ''}" data-act="nav" data-to="#/${live ? 'session' : 'practice'}" aria-label="${live ? 'Buổi tập đang chạy' : 'Bắt đầu tập'}">${I(live ? 'clock' : 'play')}</button>`
      : `<button class="bn-item ${cur === n.r ? 'active' : ''}" data-act="nav" data-to="#/${n.r}">${I(n.i)}<span>${n.t}</span></button>`).join('');
    document.getElementById('side-nav').innerHTML = NAV.filter(n => !n.fab).map(n => `<button class="sn-item ${cur === n.r ? 'active' : ''}" data-act="nav" data-to="#/${n.r}">${I(n.i)}<span>${n.t}</span><span class="kbd">${n.k}</span></button>`).join('')
      + `<button class="btn ${live ? 'ok' : 'primary'} block side-cta" data-act="nav" data-to="#/${live ? 'session' : 'practice'}">${I(live ? 'clock' : 'play')} ${live ? 'Đang tập…' : 'Bắt đầu tập'} <span class="kbd" style="color:inherit;border-color:rgba(255,255,255,.5)">N</span></button>`;
    document.getElementById('side-foot').innerHTML = `<span class="row" style="gap:8px"><span class="sync-dot" data-sync-dot></span><span data-sync-text class="trunc">${H.esc(H.Sync.label())}</span></span>`;
  };

  /* ---------- Sự kiện chung ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act;
    if (act === 'nav' && el.hasAttribute('data-keepgoal')) {
      const g = document.getElementById('goal'); let to = el.dataset.to;
      if (g && g.value.trim()) to += '&goal=' + encodeURIComponent(g.value.trim());
      e.preventDefault(); location.hash = to; return;
    }
    // nút chọn kiểu segment
    if (A[act]) { e.preventDefault(); Promise.resolve(A[act](el, e)).catch(err => { console.error(err); H.toast(err.message || String(err)); }); }
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-seg] > button, [data-seg] > .chip'); if (!b) return;
    const seg = b.parentElement; seg.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-change]'); if (!el) return;
    const fn = H.Change[el.dataset.change]; if (fn) Promise.resolve(fn(el, e)).catch(err => H.toast(err.message));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && H.sheetOpen()) { H.closeSheet(); return; }
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Enter' && e.target.id === 'err-in') { e.preventDefault(); A.addErr(); return; }
    if (['input', 'textarea', 'select'].includes(tag) || e.ctrlKey || e.metaKey || e.altKey || H.sheetOpen()) return;
    const { name } = parse();
    if (name === 'session' && S.local.active) {
      if (e.code === 'Space') { e.preventDefault(); A.hit({ dataset: { ok: '1' } }); return; }
      if (e.key === 'x' || e.key === 'X') { e.preventDefault(); A.hit({ dataset: { ok: '0' } }); return; }
    }
    if (name === 'cards' && document.querySelector('.flash')) {
      if (e.code === 'Space') { e.preventDefault(); A.flip(); return; }
      const g = document.querySelector(`.grade [data-g="${e.key}"]`); if (g) { e.preventDefault(); A.grade(g); return; }
    }
    const map = { '1': 'today', '2': 'skills', '3': 'cards', '4': 'stats', '5': 'settings', n: S.local.active ? 'session' : 'practice', N: S.local.active ? 'session' : 'practice' };
    if (map[e.key]) { e.preventDefault(); location.hash = '#/' + map[e.key]; }
  });
  window.addEventListener('hashchange', () => { H.closeSheet(); H.render(); });

  // vẽ lại khi dữ liệu đổi (trừ khi đang mở sheet hoặc đang gõ)
  const rerender = H.debounce(() => {
    const ae = document.activeElement; const typing = ae && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName) && document.getElementById('view').contains(ae);
    if (!H.sheetOpen() && !typing) H.render();
  }, 60);
  S.listeners.add(src => { if (src === 'auth') H.render(); else rerender(); });

  /* ---------- Đồng hồ buổi tập & giữ màn hình sáng ---------- */
  setInterval(() => H.tickSession(), 500);
  let wake = null;
  const updateWakeLock = async () => {
    const want = parse().name === 'session' && S.local.active && !S.local.active.pausedAt && document.visibilityState === 'visible';
    try {
      if (want && !wake && 'wakeLock' in navigator) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); }
      if (!want && wake) { await wake.release(); wake = null; }
    } catch { }
  };
  document.addEventListener('visibilitychange', () => { updateWakeLock(); if (document.visibilityState === 'visible') H.tickSession(); });

  /* ---------- PWA ---------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing; nw && nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) H.toast('Có phiên bản mới', { label: 'Cập nhật', fn: () => nw.postMessage('skipWaiting') });
        });
      });
    }).catch(e => console.warn('SW', e));
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
    navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'navigate') location.hash = e.data.hash; });
  }

  /* ---------- Khởi động ---------- */
  S.load();
  if (!location.hash) history.replaceState(null, '', '#/today');
  H.render();
  H.Sync.init().then(() => H.render()).catch(e => console.warn(e));
})();
