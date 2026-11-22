/* views.js — các màn hình và thao tác */
'use strict';
(() => {
  const H = window.H, S = H.Store, I = H.icon, esc = H.esc, C = H.Charts;
  const V = H.Views = {};
  const A = H.Act = {};
  const typeIcon = t => I((H.TYPES[t] || H.TYPES.other).icon);
  const skillChip = s => `<span class="chip" style="background:${H.soft(s.color)};color:${s.color}"><span class="dot" style="background:${s.color}"></span>${esc(s.name)}</span>`;
  const lvlMeter = (l, c) => `<span class="lvl" style="--c:${c}" aria-label="Mức ${l}/5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= l ? 'on' : ''}"></i>`).join('')}</span>`;
  const empty = (icon, title, text, btn = '') => `<div class="empty"><div class="em-ico">${I(icon)}</div><h3>${esc(title)}</h3>${text ? `<p class="small">${text}</p>` : ''}${btn ? `<div style="margin-top:14px">${btn}</div>` : ''}</div>`;
  const val = (root, name) => { const el = root.querySelector(`[name="${name}"]`); return el ? el.value.trim() : ''; };
  const go = h => { location.hash = h; };
  H.go = go;
  const active = () => S.local.active || null;
  const elapsedMs = a => (a.pausedAt || Date.now()) - a.startTs - (a.pausedTotal || 0);
  const mobileHeadBtns = () => `<div class="head-actions mobile-only"><span class="sync-dot" data-sync-dot title="Đồng bộ"></span><button class="icon-btn" data-act="nav" data-to="#/settings" aria-label="Cài đặt">${I('settings')}</button></div>`;

  /* =================== HÔM NAY =================== */
  V.today = () => {
    const st = H.settings(); const plan = H.buildPlan(); const skills = H.skills();
    const mins = H.minutesOn(H.today()); const streak = H.streak();
    const cardsDue = H.dueCards().length, revDue = H.dueReviews().length;
    const d = new Date();
    const a = active();
    let html = `<div class="page-head"><div><div class="eyebrow">${H.WD[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}</div><h1>${H.greeting()}, Hùng</h1></div>${mobileHeadBtns()}</div>`;
    if (a) {
      const sk = S.get(a.skillId);
      html += `<div class="card click" data-act="nav" data-to="#/session" style="border-color:var(--ok);margin-bottom:14px"><div class="row"><div class="skill-ico" style="--cs:var(--ok-soft);--c:var(--ok)">${I('clock')}</div><div class="grow" style="flex:1"><div style="font-weight:600">Đang có buổi tập${sk ? ' · ' + esc(sk.name) : ''}</div><div class="small muted num" data-live-clock>${H.fmtClock(elapsedMs(a))}</div></div><button class="btn ok sm">Tiếp tục</button></div></div>`;
    }
    if (!skills.length) {
      return html + `<div class="card">${empty('target', 'Chưa có kỹ năng', '', `<button class="btn primary" data-act="newSkill">${I('plus')} Thêm kỹ năng</button>`)}</div>`;
    }
    const pct = Math.min(mins / (st.dailyMin || 120), 1);
    const notes = V.nextNotes();
    html += `<div class="grid bento">
      <div class="card span-5"><div class="hero">${C.ring(mins, st.dailyMin, { size: 116, label: H.fmtMinShort(mins), sub: `/ ${H.fmtMinShort(st.dailyMin)}`, color: pct >= 1 ? 'var(--ok)' : 'var(--accent)' })}
        <div class="stack" style="gap:10px;flex:1">
          <div><div class="small muted">Tiến độ hôm nay</div><div style="font-weight:600">${pct >= 1 ? 'Đã đủ mục tiêu, tuyệt!' : `Còn ${H.fmtMin(Math.max((st.dailyMin || 120) - mins, 0))}`}</div></div>
          <div class="stats-row"><div class="stat"><span class="v num">${streak}</span><span class="k">chuỗi ngày</span></div><div class="stat"><span class="v num">${cardsDue}</span><span class="k">thẻ đến hạn</span></div><div class="stat"><span class="v num">${revDue}</span><span class="k">cần ôn</span></div></div>
        </div></div></div>
      <div class="card span-7"><div class="card-head"><h2>${I('plan')} Kế hoạch hôm nay</h2><span class="chip num">${H.fmtMinShort(plan.planned || 0)}</span></div>${V.planBlocks(plan)}</div>
      ${notes}
      <div class="${notes ? 'span-5' : 'span-12'} stack">${V.skillMini(skills)}${V.topErrors()}</div>
    </div>`;
    return html;
  };
  V.planBlocks = (plan) => {
    if (plan.isRest) return `<div class="note acc">Ngày nghỉ</div>${plan.blocks.length ? '<div style="height:10px"></div>' : ''}` + plan.blocks.map(V.blockRow).join('');
    if (!plan.blocks.length) return `<div class="note">Chưa có khối nào.</div>`;
    return plan.blocks.map((b, i) => V.blockRow(b)).join('');
  };
  V.blockRow = (b) => {
    const color = b.color || (b.kind === 'cards' ? '#6A6B70' : b.kind === 'review' ? 'var(--warn)' : b.kind === 'bench' ? 'var(--ok)' : 'var(--accent)');
    const icon = { cards: 'cards', review: 'repeat', bench: 'flag', deliberate: 'target' }[b.kind];
    const act = b.kind === 'cards' ? `data-act="nav" data-to="#/cards"` : `data-act="startBlock" data-kind="${b.kind}" data-skill="${b.skillId || ''}" data-sub="${b.subId || ''}" data-min="${b.min}" data-bench="${b.benchId || ''}"`;
    return `<div class="block ${b.complete ? 'done' : ''}" style="--c:${color}"><span class="bar-c"></span>
      <div class="grow"><div class="title" style="font-weight:600">${esc(b.title)}</div><div class="meta">${I(icon, 'xs')} ${esc(b.meta || '')} · ${b.min} phút${b.done && !b.complete ? ` · đã tập ${Math.round(b.done)}p` : ''}</div>${b.note ? `<div class="note warn small" style="margin-top:8px">${esc(b.note)}</div>` : ''}</div>
      ${b.complete ? `<span class="chip ok">${I('check', 'xs')} Xong</span>` : `<button class="btn sm ${b.kind === 'deliberate' ? 'primary' : ''}" ${act} aria-label="Bắt đầu">${I('play', 'xs')}<span class="hide-sm">Bắt đầu</span></button>`}</div>`;
  };
  V.nextNotes = () => {
    const items = H.skills().map(s => { const last = H.sessionsOfSkill(s.id).find(x => x.nextTime); return last ? { s, last } : null; }).filter(Boolean);
    if (!items.length) return '';
    return `<div class="card span-7"><div class="card-head"><h2>${I('flag')} Lần trước tự dặn</h2></div>` + (`<div class="list">${items.map(({ s, last }) => `<div class="li"><span class="dot" style="background:${s.color}"></span><div class="grow"><div class="title small">${esc(last.nextTime)}</div><div class="sub">${esc(s.name)}${last.subId && S.get(last.subId) ? ' · ' + esc(S.get(last.subId).name) : ''} · ${H.fmtDay(last.day)}</div></div></div>`).join('')}</div></div>`);
  };
  V.skillMini = (skills) => `<div class="card"><div class="card-head"><h2>${I('skills')} Kỹ năng</h2><button class="btn ghost sm" data-act="nav" data-to="#/skills">Xem tất cả</button></div><div class="stack" style="gap:14px">${skills.map(s => { const l = H.skillLevel(s.id); return `<div class="click" data-act="nav" data-to="#/skill/${s.id}" style="cursor:pointer"><div class="row" style="margin-bottom:6px"><span class="dot" style="background:${s.color}"></span><span style="font-weight:600;flex:1">${esc(s.name)}</span><span class="small muted num">${l.toFixed(1)}/5</span></div><div class="bar" style="--c:${s.color}"><span style="width:${l / 5 * 100}%"></span></div></div>`; }).join('')}</div></div>`;
  V.topErrors = () => {
    const errs = H.skills().flatMap(s => H.errorLog(s.id).map(e => Object.assign({ skill: s }, e))).filter(e => e.n >= 2).sort((a, b) => b.n - a.n).slice(0, 4);
    if (!errs.length) return '';
    return `<div class="card"><div class="card-head"><h2>${I('bug')} Lỗi lặp lại</h2></div><div class="list">${errs.map(e => `<div class="li"><span class="chip bad num">${e.n}×</span><div class="grow"><div class="small" style="font-weight:600">${esc(e.text)}</div><div class="sub">${esc(e.skill.name)}</div></div></div>`).join('')}</div></div>`;
  };

  A.startBlock = (el) => {
    const k = el.dataset.kind;
    const q = new URLSearchParams({ type: k === 'bench' ? 'benchmark' : k, skill: el.dataset.skill, sub: el.dataset.sub, min: el.dataset.min, bench: el.dataset.bench });
    go('#/practice?' + q.toString());
  };
  A.nav = el => go(el.dataset.to);

  /* =================== KỸ NĂNG =================== */
  V.skills = () => {
    const skills = H.skills(); const arch = S.all('skill').filter(s => s.archived);
    let html = `<div class="page-head"><div><div class="eyebrow">${skills.length} kỹ năng đang học</div><h1>Kỹ năng</h1></div><div class="head-actions"><button class="btn primary" data-act="newSkill">${I('plus')} <span>Thêm</span></button></div></div>`;
    if (!skills.length) html += `<div class="card">${empty('skills', 'Chưa có kỹ năng', '', `<button class="btn primary" data-act="newSkill">${I('plus')} Thêm kỹ năng</button>`)}</div>`;
    html += `<div class="grid g2 g3">${skills.map(s => {
      const subs = H.subsOf(s.id); const l = H.skillLevel(s.id); const due = subs.filter(x => x.review && x.review.due <= H.today()).length;
      const next = H.pickSub(s.id); const m7 = H.sum(H.sessionsOfSkill(s.id).filter(x => x.day > H.addDays(H.today(), -7)).map(x => x.minutes));
      return `<div class="card click skill-card" data-act="nav" data-to="#/skill/${s.id}" style="--c:${s.color};--cs:${H.soft(s.color)}"><span class="tag"></span>
        <div class="row" style="margin-bottom:12px"><div class="skill-ico">${typeIcon(s.type)}</div><div style="flex:1;min-width:0"><h3 class="trunc">${esc(s.name)}</h3><div class="small muted">${subs.length} kỹ năng con · ${s.dailyMin} phút/ngày</div></div>${C.ring(l, 5, { size: 52, stroke: 6, color: s.color, label: l.toFixed(1) })}</div>
        <div class="row wrap" style="gap:6px">${next ? `<span class="chip acc">${I('target', 'xs')} ${esc(next.name)}</span>` : ''}${due ? `<span class="chip warn">${due} cần ôn</span>` : ''}<span class="chip num">7 ngày: ${H.fmtMinShort(m7)}</span></div></div>`;
    }).join('')}</div>`;
    if (arch.length) html += `<h3 style="margin:24px 0 10px" class="muted">Đã lưu trữ</h3><div class="card"><div class="list">${arch.map(s => `<div class="li click" data-act="nav" data-to="#/skill/${s.id}"><span class="dot" style="background:${s.color}"></span><div class="grow">${esc(s.name)}</div>${I('chev')}</div>`).join('')}</div></div>`;
    return html;
  };

  A.newSkill = () => A.editSkill(null);
  A.closeSheet = () => H.closeSheet();

  const typeSeg = (sel) => `<div class="seg" data-seg="type">${Object.entries(H.TYPES).map(([k, t]) => `<button type="button" data-v="${k}" class="${k === sel ? 'sel' : ''}">${t.label}</button>`).join('')}</div>`;
  const segVal = (root, name) => root.querySelector(`[data-seg="${name}"] .sel`)?.dataset.v;

  A.editSkill = (el) => {
    const s = el && el.dataset ? S.get(el.dataset.id) : null;
    const used = new Set(H.skills().map(x => x.color));
    const color = s ? s.color : (H.COLORS.find(c => !used.has(c.c)) || H.COLORS[0]).c;
    H.openSheet(`<div class="sheet-head"><h2>${s ? 'Sửa kỹ năng' : 'Thêm kỹ năng'}</h2><button class="icon-btn" data-act="closeSheet">${I('x')}</button></div>
      <div class="form" data-id="${s ? s.id : ''}">
        <div class="field"><label>Tên kỹ năng</label><input class="input" name="name" value="${esc(s?.name || '')}"></div>
        <div class="field"><label>Nhóm</label>${typeSeg(s?.type || 'other')}</div>
        <div class="field"><label>Màu</label><div class="chips" data-seg="color">${H.COLORS.map(c => `<button type="button" class="chip ${c.c === color ? 'sel' : ''}" data-v="${c.c}" style="width:40px;padding:0;justify-content:center" aria-label="Màu ${c.c}"><span class="dot" style="background:${c.c};width:18px;height:18px"></span></button>`).join('')}</div></div>
        <div class="field"><label>Mục tiêu thuần thục</label><textarea class="input" name="goal">${esc(s?.goal || '')}</textarea></div>
        <div class="two"><div class="field"><label>Phút/ngày</label><input class="input" type="number" name="dailyMin" min="5" step="5" value="${s?.dailyMin || 30}"></div><div class="field"><label>Ngày mục tiêu</label><input class="input" type="date" name="targetDate" value="${esc(s?.targetDate || '')}"></div></div>
        ${s ? '' : `<div class="field"><label>Kỹ năng con (mỗi dòng một)</label><textarea class="input" name="subs" rows="5"></textarea></div>`}
      </div>
      <div class="sheet-foot">${s ? `<button class="btn danger" data-act="archiveSkill" data-id="${s.id}">${s.archived ? 'Bỏ lưu trữ' : 'Lưu trữ'}</button>` : ''}<button class="btn primary" data-act="saveSkill">${I('check')} Lưu</button></div>
      ${s ? `<button class="btn ghost danger block" style="margin-top:10px" data-act="deleteSkill" data-id="${s.id}">${I('trash')} Xóa kỹ năng và toàn bộ dữ liệu</button>` : ''}`);
  };
  A.saveSkill = (el) => {
    const sh = el.closest('.sheet'); const f = sh.querySelector('.form'); const name = val(sh, 'name'); if (!name) return H.toast('Nhập tên kỹ năng');
    const color = sh.querySelector('[data-seg="color"] .sel')?.dataset.v;
    if (f.dataset.id) { const s = S.get(f.dataset.id); Object.assign(s, { name, type: segVal(sh, 'type'), color, goal: val(sh, 'goal'), dailyMin: +val(sh, 'dailyMin') || 30, targetDate: val(sh, 'targetDate') }); S.put('skill', s); H.closeSheet(); }
    else { const subs = val(sh, 'subs').split('\n').map(t => t.trim()).filter(Boolean).map(n => ({ name: n, importance: 2 }));
      const sk = H.createSkillFromSpec({ name, type: segVal(sh, 'type'), color, goal: val(sh, 'goal'), dailyMin: +val(sh, 'dailyMin') || 30, targetDate: val(sh, 'targetDate'), subs }); H.closeSheet(); go('#/skill/' + sk.id); }
  };
  A.archiveSkill = el => { const s = S.get(el.dataset.id); s.archived = !s.archived; S.put('skill', s); H.closeSheet(); H.toast(s.archived ? 'Đã lưu trữ' : 'Đã khôi phục'); };
  A.deleteSkill = async el => {
    const id = el.dataset.id; const s = S.get(id);
    if (!await H.confirm(`Xóa "${s.name}" và toàn bộ kỹ năng con, buổi tập, thẻ, test mốc?`, 'Xóa', true)) return;
    ['subskill', 'session', 'card', 'benchmark', 'bench_result'].forEach(k => S.all(k).filter(x => x.skillId === id).forEach(x => S.del(x.id)));
    S.del(id); go('#/skills');
  };

  /* ----- Chi tiết kỹ năng ----- */
  V.skill = (id, q) => {
    const s = S.get(id); if (!s) return `<div class="card">${empty('skills', 'Không tìm thấy kỹ năng', '', `<button class="btn" data-act="nav" data-to="#/skills">Về danh sách</button>`)}</div>`;
    const tab = q.get('tab') || 'subs';
    const subs = H.subsOf(id); const l = H.skillLevel(id); const next = H.pickSub(id);
    const totalMin = H.skillMinutes(id);
    const daysLeft = s.targetDate ? H.diffDays(s.targetDate, H.today()) : null;
    let html = `<button class="back" data-act="nav" data-to="#/skills">${I('back')} Kỹ năng</button>
    <div class="page-head"><div class="row" style="gap:14px"><div class="skill-ico" style="--c:${s.color};--cs:${H.soft(s.color)};width:48px;height:48px">${typeIcon(s.type)}</div><div><div class="eyebrow">${H.TYPES[s.type]?.label || ''}${s.archived ? ' · đã lưu trữ' : ''}</div><h1>${esc(s.name)}</h1></div></div>
      <div class="head-actions"><button class="icon-btn" data-act="editSkill" data-id="${s.id}" aria-label="Sửa">${I('edit')}</button><button class="btn primary" data-act="practiceSkill" data-id="${s.id}">${I('play')} <span>Tập</span></button></div></div>
    <div class="grid bento" style="margin-bottom:16px">
      <div class="card span-8"><div class="lbl" style="margin-bottom:6px">Thuần thục là</div><p>${esc(s.goal || '—')}</p>
        <div class="row wrap" style="margin-top:12px;gap:6px"><span class="chip num">${s.dailyMin} phút/ngày</span><span class="chip num">Đã tập ${H.fmtMin(totalMin)}</span>${daysLeft !== null ? `<span class="chip ${daysLeft < 0 ? 'bad' : 'acc'} num">${daysLeft >= 0 ? `Còn ${daysLeft} ngày` : `Quá hạn ${-daysLeft} ngày`}</span>` : ''}</div></div>
      <div class="card span-4"><div class="row">${C.ring(l, 5, { size: 84, stroke: 9, color: s.color, label: l.toFixed(1), sub: '/5' })}<div style="flex:1"><div class="small muted">Mức trung bình</div>${next ? `<div class="small" style="margin-top:6px">Nên tập tiếp: <b>${esc(next.name)}</b></div>` : ''}</div></div></div>
    </div>
    <div class="tabs">${[['subs', 'Kỹ năng con'], ['bench', 'Test mốc'], ['errors', 'Nhật ký lỗi'], ['history', 'Lịch sử']].map(([k, t]) => `<button class="chip ${k === tab ? 'sel' : ''}" data-act="nav" data-to="#/skill/${id}?tab=${k}">${t}</button>`).join('')}</div>`;
    if (tab === 'subs') {
      html += `<div class="card"><div class="card-head"><h2>Kỹ năng con</h2><button class="btn sm" data-act="editSub" data-skill="${id}">${I('plus')} Thêm</button></div>`;
      html += subs.length ? subs.map(x => {
        const due = x.review && x.review.due <= H.today();
        return `<div class="sub-item" data-act="editSub" data-id="${x.id}"><div style="flex:1;min-width:0"><div class="row" style="gap:8px"><span style="font-weight:600" class="trunc">${esc(x.name)}</span>${next && next.id === x.id ? `<span class="chip acc xs">Nên tập</span>` : ''}${due ? `<span class="chip warn xs">Cần ôn</span>` : ''}</div><div class="small muted trunc">${esc(H.LEVELS[x.level || 0])}${x.lastPracticed ? ' · tập ' + H.fmtDayL(x.lastPracticed) : ''}</div></div>${lvlMeter(x.level || 0, s.color)}</div>`;
      }).join('') : empty('target', 'Chưa có kỹ năng con', '');
      html += `</div>`;
    }
    if (tab === 'bench') {
      const bs = S.all('benchmark').filter(b => b.skillId === id);
      html += `<div class="row" style="justify-content:flex-end;margin-bottom:12px"><button class="btn sm" data-act="editBench" data-skill="${id}">${I('plus')} Thêm test mốc</button></div><div class="grid g2">`;
      html += bs.length ? bs.map(b => {
        const rs = H.benchResults(b.id); const last = rs[rs.length - 1]; const first = rs[0];
        const delta = rs.length > 1 ? last.value - first.value : 0; const good = b.higherBetter ? delta > 0 : delta < 0;
        return `<div class="card"><div class="card-head"><div style="min-width:0"><h3>${esc(b.name)}</h3><div class="small muted">${b.higherBetter ? 'Càng cao càng tốt' : 'Càng thấp càng tốt'} · mỗi ${b.everyDays || 14} ngày</div></div><button class="icon-btn" data-act="editBench" data-id="${b.id}" aria-label="Sửa">${I('edit')}</button></div>
          <div class="row" style="align-items:baseline;gap:8px;margin-bottom:8px"><span style="font-size:26px;font-weight:700" class="num">${last ? last.value : '—'}</span><span class="muted">${esc(b.unit)}</span>${rs.length > 1 ? `<span class="chip ${good ? 'ok' : 'bad'} num">${delta > 0 ? '+' : ''}${+delta.toFixed(2)} từ lần đầu</span>` : ''}${H.benchDue(b) ? `<span class="chip warn">Đến hạn đo</span>` : ''}</div>
          ${C.line(rs.map(r => ({ x: r.date, y: r.value })), { color: s.color, height: 140 })}
          ${b.howTo ? `<p class="small muted" style="margin-top:8px">${esc(b.howTo)}</p>` : ''}
          <div class="row" style="margin-top:12px"><button class="btn sm primary" data-act="addBenchResult" data-id="${b.id}">${I('plus')} Ghi kết quả</button><button class="btn sm" data-act="nav" data-to="#/practice?type=benchmark&skill=${id}&bench=${b.id}&min=15">${I('clock')} Đo có bấm giờ</button></div></div>`;
      }).join('') : `<div class="card">${empty('flag', 'Chưa có test mốc', '')}</div>`;
      html += `</div>`;
    }
    if (tab === 'errors') {
      const errs = H.errorLog(id);
      html += `<div class="card"><div class="card-head"><h2>${I('bug')} Nhật ký lỗi</h2></div>${errs.length ? `<div class="list">${errs.map(e => `<div class="li"><span class="chip ${e.n >= 3 ? 'bad' : e.n === 2 ? 'warn' : ''} num">${e.n}×</span><div class="grow"><div class="title small">${esc(e.text)}</div><div class="sub">${e.sub && S.get(e.sub) ? esc(S.get(e.sub).name) + ' · ' : ''}gần nhất ${H.fmtDayL(e.last)}</div></div></div>`).join('')}</div>` : empty('bug', 'Chưa ghi lỗi nào', '')}</div>`;
    }
    if (tab === 'history') html += `<div class="card">${V.sessionList(H.sessionsOfSkill(id), 60)}</div>`;
    return html;
  };
  V.sessionList = (list, max = 30) => {
    if (!list.length) return empty('clock', 'Chưa có buổi tập', '');
    const typeLb = { deliberate: 'Có chủ đích', review: 'Ôn xen kẽ', benchmark: 'Test mốc', cards: 'Thẻ' };
    return `<div class="list">${list.slice(0, max).map(x => { const sub = x.subId && S.get(x.subId); const rate = x.attempts ? x.success / x.attempts : null; return `<div class="li"><div class="grow"><div class="title small">${esc(x.goal || sub?.name || typeLb[x.type])}</div><div class="sub">${H.fmtDay(x.day)} · ${typeLb[x.type] || ''}${sub ? ' · ' + esc(sub.name) : ''}${x.focus ? ' · tập trung ' + x.focus + '/5' : ''}${x.rpe ? ' · RPE ' + x.rpe : ''}</div>${x.mainError ? `<div class="sub" style="color:var(--bad)">Lỗi: ${esc(x.mainError)}</div>` : ''}</div><div style="text-align:right"><div class="num" style="font-weight:600">${H.fmtMinShort(x.minutes)}</div>${rate !== null ? `<div class="xs num ${rate < .6 ? '' : ''}" style="color:${rate < .6 ? 'var(--bad)' : rate <= .85 ? 'var(--ok)' : 'var(--warn)'}">${x.success}/${x.attempts}</div>` : ''}</div><button class="icon-btn" style="width:34px;height:34px" data-act="delSession" data-id="${x.id}" aria-label="Xóa">${I('trash', 'xs')}</button></div>`; }).join('')}</div>`;
  };
  A.delSession = async el => { if (await H.confirm('Xóa buổi tập này?', 'Xóa', true)) S.del(el.dataset.id); };
  A.practiceSkill = el => { const sub = H.pickSub(el.dataset.id); go(`#/practice?type=deliberate&skill=${el.dataset.id}${sub ? '&sub=' + sub.id : ''}`); };

  /* ----- Kỹ năng con ----- */
  A.editSub = (el) => {
    const x = el.dataset.id ? S.get(el.dataset.id) : null; const skillId = x ? x.skillId : el.dataset.skill; const s = S.get(skillId);
    const lvl = x ? x.level || 0 : 0;
    H.openSheet(`<div class="sheet-head"><h2>${x ? 'Kỹ năng con' : 'Thêm kỹ năng con'}</h2><button class="icon-btn" data-act="closeSheet">${I('x')}</button></div>
      <div class="form" data-id="${x ? x.id : ''}" data-skill="${skillId}">
        <div class="field"><label>Tên</label><input class="input" name="name" value="${esc(x?.name || '')}"></div>
        <div class="field"><label>Mô tả</label><input class="input" name="desc" value="${esc(x?.desc || '')}"></div>
        <div class="field"><label>Mức hiện tại</label><div class="lvl-pick" data-seg="lvl">${[0, 1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" class="${i === lvl ? 'sel' : ''}">${i}</button>`).join('')}</div><div class="hint" data-lvl-desc>${esc(H.LEVELS[lvl])}</div></div>
        <div class="field"><label>Độ quan trọng</label><div class="seg" data-seg="imp">${[[1, 'Thấp'], [2, 'Vừa'], [3, 'Cao']].map(([v, t]) => `<button type="button" data-v="${v}" class="${(x?.importance || 2) === v ? 'sel' : ''}">${t}</button>`).join('')}</div></div>
        <div class="field"><label>Bài tập gợi ý (mỗi dòng một bài)</label><textarea class="input" name="drills" rows="3">${esc((x?.drills || []).join('\n'))}</textarea></div>
        <div class="field"><label>Mẫu chuẩn để so sánh</label><textarea class="input" name="model" rows="2">${esc(x?.model || '')}</textarea></div>
        ${x && x.review ? `<div class="note ${x.review.due <= H.today() ? 'warn' : ''} small">Lịch ôn: bước ${x.review.stage + 1}/${H.REVIEW_STEPS.length}, ôn lại vào ${H.fmtDayL(x.review.due)}.</div>` : ''}
        ${x && (x.levelHistory || []).length > 1 ? `<div><div class="lbl" style="margin-bottom:4px">Tiến trình mức</div>${C.sparkLevels(x, s.color)}</div>` : ''}
      </div>
      <div class="sheet-foot">${x ? `<button class="btn danger" data-act="delSub" data-id="${x.id}" aria-label="Xóa">${I('trash')}</button><button class="btn" data-act="practiceSub" data-id="${x.id}">${I('play')} Tập</button>` : ''}<button class="btn primary" data-act="saveSub">${I('check')} Lưu</button></div>`,
      { onMount: sh => sh.querySelectorAll('[data-seg="lvl"] button').forEach(b => b.addEventListener('click', () => { sh.querySelector('[data-lvl-desc]').textContent = H.LEVELS[+b.dataset.v]; })) });
  };
  A.saveSub = (el) => {
    const sh = el.closest('.sheet'); const f = sh.querySelector('.form'); const name = val(sh, 'name'); if (!name) return H.toast('Nhập tên kỹ năng con');
    const lvl = +(segVal(sh, 'lvl') || 0);
    const x = f.dataset.id ? S.get(f.dataset.id) : { id: H.uid(), skillId: f.dataset.skill, level: lvl, levelHistory: [], review: null, lastPracticed: null, order: H.subsOf(f.dataset.skill).length };
    Object.assign(x, { name, desc: val(sh, 'desc'), importance: +(segVal(sh, 'imp') || 2), drills: val(sh, 'drills').split('\n').map(t => t.trim()).filter(Boolean), model: val(sh, 'model') });
    if (!f.dataset.id || x.level !== lvl || !(x.levelHistory || []).length) H.setLevel(x, lvl); else S.put('subskill', H.ensureReview(x));
    H.closeSheet();
  };
  A.delSub = async el => { if (await H.confirm('Xóa kỹ năng con này?', 'Xóa', true)) { S.del(el.dataset.id); } };
  A.practiceSub = el => { const x = S.get(el.dataset.id); H.closeSheet(); go(`#/practice?type=deliberate&skill=${x.skillId}&sub=${x.id}`); };

  /* ----- Test mốc ----- */
  A.editBench = (el) => {
    const b = el.dataset.id ? S.get(el.dataset.id) : null; const skillId = b ? b.skillId : el.dataset.skill;
    H.openSheet(`<div class="sheet-head"><h2>${b ? 'Sửa test mốc' : 'Thêm test mốc'}</h2><button class="icon-btn" data-act="closeSheet">${I('x')}</button></div>
      <div class="form" data-id="${b ? b.id : ''}" data-skill="${skillId}">
        <div class="field"><label>Tên bài test</label><input class="input" name="name" value="${esc(b?.name || '')}"></div>
        <div class="two"><div class="field"><label>Đơn vị</label><input class="input" name="unit" value="${esc(b?.unit || '')}" placeholder="phút, %, lần"></div><div class="field"><label>Đo lại sau (ngày)</label><input class="input" type="number" name="every" value="${b?.everyDays || 14}" min="1"></div></div>
        <div class="field"><label>Chiều tốt</label><div class="seg" data-seg="dir"><button type="button" data-v="1" class="${!b || b.higherBetter ? 'sel' : ''}">Càng cao càng tốt</button><button type="button" data-v="0" class="${b && !b.higherBetter ? 'sel' : ''}">Càng thấp càng tốt</button></div></div>
        <div class="field"><label>Cách đo</label><textarea class="input" name="howTo">${esc(b?.howTo || '')}</textarea></div>
      </div>
      <div class="sheet-foot">${b ? `<button class="btn danger" data-act="delBench" data-id="${b.id}">${I('trash')}</button>` : ''}<button class="btn primary" data-act="saveBench">${I('check')} Lưu</button></div>`);
  };
  A.saveBench = el => {
    const sh = el.closest('.sheet'); const f = sh.querySelector('.form'); const name = val(sh, 'name'); if (!name) return H.toast('Nhập tên bài test');
    const b = f.dataset.id ? S.get(f.dataset.id) : { id: H.uid(), skillId: f.dataset.skill };
    Object.assign(b, { name, unit: val(sh, 'unit'), everyDays: +val(sh, 'every') || 14, higherBetter: segVal(sh, 'dir') !== '0', howTo: val(sh, 'howTo') });
    S.put('benchmark', b); H.closeSheet();
  };
  A.delBench = async el => { if (await H.confirm('Xóa test mốc và các kết quả?', 'Xóa', true)) { H.benchResults(el.dataset.id).forEach(r => S.del(r.id)); S.del(el.dataset.id); H.closeSheet(); } };
  A.addBenchResult = el => {
    const b = S.get(el.dataset.id);
    H.openSheet(`<div class="sheet-head"><h2>${esc(b.name)}</h2><button class="icon-btn" data-act="closeSheet">${I('x')}</button></div>
      ${b.howTo ? `<div class="note small" style="margin-bottom:12px">${esc(b.howTo)}</div>` : ''}
      <div class="form"><div class="two"><div class="field"><label>Kết quả (${esc(b.unit)})</label><input class="input" type="number" step="any" name="value" inputmode="decimal"></div><div class="field"><label>Ngày</label><input class="input" type="date" name="date" value="${H.today()}"></div></div>
      <div class="field"><label>Ghi chú</label><input class="input" name="note"></div></div>
      <div class="sheet-foot"><button class="btn primary" data-act="saveBenchResult" data-id="${b.id}">${I('check')} Lưu kết quả</button></div>`);
  };
  A.saveBenchResult = el => {
    const sh = el.closest('.sheet'); const v = parseFloat(val(sh, 'value')); if (isNaN(v)) return H.toast('Nhập kết quả');
    const b = S.get(el.dataset.id);
    S.put('bench_result', { id: H.uid(), benchId: b.id, skillId: b.skillId, date: val(sh, 'date') || H.today(), value: v, note: val(sh, 'note') });
    H.closeSheet(); H.toast('Đã lưu kết quả test mốc');
  };

  /* =================== CHUẨN BỊ BUỔI TẬP =================== */
  V.practice = (q) => {
    if (active()) return V.session();
    const skills = H.skills();
    if (!skills.length) return `<div class="card">${empty('target', 'Chưa có kỹ năng', '', `<button class="btn primary" data-act="newSkill">${I('plus')} Thêm kỹ năng</button>`)}</div>`;
    const type = q.get('type') || 'deliberate';
    const skillId = q.get('skill') && S.get(q.get('skill')) ? q.get('skill') : skills[0].id;
    const s = S.get(skillId);
    const subs = H.subsOf(skillId);
    const subId = q.get('sub') && S.get(q.get('sub')) ? q.get('sub') : (H.pickSub(skillId) || {}).id;
    const sub = subId ? S.get(subId) : null;
    const min = +(q.get('min') || (type === 'review' ? 15 : type === 'benchmark' ? 15 : 30));
    const P = (o) => { const n = new URLSearchParams(q); Object.entries(o).forEach(([k, v]) => v === null ? n.delete(k) : n.set(k, v)); return '#/practice?' + n.toString(); };
    const last = sub ? H.sessionsOfSub(sub.id).find(x => x.nextTime || x.mainError) : null;
    let html = `<div class="page-head"><div><h1>Tập</h1></div><div class="head-actions"><button class="btn" data-act="logManual">${I('edit')} <span>Ghi buổi đã tập</span></button></div></div>
    <div class="session">
      <div class="seg">${[['deliberate', 'Có chủ đích'], ['review', 'Ôn xen kẽ'], ['benchmark', 'Test mốc']].map(([k, t]) => `<button class="${k === type ? 'sel' : ''}" data-act="nav" data-to="${P({ type: k, min: null })}">${t}</button>`).join('')}</div>`;
    if (type !== 'review') html += `<div class="card"><div class="lbl" style="margin-bottom:8px">Kỹ năng</div><div class="chips">${skills.map(x => `<button class="chip ${x.id === skillId ? 'sel' : ''}" data-act="nav" data-to="${P({ skill: x.id, sub: null, bench: null })}"><span class="dot" style="background:${x.color}"></span>${esc(x.name)}</button>`).join('')}</div></div>`;

    if (type === 'deliberate') {
      html += `<div class="card"><div class="lbl" style="margin-bottom:8px">Kỹ năng con</div>${subs.length ? `<select class="input" data-change="pickSub">${subs.map(x => `<option value="${x.id}" ${x.id === subId ? 'selected' : ''}>${esc(x.name)} · mức ${x.level || 0}/5${H.pickSub(skillId)?.id === x.id ? ' · nên tập' : ''}</option>`).join('')}</select>` : `<div class="note">Chưa có kỹ năng con · <a href="#/skill/${skillId}">Thêm</a></div>`}
        ${sub && sub.model ? `<div class="note small" style="margin-top:10px">${I('book', 'xs')} <b>Mẫu chuẩn:</b> ${esc(sub.model)}</div>` : ''}
        ${last ? `<div class="note acc small" style="margin-top:10px">${I('flag', 'xs')} <b>Lần trước (${H.fmtDayL(last.day)}):</b> ${last.nextTime ? esc(last.nextTime) : ''}${last.mainError ? ` · lỗi chính: ${esc(last.mainError)}` : ''}</div>` : ''}</div>`;
      html += `<div class="card"><div class="card-head"><h3>Mục tiêu buổi này</h3></div>
        <textarea class="input" id="goal">${esc(q.get('goal') || '')}</textarea>
        ${V.goalSuggestions(sub)}</div>`;
    }
    if (type === 'review') {
      const due = H.dueReviews(); const pool = due.length ? due : [];
      html += `<div class="card"><div class="card-head"><h3>${I('repeat')} Kỹ năng con đến hạn ôn</h3><span class="chip">${pool.length}</span></div>
        ${pool.length ? `<div class="stack" style="gap:6px">${pool.map(x => { const sk = S.get(x.skillId); return `<label class="sub-item"><input type="checkbox" checked data-review="${x.id}" style="width:20px;height:20px"><div style="flex:1"><div style="font-weight:600" class="small">${esc(x.name)}</div><div class="xs muted">${esc(sk.name)} · mức ${x.level}/5</div></div>${lvlMeter(x.level, sk.color)}</label>`; }).join('')}</div>` : `<div class="note ok">Không có kỹ năng con đến hạn ôn.</div>`}</div>`;
    }
    if (type === 'benchmark') {
      const bs = S.all('benchmark').filter(b => b.skillId === skillId);
      const bid = q.get('bench') && S.get(q.get('bench')) ? q.get('bench') : bs[0]?.id;
      const b = bid ? S.get(bid) : null;
      html += `<div class="card"><div class="lbl" style="margin-bottom:8px">Bài test</div>${bs.length ? `<div class="chips">${bs.map(x => `<button class="chip ${x.id === bid ? 'sel' : ''}" data-act="nav" data-to="${P({ bench: x.id })}">${esc(x.name)}</button>`).join('')}</div>${b && b.howTo ? `<div class="note small" style="margin-top:10px">${esc(b.howTo)}</div>` : ''}` : `<div class="note">Chưa có test mốc · <a href="#/skill/${skillId}?tab=bench">Thêm</a></div>`}</div>`;
    }
    html += `<div class="card"><div class="lbl" style="margin-bottom:8px">Thời lượng</div><div class="chips">${[10, 15, 25, 30, 45, 60, 90].map(m => `<button class="chip ${m === min ? 'sel' : ''}" data-act="nav" data-to="${P({ min: m, goal: null })}" data-keepgoal>${m} phút</button>`).join('')}</div></div>
      <button class="btn primary lg block" data-act="startSession" data-type="${type}" data-skill="${skillId}" data-sub="${subId || ''}" data-min="${min}" data-bench="${q.get('bench') || ''}">${I('play')} Bắt đầu ${min} phút</button>
    </div>`;
    return html;
  };
  H.Change = {
    pickSub: (el) => { const q = new URLSearchParams(location.hash.split('?')[1] || ''); q.set('sub', el.value); const g = document.getElementById('goal'); if (g && g.value) q.set('goal', g.value); go('#/practice?' + q.toString()); }
  };
  // Gợi ý mục tiêu dựa trên dữ liệu của chính bạn (không dùng AI)
  V.goalSuggestions = (sub) => {
    if (!sub) return '';
    const items = []; const hist = H.sessionsOfSub(sub.id);
    const lastNext = hist.find(x => x.nextTime); if (lastNext) items.push({ tag: 'Lần trước dặn', t: lastNext.nextTime, cls: 'acc' });
    const errs = H.errorLog(sub.skillId).filter(e => e.sub === sub.id && e.n >= 2).slice(0, 2);
    errs.forEach(e => items.push({ tag: `Lỗi lặp ${e.n}×`, t: `Sửa lỗi: ${e.text}`, cls: 'bad' }));
    const lastDel = hist.find(x => x.type === 'deliberate' && x.goal && x.attempts >= 5);
    if (lastDel) { const r = lastDel.success / lastDel.attempts; const z = H.zone(r, lastDel.attempts); const pre = z.key === 'easy' ? 'Khó hơn: ' : z.key === 'hard' ? 'Chia nhỏ hơn: ' : 'Lặp lại: '; items.push({ tag: `Buổi trước ${H.pct(r)}`, t: pre + lastDel.goal.replace(/^(Khó hơn|Chia nhỏ hơn|Lặp lại): /, ''), cls: z.cls }); }
    (sub.drills || []).forEach(d => items.push({ tag: 'Bài tập', t: d, cls: '' }));
    const seen = new Set(); const uniq = items.filter(x => !seen.has(x.t) && seen.add(x.t));
    if (!uniq.length) return '';
    return `<div class="lbl" style="margin:12px 0 8px">Gợi ý</div><div class="stack" style="gap:6px">${uniq.slice(0, 6).map(x => `<button class="sub-item sugg" data-act="pickDrill" data-t="${esc(x.t)}"><span class="chip xs ${x.cls}">${esc(x.tag)}</span><span class="small" style="flex:1">${esc(x.t)}</span></button>`).join('')}</div>`;
  };
  A.pickDrill = el => { const g = document.getElementById('goal'); g.value = el.dataset.t; g.focus(); };
  A.startSession = el => {
    const type = el.dataset.type; const goalEl = document.getElementById('goal');
    let goal = goalEl ? goalEl.value.trim() : '';
    let reviewSubs = [];
    if (type === 'review') { reviewSubs = [...document.querySelectorAll('[data-review]:checked')].map(c => c.dataset.review); if (!reviewSubs.length) return H.toast('Chọn ít nhất 1 kỹ năng con để ôn'); goal = 'Ôn xen kẽ: ' + reviewSubs.map(id => S.get(id).name).join(' → '); }
    if (type === 'deliberate' && !el.dataset.sub) return H.toast('Cần chọn kỹ năng con');
    if (type === 'deliberate' && !goal) { goalEl.focus(); return H.toast('Nhập mục tiêu'); }
    if (type === 'benchmark') { const b = S.get(el.dataset.bench) || S.all('benchmark').find(x => x.skillId === el.dataset.skill); if (!b) return H.toast('Chưa có bài test mốc'); el.dataset.bench = b.id; goal = 'Test mốc: ' + b.name; }
    const skillId = type === 'review' ? S.get(reviewSubs[0]).skillId : el.dataset.skill;
    S.local.active = { type, skillId, subId: type === 'deliberate' ? el.dataset.sub : null, benchId: el.dataset.bench || null, reviewSubs, goal, plannedMin: +el.dataset.min, startTs: Date.now(), pausedAt: null, pausedTotal: 0, attempts: 0, success: 0, errors: [], alerted: false };
    S.saveLocal(); go('#/session');
  };

  /* =================== ĐANG TẬP =================== */
  V.session = () => {
    const a = active(); if (!a) { setTimeout(() => go('#/practice'), 0); return ''; }
    const s = S.get(a.skillId); const sub = a.subId ? S.get(a.subId) : null;
    const rate = a.attempts ? a.success / a.attempts : 0; const z = H.zone(rate, a.attempts);
    const left = a.plannedMin * 60000 - elapsedMs(a);
    return `<div class="session">
      <div class="row"><div style="flex:1;min-width:0"><div class="eyebrow small muted">${{ deliberate: 'Luyện tập có chủ đích', review: 'Ôn xen kẽ', benchmark: 'Test mốc' }[a.type]}</div><h2 class="trunc">${s ? esc(s.name) : ''}${sub ? ' · ' + esc(sub.name) : ''}</h2></div>${s ? skillChip(s) : ''}</div>
      <div class="goal-box">${I('target', 'xs')} ${esc(a.goal)}</div>
      <div class="card"><div class="timer-wrap"><div class="timer num" data-timer style="color:${left < 0 ? 'var(--ok)' : 'var(--ink)'}">${H.fmtClock(left)}</div><div class="small muted num" data-timer-sub>${left < 0 ? 'Đã đủ thời gian' : `Đã tập ${H.fmtClock(elapsedMs(a))} / ${a.plannedMin} phút`}</div>
        <div class="row"><button class="btn" data-act="pauseSession">${a.pausedAt ? I('play') + ' Tiếp tục' : I('pause') + ' Tạm dừng'}</button><button class="btn ok" data-act="finishSession">${I('stop')} Kết thúc</button></div></div></div>
      ${a.type !== 'benchmark' ? `<div class="counter"><button class="yes" data-act="hit" data-ok="1">${I('check')} Đạt<small class="num">${a.success} lần</small></button><button class="no" data-act="hit" data-ok="0">${I('x')} Trượt<small class="num">${a.attempts - a.success} lần</small></button></div>
      <div class="card"><div class="row" style="margin-bottom:10px"><span style="font-weight:600">Tỉ lệ đạt</span><span class="num" style="font-weight:700">${a.attempts ? H.pct(rate) : '—'}</span><span class="spacer"></span><span class="chip ${z.cls}">${z.label}</span></div>
        <div class="zone"><i></i><i></i><i></i>${a.attempts ? `<span class="pin" style="left:${rate * 100}%"></span>` : ''}</div><div class="zone-legend"><span>&lt;60% quá khó</span><span>60–85% vừa sức</span><span>&gt;85%</span></div>
        ${a.attempts ? `<button class="btn ghost sm" style="margin-top:6px" data-act="undoHit">${I('back', 'xs')} Hoàn tác lần cuối</button>` : ''}</div>` : ''}
      <div class="card"><div class="card-head"><h3>${I('bug')} Ghi lỗi</h3></div><div class="row"><input class="input" id="err-in" enterkeyhint="done"><button class="btn" data-act="addErr">${I('plus')}</button></div>
        ${a.errors.length ? `<div class="chips" style="margin-top:10px">${a.errors.map((e, i) => `<span class="chip bad">${esc(e)} <button style="border:0;background:none;color:inherit;cursor:pointer;padding:0" data-act="rmErr" data-i="${i}" aria-label="Xóa">×</button></span>`).join('')}</div>` : ''}</div>
      ${sub && sub.model ? `<div class="note small">${I('book', 'xs')} <b>Mẫu chuẩn:</b> ${esc(sub.model)}</div>` : ''}
      <button class="btn ghost danger" data-act="cancelSession">Hủy buổi tập</button>
    </div>`;
  };
  const saveA = (rerender = true) => { S.saveLocal(); if (rerender) H.render(); };
  A.hit = el => { const a = active(); a.attempts++; if (el.dataset.ok === '1') a.success++; a.hist = (a.hist || []).concat(el.dataset.ok === '1' ? 1 : 0); saveA(); try { navigator.vibrate && navigator.vibrate(15); } catch { } };
  A.undoHit = () => { const a = active(); const h = a.hist || []; if (!h.length) return; const l = h.pop(); a.attempts--; if (l) a.success--; saveA(); };
  A.addErr = () => { const inp = document.getElementById('err-in'); const t = inp.value.trim(); if (!t) return; active().errors.push(t); saveA(); setTimeout(() => document.getElementById('err-in')?.focus(), 0); };
  A.rmErr = el => { active().errors.splice(+el.dataset.i, 1); saveA(); };
  A.pauseSession = () => { const a = active(); if (a.pausedAt) { a.pausedTotal += Date.now() - a.pausedAt; a.pausedAt = null; } else a.pausedAt = Date.now(); saveA(); };
  A.cancelSession = async () => { if (await H.confirm('Hủy buổi tập này? Dữ liệu buổi sẽ không được lưu.', 'Hủy buổi', true)) { S.local.active = null; S.saveLocal(); go('#/today'); } };
  H.tickSession = () => {
    const a = active(); if (!a) return;
    document.querySelectorAll('[data-live-clock]').forEach(e => e.textContent = H.fmtClock(elapsedMs(a)));
    const t = document.querySelector('[data-timer]'); if (!t) return;
    const left = a.plannedMin * 60000 - elapsedMs(a);
    t.textContent = H.fmtClock(left); t.style.color = left < 0 ? 'var(--ok)' : 'var(--ink)';
    const sub = document.querySelector('[data-timer-sub]'); if (sub) sub.textContent = left < 0 ? 'Đã đủ thời gian' : `Đã tập ${H.fmtClock(elapsedMs(a))} / ${a.plannedMin} phút`;
    if (left <= 0 && !a.alerted && !a.pausedAt) {
      a.alerted = true; S.saveLocal(); H.beep();
      if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) navigator.serviceWorker.ready.then(r => r.showNotification('Hết giờ tập', { body: a.goal, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'timer' }));
      H.toast('Hết giờ!');
    }
  };

  /* ----- Kết thúc buổi: phản tư ----- */
  const focusSeg = (n, sel) => `<div class="seg" data-seg="${n}">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" class="${i === sel ? 'sel' : ''}">${i}</button>`).join('')}</div>`;
  const reflectForm = ({ a, s, manual }) => {
    const isSport = s && s.type === 'sport'; const mins = manual ? 30 : Math.max(1, Math.round(elapsedMs(a) / 60000));
    let h = `<div class="form">`;
    if (manual) {
      const skills = H.skills();
      h += `<div class="field"><label>Kỹ năng</label><select class="input" name="skill" data-change="manualSkill">${skills.map(x => `<option value="${x.id}" ${x.id === s.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Kỹ năng con</label><select class="input" name="sub">${H.subsOf(s.id).map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Mục tiêu đã tập</label><input class="input" name="goal"></div>
        <div class="two"><div class="field"><label>Số lần thử</label><input class="input" type="number" name="attempts" min="0" value="0"></div><div class="field"><label>Số lần đạt</label><input class="input" type="number" name="success" min="0" value="0"></div></div>
        <div class="field"><label>Ngày</label><input class="input" type="date" name="day" value="${H.today()}"></div>`;
    }
    h += `<div class="field"><label>Số phút thực tập</label><input class="input" type="number" name="minutes" min="1" value="${mins}"></div>`;
    if (!manual && a.type === 'benchmark') { const b = S.get(a.benchId); h += `<div class="field"><label>Kết quả test (${esc(b?.unit || '')})</label><input class="input" type="number" step="any" name="benchValue" inputmode="decimal"></div>`; }
    if (!manual && a.type === 'review') h += `<div class="field"><label>Ôn có tốt không?</label><div class="stack" style="gap:6px">${a.reviewSubs.map(id => `<div class="sub-item" style="cursor:default"><span class="small" style="flex:1;font-weight:600">${esc(S.get(id)?.name || '')}</span><div class="seg" data-seg="rv-${id}" style="width:170px"><button type="button" data-v="1" class="sel">Tốt</button><button type="button" data-v="0">Chưa tốt</button></div></div>`).join('')}</div></div>`;
    h += `<div class="field"><label>Mức tập trung</label>${focusSeg('focus', 4)}</div>`;
    if (isSport) h += `<div class="field"><label>RPE (1–10)</label><input class="input" type="range" name="rpe" min="1" max="10" value="6" oninput="this.nextElementSibling.textContent='RPE '+this.value"><div class="hint">RPE 6</div></div>`;
    h += `<div class="field"><label>Làm được gì?</label><input class="input" name="wentWell"></div>
      <div class="field"><label>Lỗi chính</label><input class="input" name="mainError" value="${esc(!manual && a.errors[0] ? a.errors[0] : '')}"></div>
      <div class="field"><label>Lần sau chỉnh gì?</label><input class="input" name="nextTime"></div></div>`;
    return h;
  };
  A.finishSession = () => {
    const a = active(); const s = S.get(a.skillId); const rate = a.attempts ? a.success / a.attempts : null;
    H.openSheet(`<div class="sheet-head"><h2>Kết thúc buổi tập</h2><button class="icon-btn" data-act="closeSheet">${I('x')}</button></div>
      ${rate !== null ? `<div class="note ${H.zone(rate, a.attempts).cls === 'ok' ? 'ok' : H.zone(rate, a.attempts).cls === 'bad' ? 'bad' : 'warn'}" style="margin-bottom:12px"><b class="num">${a.success}/${a.attempts} (${H.pct(rate)})</b> · ${H.zone(rate, a.attempts).label}</div>` : ''}
      ${reflectForm({ a, s })}
      <div class="sheet-foot"><button class="btn primary" data-act="saveSession">${I('check')} Lưu buổi tập</button></div>`);
  };
  A.logManual = () => {
    const s = H.skills()[0]; if (!s) return;
    H.openSheet(`<div class="sheet-head"><h2>Ghi buổi đã tập</h2><button class="icon-btn" data-act="closeSheet">${I('x')}</button></div>
      ${reflectForm({ a: null, s, manual: true })}
      <div class="sheet-foot"><button class="btn primary" data-act="saveManual">${I('check')} Lưu</button></div>`);
  };
  H.Change.manualSkill = el => { const sh = el.closest('.sheet'); sh.querySelector('[name="sub"]').innerHTML = H.subsOf(el.value).map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join(''); };
  const commonReflect = sh => ({ minutes: Math.max(1, +val(sh, 'minutes') || 1), focus: +(segVal(sh, 'focus') || 0), rpe: sh.querySelector('[name="rpe"]') ? +val(sh, 'rpe') : null, wentWell: val(sh, 'wentWell'), mainError: val(sh, 'mainError'), nextTime: val(sh, 'nextTime') });
  const afterSave = (subId) => {
    if (!subId) return;
    const sub = S.get(subId); if (!sub) return;
    const last = H.sessionsOfSub(subId)[0];
    if (H.levelUpCheck(subId) && (sub.level || 0) < 5) {
      H.toast(`Đạt ≥ 85% trong 3 buổi liền. Nâng "${sub.name}" lên mức ${(sub.level || 0) + 1}?`, { label: 'Nâng mức', fn: () => { H.setLevel(S.get(subId), (sub.level || 0) + 1); H.toast('Đã nâng mức'); } });
    } else if (last && last.attempts >= 5) {
      const z = H.zone(last.success / last.attempts, last.attempts);
      if (z.key === 'hard') H.toast('Đã lưu · hơi quá sức');
      else if (z.key === 'easy') H.toast('Đã lưu · hơi dễ');
      else H.toast('Đã lưu · vừa sức');
    } else H.toast('Đã lưu buổi tập');
  };
  A.saveSession = () => {
    const sh = document.querySelector('#sheet-root .sheet'); const a = active(); const r = commonReflect(sh);
    const day = H.dayStr(new Date(a.startTs));
    const rec = Object.assign({ id: H.uid(), type: a.type, skillId: a.skillId, subId: a.subId, goal: a.goal, day, startedAt: new Date(a.startTs).toISOString(), plannedMin: a.plannedMin, attempts: a.attempts, success: a.success, errors: a.errors, reviewSubs: a.reviewSubs }, r);
    if (a.type === 'benchmark') {
      const v = parseFloat(val(sh, 'benchValue'));
      if (!isNaN(v)) { const b = S.get(a.benchId); S.put('bench_result', { id: H.uid(), benchId: b.id, skillId: b.skillId, date: day, value: v, note: r.wentWell }, { silent: true }); rec.benchValue = v; }
    }
    if (a.type === 'review') a.reviewSubs.forEach(id => { const x = S.get(id); if (!x) return; H.gradeReview(x, segVal(sh, 'rv-' + id) !== '0'); x.lastPracticed = day; S.put('subskill', x, { silent: true }); });
    if (a.subId) { const x = S.get(a.subId); if (x) { x.lastPracticed = day; S.put('subskill', x, { silent: true }); } }
    S.local.active = null; S.saveLocal();
    S.put('session', rec);
    H.closeSheet(); go('#/today'); afterSave(a.subId);
  };
  A.saveManual = () => {
    const sh = document.querySelector('#sheet-root .sheet'); const r = commonReflect(sh);
    const skillId = val(sh, 'skill'), subId = val(sh, 'sub') || null; const day = val(sh, 'day') || H.today();
    const attempts = +val(sh, 'attempts') || 0; const success = Math.min(+val(sh, 'success') || 0, attempts);
    S.put('session', Object.assign({ id: H.uid(), type: 'deliberate', skillId, subId, goal: val(sh, 'goal'), day, startedAt: new Date(H.parseDay(day).getTime() + 12 * 36e5).toISOString(), plannedMin: r.minutes, attempts, success, errors: [], manual: true }, r));
    if (subId) { const x = S.get(subId); if (x && (!x.lastPracticed || x.lastPracticed < day)) { x.lastPracticed = day; S.put('subskill', x); } }
    H.closeSheet(); afterSave(subId);
  };

  /* =================== THẺ =================== */
  let run = null; // phiên ôn thẻ
  V.cards = (q) => {
    const sid = q.get('skill') || '';
    const skills = H.skills();
    if (run) return V.cardRun();
    const due = H.dueCards(H.today(), sid || null); const all = S.all('card').filter(c => !sid || c.skillId === sid);
    const filter = (q.get('f') || '').toLowerCase();
    const list = all.filter(c => !filter || (c.front + ' ' + c.back).toLowerCase().includes(filter)).sort((a, b) => (a.due || '').localeCompare(b.due || ''));
    return `<div class="page-head"><div><h1>Thẻ</h1></div><div class="head-actions"><button class="btn" data-act="bulkCards" data-skill="${sid}">${I('upload')} <span>Nhập nhiều</span></button><button class="btn primary" data-act="editCard" data-skill="${sid}">${I('plus')} <span>Thêm</span></button></div></div>
      <div class="tabs"><button class="chip ${!sid ? 'sel' : ''}" data-act="nav" data-to="#/cards">Tất cả</button>${skills.map(s => `<button class="chip ${s.id === sid ? 'sel' : ''}" data-act="nav" data-to="#/cards?skill=${s.id}"><span class="dot" style="background:${s.color}"></span>${esc(s.name)}</button>`).join('')}</div>
      <div class="grid bento">
        <div class="card span-12"><div class="hero">${C.ring(due.length ? 0 : 1, 1, { size: 100, stroke: 10, label: String(due.length), sub: 'đến hạn', color: due.length ? 'var(--warn)' : 'var(--ok)' })}<div class="stack" style="gap:8px;flex:1"><div class="small muted">${all.length} thẻ · ${all.filter(c => (c.reps || 0) >= 3).length} đã nhớ chắc</div><button class="btn primary block" data-act="startCards" data-skill="${sid}" ${due.length ? '' : 'disabled'}>${I('play')} Ôn ${due.length} thẻ</button></div></div></div>
        <div class="card span-12"><div class="card-head"><h3>Tất cả thẻ</h3><input class="input" style="max-width:240px;min-height:38px" placeholder="Tìm…" value="${esc(filter)}" data-change="cardFilter"></div>
          ${list.length ? `<div class="list">${list.slice(0, 200).map(c => { const s = S.get(c.skillId); return `<div class="li click" data-act="editCard" data-id="${c.id}"><span class="dot" style="background:${s?.color || '#999'}"></span><div class="grow"><div class="title small trunc">${esc(c.front)}</div><div class="sub trunc">${esc(c.back)}</div></div><span class="chip xs ${c.due <= H.today() ? 'warn' : ''}">${c.due <= H.today() ? 'Đến hạn' : H.fmtDay(c.due)}</span></div>`; }).join('')}</div>` : empty('cards', 'Chưa có thẻ', '')}</div>
      </div>`;
  };
  H.Change.cardFilter = el => { const q = new URLSearchParams(location.hash.split('?')[1] || ''); q.set('f', el.value); history.replaceState(null, '', '#/cards?' + q.toString()); H.render(); const i = document.querySelector('[data-change="cardFilter"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } };
  A.startCards = el => { const q = H.dueCards(H.today(), el.dataset.skill || null).sort(() => Math.random() - 0.5); if (!q.length) return; run = { queue: q.map(c => c.id), i: 0, show: false, start: Date.now(), done: 0, skill: el.dataset.skill }; H.render(); };
  V.cardRun = () => {
    if (run.i >= run.queue.length) return `<div class="session"><div class="card">${empty('check', 'Xong lượt ôn!', `Bạn đã ôn ${run.done} thẻ trong ${H.fmtMin(Math.max(1, Math.round((Date.now() - run.start) / 60000)))}.`, `<button class="btn primary" data-act="endCards">Hoàn tất</button>`)}</div></div>`;
    const c = S.get(run.queue[run.i]); if (!c) { run.i++; return V.cardRun(); }
    const s = S.get(c.skillId);
    return `<div class="session"><div class="row"><button class="back" data-act="endCards">${I('x')} Dừng</button><span class="spacer"></span><span class="small muted num">${run.i + 1}/${run.queue.length}</span></div>
      <div class="bar"><span style="width:${run.i / run.queue.length * 100}%"></span></div>
      <div class="card flash" data-act="flip">${s ? `<div style="margin-bottom:12px">${skillChip(s)}</div>` : ''}<div>${esc(c.front)}</div>${run.show ? `<div class="ans">${esc(c.back)}</div>` : ''}</div>
      ${run.show ? `<div class="grade">${[[1, 'Quên', 'g1'], [2, 'Khó', 'g2'], [3, 'Được', 'g3'], [4, 'Dễ', 'g4']].map(([g, t, cl]) => `<button class="${cl}" data-act="grade" data-g="${g}">${t}<small>${H.cardPreview(c, g)} ngày · ${g}</small></button>`).join('')}</div>` : `<button class="btn primary lg block" data-act="flip">Xem đáp án</button>`}</div>`;
  };
  A.flip = () => { if (run && !run.show) { run.show = true; H.render(); } };
  A.grade = el => { const c = S.get(run.queue[run.i]); H.gradeCard(c, +el.dataset.g); if (+el.dataset.g === 1) run.queue.push(c.id); run.i++; run.done++; run.show = false; H.render(); };
  A.endCards = () => {
    if (run && run.done) { const m = Math.max(1, Math.round((Date.now() - run.start) / 60000)); const c = S.get(run.queue[0]); S.put('session', { id: H.uid(), type: 'cards', skillId: run.skill || c?.skillId || null, subId: null, goal: `Ôn ${run.done} thẻ`, day: H.today(), startedAt: new Date(run.start).toISOString(), minutes: m, attempts: 0, success: 0 }, { silent: true }); }
    run = null; H.render();
  };
  A.editCard = el => {
    const c = el.dataset.id ? S.get(el.dataset.id) : null; const sid = c ? c.skillId : (el.dataset.skill || H.skills()[0]?.id);
    if (!sid) return H.toast('Tạo kỹ năng trước');
    H.openSheet(`<div class="sheet-head"><h2>${c ? 'Sửa thẻ' : 'Thêm thẻ'}</h2><button class="icon-btn" data-act="closeSheet">${I('x')}</button></div>
      <div class="form" data-id="${c ? c.id : ''}"><div class="field"><label>Kỹ năng</label><select class="input" name="skill">${H.skills().map(s => `<option value="${s.id}" ${s.id === sid ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Mặt trước (câu hỏi)</label><textarea class="input" name="front">${esc(c?.front || '')}</textarea></div>
      <div class="field"><label>Mặt sau (đáp án)</label><textarea class="input" name="back">${esc(c?.back || '')}</textarea></div></div>
      <div class="sheet-foot">${c ? `<button class="btn danger" data-act="delCard" data-id="${c.id}">${I('trash')}</button>` : ''}<button class="btn primary" data-act="saveCard" data-more="${c ? '' : '1'}">${I('check')} Lưu${c ? '' : ' & thêm tiếp'}</button></div>`);
  };
  A.saveCard = el => {
    const sh = el.closest('.sheet'); const f = sh.querySelector('.form'); const front = val(sh, 'front'), back = val(sh, 'back'); if (!front) return H.toast('Nhập câu hỏi');
    if (f.dataset.id) { const c = S.get(f.dataset.id); Object.assign(c, { front, back, skillId: val(sh, 'skill') }); S.put('card', c); H.closeSheet(); }
    else { H.newCard(val(sh, 'skill'), front, back); sh.querySelector('[name="front"]').value = ''; sh.querySelector('[name="back"]').value = ''; sh.querySelector('[name="front"]').focus(); H.toast('Đã thêm thẻ'); }
  };
  A.delCard = async el => { if (await H.confirm('Xóa thẻ này?', 'Xóa', true)) S.del(el.dataset.id); };
  A.bulkCards = el => {
    const sid = el.dataset.skill || H.skills()[0]?.id; if (!sid) return H.toast('Tạo kỹ năng trước');
    H.openSheet(`<div class="sheet-head"><h2>Nhập nhiều thẻ</h2><button class="icon-btn" data-act="closeSheet">${I('x')}</button></div>
      <div class="form"><div class="field"><label>Kỹ năng</label><select class="input" name="skill">${H.skills().map(s => `<option value="${s.id}" ${s.id === sid ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Mỗi dòng: câu hỏi | đáp án</label><textarea class="input" name="text" rows="8" data-input="bulkPreview"></textarea></div></div>
      <div class="small muted" data-bulk-count style="margin-top:8px">0 thẻ hợp lệ</div>
      <div class="sheet-foot"><button class="btn primary" data-act="bulkCardsSave">${I('check')} Thêm thẻ</button></div>`);
  };
  const parseBulk = t => t.split('\n').map(l => l.split(/\t|\s\|\s|\|/)).filter(p => p.length >= 2 && p[0].trim() && p.slice(1).join(' | ').trim()).map(p => ({ front: p[0].trim(), back: p.slice(1).join(' | ').trim() }));
  H.Input = { bulkPreview: el => { const n = parseBulk(el.value).length; const c = el.closest('.sheet').querySelector('[data-bulk-count]'); if (c) c.textContent = `${n} thẻ hợp lệ`; } };
  A.bulkCardsSave = el => {
    const sh = el.closest('.sheet'); const cards = parseBulk(val(sh, 'text')); if (!cards.length) return H.toast('Chưa có dòng hợp lệ');
    const sid = val(sh, 'skill'); cards.forEach(c => H.newCard(sid, c.front, c.back, true)); S.emit('local'); H.closeSheet(); H.toast(`Đã thêm ${cards.length} thẻ`);
  };

  /* =================== THỐNG KÊ =================== */
  V.stats = () => {
    const skills = S.all('skill'); const byDay = H.minutesByDay(); const st = H.settings(); const t = H.today();
    const ss = H.sessions(); const total = H.sum(ss.map(s => s.minutes));
    const last7 = ss.filter(s => s.day > H.addDays(t, -7)); const prev7 = ss.filter(s => s.day <= H.addDays(t, -7) && s.day > H.addDays(t, -14));
    const m7 = H.sum(last7.map(s => s.minutes)), mp7 = H.sum(prev7.map(s => s.minutes));
    const att = last7.filter(s => s.attempts); const rate7 = att.length ? H.sum(att.map(s => s.success)) / H.sum(att.map(s => s.attempts)) : null;
    const foc = last7.filter(s => s.focus); const focus7 = foc.length ? H.avg(foc.map(s => s.focus)) : null;
    const delib7 = H.sum(last7.filter(s => s.type === 'deliberate').map(s => s.minutes));
    const weeks = []; let ws = H.weekStart(t);
    for (let i = 7; i >= 0; i--) { const s0 = H.addDays(ws, -7 * i); const e0 = H.addDays(s0, 7); const vals = skills.map(sk => ({ color: sk.color, name: sk.name, v: H.sum(ss.filter(x => x.skillId === sk.id && x.day >= s0 && x.day < e0).map(x => x.minutes)) })); const other = H.sum(ss.filter(x => !x.skillId && x.day >= s0 && x.day < e0).map(x => x.minutes)); if (other) vals.push({ color: '#9A9BA0', name: 'Thẻ', v: other }); weeks.push({ label: `${H.parseDay(s0).getDate()}/${H.parseDay(s0).getMonth() + 1}`, values: vals }); }
    const lvlUps = S.all('subskill').filter(x => (x.levelHistory || []).some((h, i, arr) => i > 0 && h.d > H.addDays(t, -7) && h.l > arr[i - 1].l)).length;
    const wk = H.isoWeek(t); const rv = S.all('review').find(r => r.week === wk);
    const trend = mp7 ? Math.round((m7 - mp7) / mp7 * 100) : null;
    return `<div class="page-head"><div><h1>Thống kê</h1></div></div>
    <div class="grid bento">
      <div class="card span-12"><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:16px">
        <div class="stat"><span class="v num">${H.fmtMinShort(m7)}</span><span class="k">7 ngày qua${trend !== null ? ` · <b style="color:${trend >= 0 ? 'var(--ok)' : 'var(--bad)'}">${trend >= 0 ? '+' : ''}${trend}%</b>` : ''}</span></div>
        <div class="stat"><span class="v num">${m7 ? H.pct(delib7 / m7) : '—'}</span><span class="k">thời gian có chủ đích</span></div>
        <div class="stat"><span class="v num">${rate7 !== null ? H.pct(rate7) : '—'}</span><span class="k">tỉ lệ đạt</span></div>
        <div class="stat"><span class="v num">${focus7 !== null ? focus7.toFixed(1) : '—'}</span><span class="k">tập trung TB /5</span></div>
        <div class="stat"><span class="v num">${lvlUps}</span><span class="k">kỹ năng con lên mức</span></div>
        <div class="stat"><span class="v num">${H.fmtMinShort(total)}</span><span class="k">tổng đã tập</span></div>
      </div></div>
      <div class="card span-12"><div class="card-head"><h2>${I('spark')} Nhận xét tuần này</h2></div>${V.insights(last7, prev7, m7, mp7, rate7, focus7, delib7)}</div>
      <div class="card span-7"><div class="card-head"><h2>Phút mỗi tuần</h2></div>${C.stackBars(weeks)}<div class="legend" style="margin-top:8px">${skills.filter(s => !s.archived).map(s => `<span><i class="dot" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div></div>
      <div class="card span-5"><div class="card-head"><h2>16 tuần gần nhất</h2></div>${C.heatmap(byDay, 16, st.dailyMin)}<div class="legend" style="margin-top:10px"><span>Ít</span><span class="heat" style="display:inline-flex;grid-template-rows:none;gap:3px"><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></span><span>Đủ ${st.dailyMin}p</span></div></div>
      <div class="card span-7"><div class="card-head"><h2>Theo kỹ năng · 7 ngày</h2></div><div class="list">${H.skills().map(sk => { const xs = last7.filter(x => x.skillId === sk.id); const a2 = xs.filter(x => x.attempts); const r = a2.length ? H.sum(a2.map(x => x.success)) / H.sum(a2.map(x => x.attempts)) : null; const target = sk.dailyMin * 7; const m = H.sum(xs.map(x => x.minutes)); return `<div class="li"><span class="dot" style="background:${sk.color}"></span><div class="grow"><div class="row"><span class="title small" style="flex:1">${esc(sk.name)}</span><span class="small num">${H.fmtMinShort(m)} / ${H.fmtMinShort(target)}</span></div><div class="bar" style="--c:${sk.color};margin-top:6px"><span style="width:${Math.min(m / target, 1) * 100}%"></span></div><div class="xs muted" style="margin-top:4px">${xs.length} buổi · tỉ lệ đạt ${r !== null ? H.pct(r) : '—'} · mức TB ${H.skillLevel(sk.id).toFixed(1)}/5</div></div></div>`; }).join('') || '<p class="small muted">Chưa có kỹ năng.</p>'}</div></div>
      <div class="card span-5"><div class="card-head"><h2>${I('calendar')} Rà soát tuần ${wk.split('-W')[1]}</h2></div>
        <div class="form"><div class="field"><label>Điều gì hiệu quả?</label><textarea class="input" name="rv-good" rows="2">${esc(rv?.good || '')}</textarea></div>
        <div class="field"><label>Điều gì chưa ổn?</label><textarea class="input" name="rv-bad" rows="2">${esc(rv?.bad || '')}</textarea></div>
        <div class="field"><label>Tuần tới thay đổi gì?</label><textarea class="input" name="rv-next" rows="2">${esc(rv?.next || '')}</textarea></div>
        <button class="btn primary" data-act="saveReview">${I('check')} Lưu rà soát</button></div></div>
    </div>`;
  };
  // Nhận xét dựa trên quy tắc của phương pháp luyện tập có chủ đích
  V.insights = (last7, prev7, m7, mp7, rate7, focus7, delib7) => {
    const st = H.settings(); const out = []; const t = H.today();
    const add = (cls, text) => out.push({ cls, text });
    if (!last7.length) return `<div class="note">Chưa có buổi tập trong 7 ngày qua.</div>`;
    const target = st.dailyMin * (7 - (st.restDays || []).length);
    const days = new Set(last7.map(s => s.day)).size;
    add(m7 >= target * 0.9 ? 'ok' : m7 >= target * 0.6 ? 'warn' : 'bad', `Tập ${H.fmtMin(m7)} / mục tiêu ${H.fmtMin(target)} (${Math.round(m7 / (target || 1) * 100)}%), trong ${days}/7 ngày.${mp7 ? ` So với tuần trước: ${m7 >= mp7 ? '+' : ''}${Math.round((m7 - mp7) / mp7 * 100)}%.` : ''}`);
    if (rate7 !== null) {
      if (rate7 > 0.85) add('warn', `Tỉ lệ đạt ${H.pct(rate7)}: hơi dễ. Tuần tới tăng độ khó (thêm tốc độ, ràng buộc, bài khó hơn) để còn tiến bộ.`);
      else if (rate7 < 0.6) add('bad', `Tỉ lệ đạt ${H.pct(rate7)}: đang quá sức. Chia bài nhỏ hơn hoặc lùi một bậc độ khó.`);
      else add('ok', `Tỉ lệ đạt ${H.pct(rate7)}: đúng vùng vừa sức 60–85%. Giữ nhịp này.`);
    } else add('warn', 'Chưa đếm lần Đạt/Trượt. Không có phản hồi thì khó biết độ khó có vừa không — hãy bấm Đạt/Trượt mỗi lần thử.');
    if (m7 && delib7 / m7 < 0.5) add('warn', `Chỉ ${H.pct(delib7 / m7)} thời gian là tập có chủ đích. Phần cốt lõi nên chiếm trên một nửa.`);
    if (focus7 !== null && focus7 < 3.5) add('warn', `Mức tập trung TB ${focus7.toFixed(1)}/5. Thử buổi ngắn hơn (25 phút), tắt thông báo điện thoại, tập vào giờ tỉnh táo nhất.`);
    const noNext = last7.filter(s => s.type === 'deliberate' && !s.nextTime).length;
    if (noNext >= 2) add('warn', `${noNext} buổi không ghi "lần sau chỉnh gì". Ghi chú này giúp buổi sau bắt đầu đúng chỗ.`);
    H.skills().forEach(sk => {
      const m = H.sum(last7.filter(x => x.skillId === sk.id).map(x => x.minutes));
      if (m < sk.dailyMin * 7 * 0.4) add('bad', `${sk.name}: chỉ ${H.fmtMinShort(m)} / ${H.fmtMinShort(sk.dailyMin * 7)} — đang bị bỏ quên.`);
      const stale = H.subsOf(sk.id).filter(x => (x.level || 0) < 5 && (x.importance || 2) >= 3 && (!x.lastPracticed || H.diffDays(t, x.lastPracticed) > 14));
      if (stale.length) add('warn', `${sk.name}: "${stale[0].name}" quan trọng nhưng ${stale[0].lastPracticed ? 'hơn 14 ngày chưa tập' : 'chưa tập lần nào'}.`);
      const top = H.errorLog(sk.id).find(e => e.n >= 3 && e.last > H.addDays(t, -14));
      if (top) add('bad', `${sk.name}: lỗi "${top.text}" lặp ${top.n} lần. Lấy nó làm mục tiêu buổi tập tới.`);
    });
    const overdue = H.dueCards().length; if (overdue > 30) add('warn', `${overdue} thẻ đang đến hạn. Ôn 10 phút đầu mỗi buổi để không dồn.`);
    const benchLate = S.all('benchmark').filter(b => H.Store.get(b.skillId) && !H.Store.get(b.skillId).archived && H.benchDue(b)).length;
    if (benchLate) add('warn', `${benchLate} bài test mốc đến hạn đo. Đo để biết tiến bộ thật.`);
    const ico = { ok: 'check', warn: 'flag', bad: 'bug' };
    // dòng tổng quan đứng đầu, sau đó ưu tiên vấn đề nặng; tối đa 6 dòng cho gọn
    const rank = { bad: 0, warn: 1, ok: 2 }; const head = out.shift();
    out.sort((x, y) => rank[x.cls] - rank[y.cls]); const shown = [head, ...out.slice(0, 5)]; const more = out.length - 5;
    return `<div class="insights">${shown.map(o => `<div class="ins ${o.cls}">${I(ico[o.cls], 'xs')}<span>${esc(o.text)}</span></div>`).join('')}</div>${more > 0 ? `<p class="xs muted" style="margin-top:8px">+${more} nhận xét khác</p>` : ''}`;
  };
  const reviewRec = () => { const wk = H.isoWeek(H.today()); return S.all('review').find(r => r.week === wk) || { id: H.uid(), week: wk }; };
  A.saveReview = () => { const r = reviewRec(); const m = document.getElementById('view'); Object.assign(r, { good: val(m, 'rv-good'), bad: val(m, 'rv-bad'), next: val(m, 'rv-next') }); S.put('review', r); H.toast('Đã lưu rà soát tuần'); };

  /* =================== CÀI ĐẶT =================== */
  V.settings = () => {
    const st = H.settings(); const Sy = H.Sync; const cfg = Sy.cfg(); const base = window.HHKN_CONFIG || {};
    const needCfg = !(base.supabaseUrl && base.supabaseAnonKey);
    let html = `<div class="page-head"><div><div class="eyebrow">v1.2</div><h1>Cài đặt</h1></div></div><div class="grid g2 settings-grid">`;
    // Đồng bộ
    html += `<div class="card"><div class="card-head"><h2>${I('cloud')} Đồng bộ</h2><span class="sync-dot" data-sync-dot></span></div>
      <p class="small muted" style="margin-bottom:12px" data-sync-text>${esc(Sy.label())}</p>`;
    if (needCfg) html += `<details ${Sy.configured() ? '' : 'open'} style="margin-bottom:12px"><summary class="small" style="cursor:pointer;font-weight:600">Kết nối Supabase</summary><div class="form" style="margin-top:10px"><div class="field"><label>Supabase URL</label><input class="input" name="sbUrl" value="${esc(cfg.supabaseUrl)}"></div><div class="field"><label>Anon key</label><input class="input" name="sbKey" value="${esc(cfg.supabaseAnonKey)}"></div><div class="field"><label>VAPID public key</label><input class="input" name="vapid" value="${esc(cfg.vapidPublicKey)}"></div><button class="btn" data-act="saveCfg">Lưu kết nối</button></div></details>`;
    if (Sy.configured() && Sy.sb) {
      if (Sy.user) html += `<div class="set-row" style="border-top:0;padding-top:0"><span class="lbl-t trunc" style="font-weight:600">${esc(Sy.user.email)}</span></div><div class="btn-grid"><button class="btn" data-act="syncNow">${I('refresh', 'xs')} Đồng bộ</button><button class="btn ghost" data-act="signOut">${I('logout', 'xs')} Đăng xuất</button></div>`;
      else html += `<div class="form"><div class="field"><label>Email</label><input class="input" name="email" type="email" autocomplete="username"></div><div class="field"><label>Mật khẩu</label><input class="input" name="password" type="password" autocomplete="current-password"></div><div class="btn-grid"><button class="btn primary" data-act="signIn">Đăng nhập</button><button class="btn" data-act="signUp">Tạo tài khoản</button></div></div>`;
    } else if (!needCfg) html += `<div class="note warn small">Không tải được thư viện đồng bộ.</div>`;
    html += `</div>`;
    // Mục tiêu
    html += `<div class="card"><div class="card-head"><h2>${I('target')} Mục tiêu</h2></div>
      <div class="set-sec"><div class="lbl">Phút mỗi ngày</div><div class="opt-grid" style="--n:5">${[60, 90, 120, 150, 180].map(m => `<button class="chip num ${m === st.dailyMin ? 'sel' : ''}" data-act="setDaily" data-m="${m}">${m}</button>`).join('')}</div></div>
      <div class="set-sec"><div class="lbl">Ngày nghỉ</div><div class="opt-grid" style="--n:7">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button class="chip ${(st.restDays || []).includes(d) ? 'sel' : ''}" data-act="toggleRest" data-d="${d}">${H.WD[d]}</button>`).join('')}</div></div>
      ${H.skills().length ? `<div class="set-sec"><div class="lbl">Phút cho từng kỹ năng</div><div>${H.skills().map(s => `<div class="set-row"><span class="dot" style="background:${s.color}"></span><span class="lbl-t trunc">${esc(s.name)}</span><input class="input num" type="number" min="5" step="5" inputmode="numeric" value="${s.dailyMin}" data-change="skillMin" data-id="${s.id}" aria-label="Phút/ngày"></div>`).join('')}</div></div>` : ''}</div>`;
    // Nhắc tập
    html += `<div class="card"><div class="card-head"><h2>${I('bell')} Nhắc tập</h2><span class="chip" data-push-state>…</span></div>
      <div class="btn-grid"><button class="btn primary" data-act="enablePush">Bật thông báo</button><button class="btn" data-act="disablePush">Tắt</button><button class="btn" data-act="testLocal">Thử trên máy</button><button class="btn" data-act="testServer">Thử từ server</button></div>
      <div class="set-sec">${(st.reminders || []).map((r, i) => `<div class="set-row"><span class="lbl-t">Nhắc lúc</span><input class="input num" type="time" value="${r.time}" data-change="remTime" data-i="${i}"><label class="switch"><input type="checkbox" ${r.on ? 'checked' : ''} data-change="remOn" data-i="${i}"><span></span></label></div>`).join('')}
      <div class="set-row"><span class="lbl-t">Nhắc nếu thiếu</span><input class="input num" type="time" value="${st.evening?.time || '21:30'}" data-change="eveTime"><label class="switch"><input type="checkbox" ${st.evening?.on ? 'checked' : ''} data-change="eveOn"><span></span></label></div></div>
      <div class="btn-grid" style="margin-top:12px"><button class="btn" data-act="addRem">${I('plus', 'xs')} Thêm giờ</button><button class="btn" data-act="downloadIcs">${I('calendar', 'xs')} File .ics</button></div></div>`;
    // Dữ liệu
    html += `<div class="card"><div class="card-head"><h2>${I('download')} Dữ liệu</h2><span class="xs muted num">${Object.keys(S.recs).length} bản ghi · ${Object.keys(S.meta.dirty).length} chờ</span></div>
      <div class="btn-grid"><button class="btn" data-act="exportJson">${I('download', 'xs')} Xuất JSON</button><label class="btn">${I('upload', 'xs')} Nhập JSON<input type="file" accept="application/json" hidden data-change="importJson"></label><button class="btn danger full" data-act="wipeLocal">${I('trash', 'xs')} Xóa dữ liệu trên máy</button></div></div>`;
    html += `</div><p class="xs faint mobile-only" style="text-align:center;margin-top:18px">by Nguyễn Mạnh Hùng</p>`;
    setTimeout(V.refreshPushState, 0);
    return html;
  };
  V.refreshPushState = async () => { const el = document.querySelector('[data-push-state]'); if (!el) return; const s = await H.Sync.pushState().catch(() => 'unsupported'); el.textContent = { on: 'Đang bật', off: 'Chưa bật', denied: 'Bị chặn', unsupported: 'Không hỗ trợ', nosw: 'Chưa sẵn sàng' }[s]; el.className = 'chip ' + (s === 'on' ? 'ok' : s === 'denied' ? 'bad' : ''); };
  A.saveCfg = async () => { const m = document.getElementById('view'); S.local.cfg = { supabaseUrl: val(m, 'sbUrl').replace(/\/$/, ''), supabaseAnonKey: val(m, 'sbKey'), vapidPublicKey: val(m, 'vapid') }; S.saveLocal(); await H.Sync.init(); H.render(); H.toast('Đã lưu kết nối'); };
  A.signIn = async el => { const m = document.getElementById('view'); el.disabled = true; try { await H.Sync.signIn(val(m, 'email'), val(m, 'password')); H.toast('Đã đăng nhập, đang đồng bộ…'); } catch (e) { H.toast(e.message); } el.disabled = false; };
  A.signUp = async el => { const m = document.getElementById('view'); el.disabled = true; try { const d = await H.Sync.signUp(val(m, 'email'), val(m, 'password')); H.toast(d.session ? 'Đã tạo tài khoản' : 'Đã tạo tài khoản. Kiểm tra email để xác nhận rồi đăng nhập.'); } catch (e) { H.toast(e.message); } el.disabled = false; };
  A.signOut = async () => { if (await H.confirm('Đăng xuất? Dữ liệu vẫn còn trên máy này.', 'Đăng xuất')) { await H.Sync.signOut(); H.render(); } };
  A.syncNow = async () => { await H.Sync.run(); H.toast(H.Sync.label()); };
  A.setDaily = el => H.saveSettings({ dailyMin: +el.dataset.m });
  A.toggleRest = el => { const d = +el.dataset.d; const st = H.settings(); const r = new Set(st.restDays || []); r.has(d) ? r.delete(d) : r.add(d); H.saveSettings({ restDays: [...r] }); };
  H.Change.skillMin = el => { const s = S.get(el.dataset.id); s.dailyMin = Math.max(5, +el.value || 30); S.put('skill', s, { silent: true }); };
  H.Change.remTime = el => { const st = H.settings(); st.reminders[+el.dataset.i].time = el.value; H.saveSettings({ reminders: st.reminders }); };
  H.Change.remOn = el => { const st = H.settings(); st.reminders[+el.dataset.i].on = el.checked; H.saveSettings({ reminders: st.reminders }); };
  H.Change.eveTime = el => H.saveSettings({ evening: Object.assign({}, H.settings().evening, { time: el.value }) });
  H.Change.eveOn = el => H.saveSettings({ evening: Object.assign({}, H.settings().evening, { on: el.checked }) });
  A.addRem = () => { const st = H.settings(); st.reminders.push({ time: '12:00', on: true }); H.saveSettings({ reminders: st.reminders }); };
  A.enablePush = async el => { el.disabled = true; try { await H.Sync.enablePush(); H.toast('Đã bật thông báo nhắc tập'); } catch (e) { H.toast(e.message); } el.disabled = false; V.refreshPushState(); };
  A.disablePush = async () => { try { await H.Sync.disablePush(); H.toast('Đã tắt thông báo trên máy này'); } catch (e) { H.toast(e.message); } V.refreshPushState(); };
  A.testLocal = async () => { try { await H.Sync.testLocal(); } catch (e) { H.toast(e.message); } };
  A.testServer = async el => { if (!H.Sync.user) return H.toast('Cần đăng nhập trước'); el.disabled = true; try { const r = await H.Sync.testServer(); H.toast(`Server đã gửi tới ${r.sent ?? 0} thiết bị`); } catch (e) { H.toast(e.message); } el.disabled = false; };
  A.downloadIcs = () => {
    const st = H.settings(); const d = H.today().replace(/-/g, ''); const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const evs = (st.reminders || []).filter(r => r.on).map((r, i) => `BEGIN:VEVENT\r\nUID:hhkn-${i}-${r.time.replace(':', '')}@hung-hoc-ky-nang\r\nDTSTAMP:${stamp}\r\nDTSTART;TZID=Asia/Ho_Chi_Minh:${d}T${r.time.replace(':', '')}00\r\nDURATION:PT30M\r\nRRULE:FREQ=DAILY\r\nSUMMARY:Luyện tập kỹ năng (${st.dailyMin} phút/ngày)\r\nDESCRIPTION:Mở app Hùng học kỹ năng để xem kế hoạch hôm nay.\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Đến giờ luyện tập\r\nTRIGGER:PT0M\r\nEND:VALARM\r\nEND:VEVENT`).join('\r\n');
    const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Hung hoc ky nang//VI\r\nCALSCALE:GREGORIAN\r\nBEGIN:VTIMEZONE\r\nTZID:Asia/Ho_Chi_Minh\r\nBEGIN:STANDARD\r\nDTSTART:19700101T000000\r\nTZOFFSETFROM:+0700\r\nTZOFFSETTO:+0700\r\nEND:STANDARD\r\nEND:VTIMEZONE\r\n${evs}\r\nEND:VCALENDAR`;
    download('nhac-tap-ky-nang.ics', ics, 'text/calendar');
  };
  const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  A.exportJson = () => download(`hung-hoc-ky-nang-${H.today()}.json`, JSON.stringify({ app: 'hung-hoc-ky-nang', version: 1, exported: new Date().toISOString(), records: Object.values(S.recs) }, null, 1), 'application/json');
  H.Change.importJson = async el => {
    const f = el.files[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); const recs = j.records || []; if (!await H.confirm(`Nhập ${recs.length} bản ghi? Bản ghi mới hơn sẽ được giữ.`, 'Nhập')) return; let n = 0; recs.forEach(r => { if (S.applyRemote(r)) { S.meta.dirty[r.id] = r.updated_at; n++; } }); S.persist(); S.emit('local'); H.Sync.schedule(); H.toast(`Đã nhập ${n} bản ghi`); }
    catch (e) { H.toast('File không hợp lệ'); }
  };
  A.wipeLocal = async () => { if (!await H.confirm('Xóa toàn bộ dữ liệu trên máy này? Dữ liệu trên server (nếu có) vẫn giữ.', 'Xóa', true)) return; S.recs = {}; S.meta = { dirty: {}, lastPull: null, syncedUser: null }; S.bump(); S.flush(); S.local.active = null; S.saveLocal(); location.reload(); };
})();
