# Ngữ cảnh dự án: PWA "Hùng học kỹ năng"
Cập nhật: 22/11/2026 · by Nguyễn Mạnh Hùng

## Mục tiêu
App cá nhân học song song nhiều kỹ năng (Lập kế hoạch, Lập trình, Thể thao) theo luyện tập có chủ đích, kết hợp chia nhỏ kỹ năng, ôn giãn cách, học xen kẽ, tự kiểm tra, test mốc, rà soát tuần. 120 phút/ngày.

## Quyết định đã chốt
- Giao diện sáng, màu phẳng, không gradient; tối ưu Samsung S23 Ultra (thanh dưới) và ThinkPad P1 Gen 1 (thanh bên, phím tắt).
- Dữ liệu offline-first (localStorage), đồng bộ Supabase, bản sửa sau cùng thắng, realtime.
- AI Gemini (mặc định model gemini-3.8-flash, đổi được). Key chỉ lưu trên từng máy, KHÔNG đưa vào file/ project.
- PWA + Web Push (Edge Function send-reminders + pg_cron mỗi 5 phút), có .ics dự phòng.
- Vanilla JS, không cần build. Tên app: "Hùng học kỹ năng".

## Cấu trúc
index.html, styles.css, config.js, sw.js, manifest.webmanifest, js/{core,ai,sync,charts,views,main}.js, supabase/{schema.sql,cron.sql,functions/send-reminders/index.ts}, tools/{tao-khoa-vapid.html,tao-icon.py}, KE-HOACH.md, HUONG-DAN.md.
Icon PNG sinh bằng `python3 tools/tao-icon.py` (không lưu được dạng text trong project).

## Kết nối (công khai được)
- Supabase URL: https://enwbckjozzyumpijaugu.supabase.co
- Publishable key đã điền trong config.js.

## Trạng thái
- Code xong, đã test giao diện 2 kích thước, luồng AI (giả lập), SQL (Postgres thử).
- CHƯA làm: chạy schema.sql trên project Supabase thật, deploy hosting, deploy Edge Function, đặt secret, chạy cron.sql, nhập Gemini key trong app, thử thông báo trên S23.
- Sandbox không gọi được Supabase/Gemini thật nên đồng bộ và push chưa kiểm chứng với dịch vụ thật.

## Việc tiếp theo
Làm theo HUONG-DAN.md (bước 1 hosting, 2 chạy schema.sql, 5 Edge Function + cron, 6 cài app, 7 nhập Gemini key). Tạo lại kỹ năng Thể thao bằng AI với môn cụ thể.
