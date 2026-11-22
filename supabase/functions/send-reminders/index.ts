// Edge Function: send-reminders — gửi nhắc tập qua Web Push
// Secrets cần đặt: VAPID_PRIVATE_JWK, VAPID_SUBJECT, CRON_SECRET
// (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY được Supabase cấp sẵn)
// Deploy: supabase functions deploy send-reminders --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildPushHTTPRequest } from 'npm:@pushforge/builder@2';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SRK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PRIVATE_JWK = Deno.env.get('VAPID_PRIVATE_JWK') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const WINDOW_MIN = 10; // cron chạy 5 phút/lần, cửa sổ 10 phút để không lỡ giờ

const DEFAULTS = { dailyMin: 120, restDays: [] as number[], tz: 'Asia/Ho_Chi_Minh', reminders: [{ time: '06:00', on: true }, { time: '20:00', on: true }], evening: { on: true, time: '21:30' } };
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-cron-secret', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(SB_URL, SRK, { auth: { persistSession: false } });

type Settings = typeof DEFAULTS;
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
function localNow(tz: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, min: Number(parts.hour) * 60 + Number(parts.minute), wd: WD[parts.weekday] ?? 0 };
}
const toMin = (t: string) => { const [h, m] = (t || '00:00').split(':').map(Number); return h * 60 + (m || 0); };

async function getSettings(userId: string): Promise<Settings> {
  const { data } = await admin.from('records').select('data').eq('user_id', userId).eq('kind', 'settings').eq('deleted', false).maybeSingle();
  return { ...DEFAULTS, ...(data?.data ?? {}) };
}

async function summary(userId: string, day: string) {
  const { data } = await admin.from('records').select('kind,data').eq('user_id', userId).eq('deleted', false).in('kind', ['session', 'card', 'subskill']);
  let minutes = 0, cards = 0, reviews = 0;
  for (const r of data ?? []) {
    const d = r.data as Record<string, any>;
    if (r.kind === 'session' && d.day === day) minutes += Number(d.minutes) || 0;
    if (r.kind === 'card' && (d.due ?? '') <= day) cards++;
    if (r.kind === 'subskill' && d.review?.due && d.review.due <= day) reviews++;
  }
  return { minutes: Math.round(minutes), cards, reviews };
}

async function sendTo(userId: string, payload: Record<string, unknown>) {
  const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', userId);
  let sent = 0;
  for (const s of subs ?? []) {
    try {
      const { endpoint, headers, body } = await buildPushHTTPRequest({
        privateJWK: VAPID_PRIVATE_JWK,
        subscription: { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        message: { payload, adminContact: VAPID_SUBJECT, options: { ttl: 3600, urgency: 'high', topic: 'hhkn' } },
      });
      const res = await fetch(endpoint, { method: 'POST', headers, body });
      if (res.status === 404 || res.status === 410) await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      else if (res.ok) sent++;
      else console.warn('push failed', res.status, await res.text());
    } catch (e) { console.error('push error', e); }
  }
  return sent;
}

const morningMsg = (st: Settings, s: { minutes: number; cards: number; reviews: number }) => ({
  title: 'Đến giờ luyện tập',
  body: `Hôm nay: ${s.minutes}/${st.dailyMin} phút · ${s.cards} thẻ đến hạn · ${s.reviews} kỹ năng con cần ôn.`,
  url: './#/today', tag: 'hhkn-remind',
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!VAPID_PRIVATE_JWK) return json({ error: 'Thiếu secret VAPID_PRIVATE_JWK' }, 500);
  const url = new URL(req.url);
  try {
    // Chế độ thử: gọi từ app với token đăng nhập
    if (url.searchParams.get('test')) {
      const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
      const { data: { user }, error } = await admin.auth.getUser(token);
      if (error || !user) return json({ error: 'Chưa đăng nhập' }, 401);
      const st = await getSettings(user.id); const now = localNow(st.tz);
      const s = await summary(user.id, now.day);
      const sent = await sendTo(user.id, { ...morningMsg(st, s), title: 'Thử nhắc tập từ server', tag: 'hhkn-test' });
      return json({ ok: true, sent });
    }

    // Chế độ định kỳ: gọi từ pg_cron
    if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) return json({ error: 'unauthorized' }, 401);
    const { data: subUsers } = await admin.from('push_subscriptions').select('user_id');
    const userIds = [...new Set((subUsers ?? []).map(r => r.user_id as string))];
    let total = 0;
    for (const uid of userIds) {
      const st = await getSettings(uid); const now = localNow(st.tz || DEFAULTS.tz);
      const isRest = (st.restDays ?? []).includes(now.wd);
      const slots: { key: string; min: number; evening?: boolean }[] = [];
      if (!isRest) (st.reminders ?? []).filter(r => r.on).forEach(r => slots.push({ key: 'r-' + r.time, min: toMin(r.time) }));
      if (!isRest && st.evening?.on) slots.push({ key: 'e-' + st.evening.time, min: toMin(st.evening.time), evening: true });
      let s: Awaited<ReturnType<typeof summary>> | null = null;
      for (const slot of slots) {
        if (now.min < slot.min || now.min >= slot.min + WINDOW_MIN) continue;
        s = s ?? await summary(uid, now.day);
        if (slot.evening && s.minutes >= st.dailyMin) continue;
        const { error } = await admin.from('reminder_log').insert({ user_id: uid, day: now.day, slot: slot.key });
        if (error) continue; // đã gửi slot này hôm nay
        const payload = slot.evening
          ? { title: `Còn thiếu ${st.dailyMin - s.minutes} phút hôm nay`, body: 'Một buổi ngắn 15–25 phút có chủ đích vẫn giữ được nhịp tiến bộ.', url: './#/practice', tag: 'hhkn-remind' }
          : morningMsg(st, s);
        total += await sendTo(uid, payload);
      }
    }
    return json({ ok: true, sent: total });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
