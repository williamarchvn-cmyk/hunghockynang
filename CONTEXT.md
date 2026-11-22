# Ngữ cảnh dự án: PWA "Hùng học kỹ năng"
Cập nhật: 22/11/2026 · phiên bản v1.1 · by Nguyễn Mạnh Hùng

## Mục tiêu
App cá nhân học song song nhiều kỹ năng (Lập kế hoạch, Lập trình, Thể thao) theo luyện tập có chủ đích, kết hợp chia nhỏ kỹ năng, ôn giãn cách, học xen kẽ, tự kiểm tra, test mốc, rà soát tuần. 120 phút/ngày.

## Quyết định đã chốt
- Giao diện sáng, màu phẳng, không gradient; tối ưu Samsung S23 Ultra (thanh dưới) và ThinkPad P1 Gen 1 (thanh bên, phím tắt).
- Dữ liệu offline-first (localStorage), đồng bộ Supabase, bản sửa sau cùng thắng, realtime.
- KHÔNG dùng AI (đã bỏ ở v1.1 theo yêu cầu). Gợi ý mục tiêu, nhận xét tuần đều tính từ dữ liệu.
- PWA + Web Push (Edge Function send-reminders + pg_cron mỗi 5 phút), có .ics dự phòng.
- Vanilla JS, không cần build. Tên app: "Hùng học kỹ năng".

## Cấu trúc
index.html, styles.css, config.js, sw.js, manifest.webmanifest, js/{core,sync,charts,views,main}.js, fonts/ (8 woff2 Be Vietnam Pro), vendor/supabase.js, supabase/{schema.sql,cron.sql,functions/send-reminders/index.ts}, tools/{tao-khoa-vapid.html,tao-icon.py}, KE-HOACH.md, HUONG-DAN.md.
Icon PNG sinh bằng `python3 tools/tao-icon.py`. Phông và vendor/supabase.js là file nhị phân/lớn, không lưu trong project — lấy từ zip, hoặc `npm i @fontsource/be-vietnam-pro @supabase/supabase-js` (dist/umd/supabase.js).

## Kết nối (công khai được)
- Supabase URL: https://enwbckjozzyumpijaugu.supabase.co
- Publishable key đã điền trong config.js.

## Trạng thái
- v1.0 đã deploy: https://hunghockynang.vercel.app (đăng nhập & đồng bộ Supabase chạy).
- v1.1: bỏ AI, tối ưu tốc độ (chỉ mục + nhớ đệm + gộp ghi), tự lưu phông/thư viện, sửa tràn ngang mobile. Test 2 kích thước không lỗi console, không request ngoài.
- CHƯA làm: chạy schema.sql trên project Supabase thật, deploy hosting, deploy Edge Function, đặt secret, chạy cron.sql, thử thông báo trên S23 (tùy tiến độ của Hùng).
- Sandbox không gọi được Supabase thật nên đồng bộ và push chưa kiểm chứng với dịch vụ thật.

## Việc tiếp theo
Làm theo HUONG-DAN.md (bước 1 hosting, 2 chạy schema.sql, 5 Edge Function + cron, 6 cài app, 7 cập nhật bản mới). Với môn thể thao cụ thể: tự tạo kỹ năng riêng.
