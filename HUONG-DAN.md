# Hướng dẫn triển khai "Hùng học kỹ năng"

Tổng thời gian: khoảng 30–40 phút, làm 1 lần. Tất cả đều dùng gói miễn phí.

> **Chỉ muốn dùng thử?** Làm bước 1 là đủ: app chạy được ngay, dữ liệu lưu trên từng máy. Các bước 2–6 để bật đồng bộ và nhắc tập.

---

## 1. Đưa app lên mạng (HTTPS)

PWA cần chạy trên HTTPS. Chọn một trong hai cách:

- **Cloudflare Pages:** Workers & Pages → Create → Pages → *Upload assets* → kéo thả cả thư mục `hung-hoc-ky-nang` → Deploy.
- **Vercel:** đẩy thư mục lên một repo GitHub → vercel.com → *Add New Project* → chọn repo → Framework: *Other* → Deploy.

Mở link vừa tạo để kiểm tra app chạy được.

## 2. Tạo dự án Supabase

1. Vào supabase.com → *New project* (chọn Region: Singapore cho nhanh).
2. **SQL Editor** → *New query* → dán toàn bộ file `supabase/schema.sql` → **Run**.
3. **Authentication → Sign In / Providers → Email:** bật Email. Nếu muốn khỏi xác nhận email, tắt *Confirm email*.
4. **Project Settings → API:** chép **Project URL** và khóa **anon public**.

## 3. Tạo khóa VAPID (cho thông báo đẩy)

1. Mở `https://<link-app-của-bạn>/tools/tao-khoa-vapid.html` → bấm **Tạo cặp khóa mới**.
2. Chép **Public key** để dùng ở bước 4.
3. Chép **Private JWK** để dùng ở bước 5. Giữ bí mật khóa này.

## 4. Điền `config.js` rồi deploy lại

> **Đã điền sẵn** Supabase URL, publishable key và VAPID public key trong `config.js` của bản này. Bạn chỉ cần deploy. Private JWK và CRON_SECRET nằm trong file riêng `rieng-tu/BI-MAT-KHONG-DUA-LEN-MANG.md`. Nếu dùng khóa đó thì bỏ qua bước 3.

```js
window.HHKN_CONFIG = {
  supabaseUrl: 'https://abcd1234.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi...',
  vapidPublicKey: 'BCx...'
};
```

Khóa anon được phép công khai, vì dữ liệu đã được bảo vệ bằng RLS (mỗi tài khoản chỉ thấy dữ liệu của mình). Nếu không muốn sửa file, bạn có thể nhập 3 giá trị này trong app: **Cài đặt → Đồng bộ → Kết nối Supabase**, nhưng phải nhập trên từng máy.

## 5. Edge Function gửi nhắc tập

**Cách dễ (trên Dashboard):**
1. **Edge Functions → Deploy a new function → Via Editor**, đặt tên đúng là `send-reminders`.
2. Dán nội dung file `supabase/functions/send-reminders/index.ts` → **Deploy**.
3. Vào function → **Details** → tắt **Enforce JWT verification** (function tự kiểm tra bằng CRON_SECRET và token đăng nhập).
4. **Edge Functions → Secrets** → thêm 3 secret:
   - `VAPID_PRIVATE_JWK` = Private JWK ở bước 3 (cả chuỗi `{...}`)
   - `VAPID_SUBJECT` = `mailto:email-cua-ban@gmail.com`
   - `CRON_SECRET` = một chuỗi ngẫu nhiên tự đặt, ví dụ `hhkn-8f3k2m9x`

**Cách dùng CLI (nếu quen):**
```bash
supabase functions deploy send-reminders --no-verify-jwt
supabase secrets set VAPID_PRIVATE_JWK='{"kty":"EC",...}' VAPID_SUBJECT='mailto:...' CRON_SECRET='...'
```

**Lịch chạy mỗi 5 phút:** mở file `supabase/cron.sql`, thay `<PROJECT_REF>` và `<CRON_SECRET>`, rồi chạy trong SQL Editor.

## 6. Cài app và bật nhắc trên thiết bị

**Samsung S23 Ultra (Chrome):**
1. Mở link app → menu ⋮ → **Thêm vào màn hình chính → Cài đặt**.
2. Mở app từ màn hình chính → **Cài đặt** → *Tạo tài khoản* (lần đầu) hoặc *Đăng nhập*.
3. **Nhắc tập → Bật thông báo** → cho phép → bấm **Thử trên máy**, rồi **Thử từ server**.
4. Để thông báo đến đúng giờ: *Cài đặt Android → Ứng dụng → Chrome → Pin → Không hạn chế*.

**ThinkPad P1 (Chrome hoặc Edge):** mở link → bấm biểu tượng **Cài đặt** ở thanh địa chỉ → đăng nhập cùng tài khoản. Dữ liệu tự đồng bộ hai chiều.

**Khóa đăng ký người lạ:** sau khi đã tạo xong tài khoản của bạn, vào *Authentication → Sign In / Providers* → tắt **Allow new users to sign up**.

## 7. Cập nhật app về sau

Từ v1.1 app không dùng AI nên không cần API key nào.

Sửa code xong thì tăng số `VERSION` trong `sw.js` (ví dụ `hhkn-v1.1.1`) rồi deploy. Với Vercel: thay toàn bộ file trong repo (giữ nguyên `config.js`) rồi push, Vercel tự deploy.
**Nhớ đưa lên cả 2 thư mục mới `fonts/` và `vendor/`** và xóa file cũ `js/ai.js`. Lần mở app sau sẽ hiện thông báo **Có phiên bản mới → Cập nhật**.

---

## Phím tắt trên laptop

| Phím | Tác dụng |
|---|---|
| `1`–`5` | Hôm nay · Kỹ năng · Thẻ · Thống kê · Cài đặt |
| `N` | Bắt đầu tập / mở buổi đang tập |
| `Space` / `X` | Đạt / Trượt (khi đang tập) |
| `Space`, `1`–`4` | Lật thẻ, chấm thẻ |
| `Esc` | Đóng hộp thoại |

## Gặp lỗi?

- **"Lỗi đồng bộ"**: kiểm tra đã chạy `schema.sql` chưa, URL và anon key có đúng không.
- **"Thử từ server" báo 401**: chưa tắt *Enforce JWT verification* hoặc chưa đăng nhập.
- **Thông báo không đến**: xem *Edge Functions → send-reminders → Logs*, và kiểm tra bằng `select * from cron.job_run_details order by start_time desc limit 10;`.
