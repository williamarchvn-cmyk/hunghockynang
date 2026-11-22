-- =====================================================================
-- Hùng học kỹ năng — Supabase schema
-- Chạy 1 lần trong: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- 1) Bảng dữ liệu chung (mọi loại bản ghi: skill, subskill, session, card...)
create table if not exists public.records (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id         text not null,
  kind       text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null,
  deleted    boolean not null default false,
  server_at  timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);
create index if not exists records_user_server_at_idx on public.records (user_id, server_at);
create index if not exists records_kind_idx on public.records (kind);

alter table public.records enable row level security;
drop policy if exists records_select_own on public.records;
drop policy if exists records_insert_own on public.records;
drop policy if exists records_update_own on public.records;
drop policy if exists records_delete_own on public.records;
create policy records_select_own on public.records for select using (auth.uid() = user_id);
create policy records_insert_own on public.records for insert with check (auth.uid() = user_id);
create policy records_update_own on public.records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy records_delete_own on public.records for delete using (auth.uid() = user_id);

-- Bản sửa sau cùng thắng: bỏ qua cập nhật cũ hơn, đóng dấu thời gian server
create or replace function public.records_lww() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null;
  end if;
  new.server_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists records_lww on public.records;
create trigger records_lww before insert or update on public.records
  for each row execute function public.records_lww();

-- Realtime: sửa trên máy này, máy kia cập nhật ngay
do $$ begin
  alter publication supabase_realtime add table public.records;
exception when duplicate_object then null; end $$;

-- 2) Đăng ký nhận thông báo đẩy của từng thiết bị
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  device     text,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Nhật ký đã gửi nhắc (chống gửi trùng) — chỉ Edge Function (service role) dùng
create table if not exists public.reminder_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  slot    text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, day, slot)
);
alter table public.reminder_log enable row level security;
