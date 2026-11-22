-- =====================================================================
-- Lịch chạy Edge Function gửi nhắc tập mỗi 5 phút
-- Thay 2 chỗ <...> rồi chạy trong SQL Editor (sau khi đã deploy function)
--   <PROJECT_REF> : mã dự án, ví dụ abcd1234 trong https://abcd1234.supabase.co
--   <CRON_SECRET> : chuỗi bí mật bạn tự đặt, trùng với secret CRON_SECRET của function
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- xóa lịch cũ (nếu chạy lại file này)
select cron.unschedule(jobid) from cron.job where jobname = 'hhkn-send-reminders';

select cron.schedule(
  'hhkn-send-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- Kiểm tra: select * from cron.job_run_details order by start_time desc limit 10;
