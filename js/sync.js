/* sync.js — đồng bộ Supabase, đăng nhập, Web Push */
'use strict';
(() => {
  const H = window.H, Store = H.Store;
  const Sync = H.Sync = {
    sb: null, user: null, status: 'off', lastError: '', channel: null, busy: false, timer: null,
    cfg() {
      const base = window.HHKN_CONFIG || {}; const ov = Store.local.cfg || {};
      return { supabaseUrl: ov.supabaseUrl || base.supabaseUrl || '', supabaseAnonKey: ov.supabaseAnonKey || base.supabaseAnonKey || '', vapidPublicKey: ov.vapidPublicKey || base.vapidPublicKey || '' };
    },
    configured() { const c = Sync.cfg(); return !!(c.supabaseUrl && c.supabaseAnonKey); },
    lib() {
      if (window.supabase) return Promise.resolve(window.supabase);
      return Sync._lib || (Sync._lib = new Promise((ok, fail) => { const sc = document.createElement('script'); sc.src = 'vendor/supabase.js'; sc.async = true; sc.onload = () => ok(window.supabase); sc.onerror = () => { Sync._lib = null; fail(new Error('Không tải được thư viện đồng bộ')); }; document.head.appendChild(sc); }));
    },
    setStatus(s, err = '') { Sync.status = s; Sync.lastError = err; document.querySelectorAll('[data-sync-dot]').forEach(el => { el.className = 'sync-dot ' + ({ ok: 'on', err: 'err', busy: 'busy' }[s] || ''); }); document.querySelectorAll('[data-sync-text]').forEach(el => el.textContent = Sync.label()); },
    label() { return ({ off: 'Chưa đồng bộ (chỉ lưu trên máy)', ok: 'Đã đồng bộ', busy: 'Đang đồng bộ…', err: 'Lỗi đồng bộ: ' + Sync.lastError, offline: 'Mất mạng — sẽ đồng bộ lại sau' }[Sync.status] || ''); },

    async init() {
      if (!Sync.configured()) { Sync.setStatus('off'); return; }
      const c = Sync.cfg();
      try { await Sync.lib(); } catch (e) { Sync.setStatus('err', e.message); return; }
      Sync.sb = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'hhkn-auth' } });
      const { data } = await Sync.sb.auth.getSession();
      Sync.user = data.session?.user || null;
      Sync.sb.auth.onAuthStateChange((_e, session) => {
        const was = Sync.user?.id; Sync.user = session?.user || null;
        if (Sync.user && Sync.user.id !== was) Sync.start();
        if (!Sync.user) { Sync.stopRealtime(); Sync.setStatus('off'); }
        Store.emit('auth');
      });
      if (Sync.user) Sync.start();
    },
    start() {
      if (Store.meta.syncedUser !== Sync.user.id) {
        // lần đầu đăng nhập trên máy này: đẩy toàn bộ dữ liệu cục bộ lên
        const now = new Date().toISOString();
        Object.values(Store.recs).forEach(r => { Store.meta.dirty[r.id] = Store.meta.dirty[r.id] || r.updated_at || now; });
        Store.meta.lastPull = null; Store.meta.syncedUser = Sync.user.id; Store.persist();
      }
      Sync.run();
      Sync.startRealtime();
      clearInterval(Sync.timer); Sync.timer = setInterval(() => Sync.run(), 60000);
    },
    schedule: H.debounce(() => Sync.run(), 1500),

    async run() {
      if (!Sync.sb || !Sync.user || Sync.busy) return;
      if (!navigator.onLine) { Sync.setStatus('offline'); return; }
      Sync.busy = true; Sync.setStatus('busy');
      try { await Sync.push(); const changed = await Sync.pull(); Sync.setStatus('ok'); if (changed) Store.emit('remote'); }
      catch (e) { console.error(e); Sync.setStatus('err', e.message || String(e)); }
      finally { Sync.busy = false; }
    },
    async push() {
      const ids = Object.keys(Store.meta.dirty); if (!ids.length) return;
      const snapshot = { ...Store.meta.dirty };
      for (let i = 0; i < ids.length; i += 200) {
        const rows = ids.slice(i, i + 200).map(id => Store.recs[id]).filter(Boolean).map(r => ({ user_id: Sync.user.id, id: r.id, kind: r.kind, data: r.data, updated_at: r.updated_at, deleted: !!r.deleted }));
        if (!rows.length) continue;
        const { error } = await Sync.sb.from('records').upsert(rows, { onConflict: 'user_id,id' });
        if (error) throw new Error(error.message);
      }
      ids.forEach(id => { if (Store.meta.dirty[id] === snapshot[id]) delete Store.meta.dirty[id]; });
      Store.persist();
    },
    async pull() {
      let changed = false, since = Store.meta.lastPull;
      for (let page = 0; page < 50; page++) {
        let q = Sync.sb.from('records').select('id,kind,data,updated_at,deleted,server_at').order('server_at', { ascending: true }).limit(1000);
        if (since) q = q.gt('server_at', new Date(new Date(since).getTime() - 5000).toISOString());
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        if (!data.length) break;
        data.forEach(row => { if (Store.applyRemote(row)) changed = true; });
        const maxAt = data[data.length - 1].server_at;
        if (maxAt === since) break;
        since = maxAt;
        if (data.length < 1000) break;
      }
      if (since) Store.meta.lastPull = since;
      Store.persist();
      return changed;
    },
    startRealtime() {
      Sync.stopRealtime();
      try {
        Sync.channel = Sync.sb.channel('hhkn-records').on('postgres_changes', { event: '*', schema: 'public', table: 'records', filter: `user_id=eq.${Sync.user.id}` }, p => {
          if (p.new && p.new.id && Store.applyRemote(p.new)) { Store.persist(); Store.emit('remote'); }
        }).subscribe();
      } catch (e) { console.warn('realtime', e); }
    },
    stopRealtime() { if (Sync.channel) { try { Sync.sb.removeChannel(Sync.channel); } catch { } Sync.channel = null; } },

    async signIn(email, password) { const { error } = await Sync.sb.auth.signInWithPassword({ email, password }); if (error) throw new Error(error.message); },
    async signUp(email, password) { const { data, error } = await Sync.sb.auth.signUp({ email, password }); if (error) throw new Error(error.message); return data; },
    async signOut() { await Sync.sb.auth.signOut(); },

    /* ----- Web Push ----- */
    pushSupported() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; },
    async pushState() {
      if (!Sync.pushSupported()) return 'unsupported';
      if (Notification.permission === 'denied') return 'denied';
      const reg = await navigator.serviceWorker.getRegistration(); if (!reg) return 'nosw';
      const sub = await reg.pushManager.getSubscription(); return sub ? 'on' : 'off';
    },
    async enablePush() {
      if (!Sync.pushSupported()) throw new Error('Trình duyệt này không hỗ trợ thông báo đẩy. Trên điện thoại, hãy cài app ra màn hình chính bằng Chrome.');
      const key = Sync.cfg().vapidPublicKey; if (!key) throw new Error('Chưa có VAPID public key (config.js hoặc Cài đặt → Đồng bộ).');
      if (!Sync.user) throw new Error('Cần đăng nhập để server gửi nhắc tập.');
      const perm = await Notification.requestPermission(); if (perm !== 'granted') throw new Error('Bạn chưa cho phép thông báo.');
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(key) });
      const j = sub.toJSON();
      const { error } = await Sync.sb.from('push_subscriptions').upsert({ user_id: Sync.user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, device: deviceName() }, { onConflict: 'endpoint' });
      if (error) throw new Error(error.message);
    },
    async disablePush() {
      const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription();
      if (sub) { if (Sync.sb && Sync.user) await Sync.sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe(); }
    },
    async testLocal() {
      if (Notification.permission !== 'granted') { const p = await Notification.requestPermission(); if (p !== 'granted') throw new Error('Bạn chưa cho phép thông báo.'); }
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('Hùng học kỹ năng', { body: 'Thông báo trên máy này hoạt động tốt.', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'test' });
    },
    async testServer() {
      const { data } = await Sync.sb.auth.getSession(); const token = data.session?.access_token;
      const res = await fetch(`${Sync.cfg().supabaseUrl}/functions/v1/send-reminders?test=1`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, apikey: Sync.cfg().supabaseAnonKey, 'Content-Type': 'application/json' }, body: '{}' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Edge Function lỗi ${res.status}`);
      return j;
    }
  };
  function b64ToU8(s) { const p = '='.repeat((4 - s.length % 4) % 4); const b = (s + p).replace(/-/g, '+').replace(/_/g, '/'); const raw = atob(b); return Uint8Array.from([...raw].map(c => c.charCodeAt(0))); }
  function deviceName() { const ua = navigator.userAgent; if (/SM-S918|Android/.test(ua)) return 'Điện thoại Android'; if (/Windows/.test(ua)) return 'Laptop Windows'; if (/Linux/.test(ua)) return 'Laptop Linux'; return 'Thiết bị khác'; }
  window.addEventListener('online', () => Sync.run());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') Sync.run(); });
})();
