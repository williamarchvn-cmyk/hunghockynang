/* charts.js — biểu đồ SVG nhẹ, màu phẳng */
'use strict';
(() => {
  const H = window.H;
  const C = H.Charts = {};

  C.ring = (value, max, { size = 120, stroke = 12, color = 'var(--accent)', label = '', sub = '' } = {}) => {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.min(value / (max || 1), 1);
    return `<div class="ring" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="${stroke}"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      </svg>
      <div class="ring-label"><div class="num" style="font-size:${size > 100 ? 24 : 15}px;font-weight:700">${label}</div>${sub ? `<div class="xs muted">${sub}</div>` : ''}</div>
    </div>`;
  };

  // series: [{label, values:[{color, v, name}]}]
  C.stackBars = (series, { height = 180, unit = 'p' } = {}) => {
    const W = 640, Hh = height, padL = 34, padB = 24, padT = 10;
    const max = Math.max(30, ...series.map(s => H.sum(s.values.map(v => v.v))));
    const nice = Math.ceil(max / 30) * 30;
    const bw = (W - padL) / series.length;
    let g = '';
    [0, .5, 1].forEach(t => { const y = padT + (Hh - padB - padT) * (1 - t); g += `<line x1="${padL}" x2="${W}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-dasharray="${t ? '3 4' : ''}"/><text x="${padL - 6}" y="${y + 4}" text-anchor="end">${Math.round(nice * t)}${t ? unit : ''}</text>`; });
    series.forEach((s, i) => {
      let y = Hh - padB; const x = padL + i * bw + bw * 0.2, w = bw * 0.6;
      s.values.forEach(v => { if (!v.v) return; const h = (Hh - padB - padT) * v.v / nice; y -= h; g += `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(h - 1.5, 0)}" rx="3" fill="${v.color}"><title>${H.esc(v.name)}: ${Math.round(v.v)} phút</title></rect>`; });
      g += `<text x="${x + w / 2}" y="${Hh - 6}" text-anchor="middle">${H.esc(s.label)}</text>`;
    });
    return `<div class="chart"><svg viewBox="0 0 ${W} ${Hh}" role="img">${g}</svg></div>`;
  };

  // points: [{x:'YYYY-MM-DD', y}]
  C.line = (points, { height = 160, color = 'var(--accent)', unit = '', min = null, max = null, step = false } = {}) => {
    const W = 640, Hh = height, padL = 38, padB = 24, padT = 12, padR = 12;
    if (!points.length) return `<div class="empty small" style="padding:18px">Chưa có dữ liệu</div>`;
    const ys = points.map(p => p.y);
    let lo = min ?? Math.min(...ys), hi = max ?? Math.max(...ys); if (lo === hi) { lo -= 1; hi += 1; }
    const xs = points.map(p => H.parseDay(p.x).getTime()); const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
    const X = t => padL + (W - padL - padR) * (x1 === x0 ? 0.5 : (t - x0) / (x1 - x0));
    const Y = v => padT + (Hh - padB - padT) * (1 - (v - lo) / (hi - lo));
    let g = '';
    [lo, (lo + hi) / 2, hi].forEach((v, i) => { const y = Y(v); g += `<line x1="${padL}" x2="${W - padR}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-dasharray="${i ? '3 4' : ''}"/><text x="${padL - 6}" y="${y + 4}" text-anchor="end">${+v.toFixed(1)}${unit}</text>`; });
    let d = '';
    points.forEach((p, i) => { const x = X(xs[i]), y = Y(p.y); if (!i) d = `M${x},${y}`; else if (step) d += `H${x}V${y}`; else d += `L${x},${y}`; });
    g += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>`;
    points.forEach((p, i) => { g += `<circle cx="${X(xs[i])}" cy="${Y(p.y)}" r="4" fill="var(--surface)" stroke="${color}" stroke-width="2"><title>${H.fmtDate(p.x)}: ${p.y}${unit}</title></circle>`; });
    const f = points[0].x, l = points[points.length - 1].x;
    g += `<text x="${padL}" y="${Hh - 6}">${H.fmtDate(f).slice(0, 5)}</text>`;
    if (l !== f) g += `<text x="${W - padR}" y="${Hh - 6}" text-anchor="end">${H.fmtDate(l).slice(0, 5)}</text>`;
    return `<div class="chart"><svg viewBox="0 0 ${W} ${Hh}" role="img">${g}</svg></div>`;
  };

  C.heatmap = (byDay, weeks = 16, target = 120) => {
    const t = H.today(); const start = H.addDays(H.weekStart(t), -7 * (weeks - 1));
    let cells = '';
    for (let i = 0; i < weeks * 7; i++) {
      const d = H.addDays(start, i); const m = byDay[d] || 0;
      const lv = d > t ? -1 : m === 0 ? 0 : m < target * 0.25 ? 1 : m < target * 0.6 ? 2 : m < target ? 3 : 4;
      cells += `<i class="${lv > 0 ? 'l' + lv : ''}" ${lv < 0 ? 'style="opacity:.35"' : ''} title="${H.fmtDate(d)}: ${Math.round(m)} phút"></i>`;
    }
    return `<div class="heat">${cells}</div>`;
  };

  C.sparkLevels = (sub, color) => {
    const hist = (sub.levelHistory || []).slice(-12); if (hist.length < 2) return '';
    return C.line(hist.map(h => ({ x: h.d, y: h.l })), { height: 90, color, min: 0, max: 5, step: true });
  };
})();
