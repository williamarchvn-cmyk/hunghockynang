# Kế hoạch: PWA "Hùng học kỹ năng"

> Phiên bản kế hoạch: 1.1 · Ngày 22/11/2026 (v1.1: bỏ toàn bộ AI, tối ưu tốc độ và giao diện — xem mục 9)
> Mục tiêu: một app cá nhân giúp học **song song nhiều kỹ năng** (Lập kế hoạch, Lập trình, Thể thao, và bất kỳ kỹ năng nào thêm sau), lấy **luyện tập có chủ đích** làm trục chính, kết hợp các phương pháp học có bằng chứng tốt để đạt mức thuần thục nhanh nhất với khoảng **2 giờ/ngày**.

---

## 1. Các quyết định đã chốt

| Hạng mục | Quyết định |
|---|---|
| Người dùng | Một người: Hùng |
| Kỹ năng | Nhiều kỹ năng song song. Mẫu có sẵn: Lập kế hoạch, Lập trình, Thể thao |
| Thời lượng | 120 phút/ngày (chỉnh được), app tự chia cho từng kỹ năng |
| Dữ liệu | Đồng bộ tự động laptop ↔ điện thoại qua **Supabase** (gói miễn phí), có đăng nhập |
| AI | **Không dùng** (bỏ từ v1.1). Gợi ý và nhận xét đều tính từ dữ liệu của chính bạn |
| Nhắc tập | **PWA** + Web Push thật (nhắc cả khi đã đóng app) + file lịch .ics để dự phòng |
| Thiết bị | Samsung S23 Ultra (màn dọc ~384–412 px CSS) · ThinkPad P1 Gen 1 (15,6", ~1280–1536 px CSS) |
| Giao diện | Nền sáng, màu phẳng, **không gradient**, gọn và rõ |

---

## 2. Nền tảng phương pháp → tính năng tương ứng

| Phương pháp | Ý chính | Tính năng trong app |
|---|---|---|
| **Luyện tập có chủ đích** (Ericsson) | Mục tiêu nhỏ, cụ thể cho từng buổi; tập ở rìa năng lực; phản hồi ngay; tập trung cao; sửa lỗi cụ thể | Màn **Buổi tập**: một mục tiêu, đồng hồ tập trung, đếm lần thử/đạt, ghi lỗi chính |
| **Chia nhỏ kỹ năng** (kiểu "20 giờ đầu tiên", Ultralearning) | Chia kỹ năng thành kỹ năng con, tập riêng phần yếu nhất | **Bản đồ kỹ năng**: các kỹ năng con với mức 0–5 |
| **Vùng độ khó vừa sức** | Tỉ lệ đúng khoảng 60–85% là vùng học hiệu quả | Hiển thị tỉ lệ đạt trực tiếp, kèm gợi ý **tăng/giảm độ khó** |
| **Giãn cách thời gian ôn** | Ôn lại theo khoảng thời gian tăng dần giúp nhớ lâu | Kỹ năng con đã đạt được hẹn ôn lại sau 1 → 3 → 7 → 14 → 30 → 60 ngày |
| **Học xen kẽ** | Trộn nhiều dạng bài thay vì tập dồn một dạng | Khối ôn tập trộn kỹ năng con của nhiều kỹ năng |
| **Tự nhớ lại chủ động** | Tự kiểm tra hiệu quả hơn đọc lại | **Thẻ tự kiểm tra** (thuật toán SM-2 rút gọn), AI tạo thẻ từ ghi chú |
| **Mô hình chuẩn** (mental representation) | So sánh với mẫu của chuyên gia | Mỗi kỹ năng con có mục "Mẫu chuẩn": link video, code mẫu, kế hoạch mẫu |
| **Phản tư sau buổi tập** | Tự hỏi: làm được gì, sai ở đâu, lần sau đổi gì | Form ghi lại trong 2 phút khi kết thúc buổi + **Nhật ký lỗi** gom các lỗi lặp lại |
| **Đo bằng bài test mốc** | Đo tiến bộ thật, không dựa vào cảm giác | **Bài test mốc** mỗi 14 ngày cho từng kỹ năng, có biểu đồ |
| **Rà soát tuần** (vòng PDCA) | Mỗi tuần nhìn lại số liệu và điều chỉnh kế hoạch | Màn **Thống kê** có mục rà soát tuần, AI nhận xét |
| **Phục hồi** (riêng thể thao) | Bài cường độ cao cần ngày nhẹ xen kẽ | Ghi mức gắng sức RPE 1–10; hôm trước ≥ 8 thì hôm nay gợi ý tập kỹ thuật nhẹ |

**Lưu ý trung thực:** luyện tập có chủ đích giúp tiến bộ rõ nhưng không phải yếu tố duy nhất. Vì vậy app đo **chất lượng** buổi tập (tỉ lệ đạt, mức tập trung, lỗi lặp lại, kết quả test mốc) chứ không chỉ đếm giờ.

---

## 3. Tính năng chi tiết

### 3.1 Hôm nay (màn chính)
- Vòng tiến độ: số phút đã tập / mục tiêu 120 phút, chuỗi ngày tập liên tiếp.
- **Kế hoạch hôm nay** tự tạo theo khối, ví dụ:
  1. Khởi động bằng thẻ tự kiểm tra đến hạn (10–15 phút).
  2. Khối luyện tập có chủ đích cho từng kỹ năng (25–45 phút), chọn kỹ năng con theo điểm ưu tiên = (5 − mức) × độ quan trọng + số ngày chưa tập.
  3. Khối ôn xen kẽ cho các kỹ năng con đến hạn (10–15 phút).
  4. Bài test mốc nếu đến hạn.
  5. Nghỉ 5–10 phút giữa các khối.
- Mỗi khối có nút **Bắt đầu**, bấm vào là chuyển sang màn Buổi tập.

### 3.2 Kỹ năng
- Danh sách thẻ kỹ năng (màu riêng cho từng kỹ năng), mức trung bình, số giờ đã tập, phút mục tiêu mỗi ngày.
- Tạo kỹ năng theo 3 cách: **từ mẫu** (Lập kế hoạch / Lập trình / Thể thao), hoặc **tự tạo** (gõ sẵn danh sách kỹ năng con, mỗi dòng một kỹ năng).
- Trang chi tiết kỹ năng:
  - Định nghĩa "thuần thục" đo được và ngày mục tiêu.
  - Các kỹ năng con: mức 0–5, mô tả từng mức, bài tập gợi ý, mẫu chuẩn, lịch ôn.
  - Bài test mốc kèm biểu đồ kết quả.
  - Nhật ký lỗi: các lỗi lặp lại nhiều nhất.
  - Lịch sử buổi tập.

### 3.3 Buổi tập (chế độ tập trung)
- Chọn kỹ năng và kỹ năng con, ghi **một mục tiêu cụ thể** (app gợi ý từ: điều lần trước tự dặn, lỗi lặp lại, kết quả buổi trước để tăng/giảm độ khó, bài tập có sẵn).
- Đồng hồ đếm ngược, giữ màn hình luôn sáng (Wake Lock), vẫn tính đúng giờ khi chuyển app.
- Nút lớn **Đạt / Trượt**, tỉ lệ đạt hiển thị trực tiếp với 3 vùng: Quá khó / Vừa sức / Quá dễ.
- Ghi nhanh lỗi trong lúc tập.
- Kết thúc buổi: chấm mức tập trung 1–5, ghi làm được gì, lỗi chính, lần sau chỉnh gì. Với thể thao có thêm RPE. App gợi ý nâng mức khi đạt từ 85% trở lên trong 3 buổi liên tiếp.

### 3.4 Thẻ tự kiểm tra
- Lật thẻ, chấm 4 mức: Quên / Khó / Được / Dễ, lịch ôn tính theo SM-2.
- Lọc theo kỹ năng. Tạo thẻ thủ công hoặc **Nhập nhiều**: dán mỗi dòng `câu hỏi | đáp án` (hoặc 2 cột từ Excel/Google Sheets).

### 3.5 Thống kê và rà soát tuần
- Lịch nhiệt 16 tuần gần nhất.
- Số phút mỗi tuần theo kỹ năng, tỉ lệ đạt trung bình, mức tập trung trung bình.
- Đường tiến bộ của mức kỹ năng con và kết quả test mốc.
- Rà soát tuần: điều gì hiệu quả, điều gì chưa, tuần tới chỉnh gì. Mục **Nhận xét tuần này** tự động theo quy tắc: tiến độ so mục tiêu, vùng tỉ lệ đạt, tỉ lệ thời gian có chủ đích, mức tập trung, kỹ năng bị bỏ quên, kỹ năng con quan trọng lâu chưa tập, lỗi lặp, thẻ và test mốc đến hạn.

### 3.6 Cài đặt
- Tài khoản Supabase (email + mật khẩu), trạng thái đồng bộ, nút đồng bộ ngay.
- Mục tiêu phút mỗi ngày, ngày nghỉ trong tuần.
- Nhắc tập: bật thông báo, giờ nhắc (mặc định 06:00 và 20:00), nhắc cuối ngày nếu chưa đủ phút. Tải file lịch .ics làm dự phòng.
- Xuất/nhập dữ liệu JSON để sao lưu.

---

## 4. Giao diện (UX/UI)

- **Phong cách:** tối giản, ưu tiên rõ ràng và tốc độ, bố cục dạng ô (bento) trên laptop, chữ lớn, số liệu nổi bật, bo góc 14–20 px, viền mảnh thay cho đổ bóng đậm. Không gradient, không hiệu ứng rườm rà.
- **Bảng màu (phẳng):**
  - Nền `#F6F6F3` · Bề mặt `#FFFFFF` · Viền `#E4E3DE`
  - Chữ `#16171A` · Chữ phụ `#6A6B70`
  - Nhấn `#2550C9` · Đạt `#17803D` · Cảnh báo `#B86E00` · Lỗi `#C2362B`
  - Màu kỹ năng: chàm `#4F46E5`, xanh ngọc `#0F8B8D`, cam `#D9480F`, tím `#9C36B5`, xanh lá `#2F9E44`, hồng `#C2255C`
- **Phông chữ:** Be Vietnam Pro (hiển thị tiếng Việt tốt), số dùng kiểu tabular.
- **S23 Ultra:** thanh điều hướng dưới gồm Hôm nay · Kỹ năng · **Tập** (nút giữa nổi bật) · Thẻ · Thống kê; vùng bấm tối thiểu 48 px; chừa khoảng an toàn cho thanh cử chỉ; thao tác chính nằm ở nửa dưới màn hình.
- **ThinkPad P1:** thanh bên trái cố định, nội dung 2–3 cột, có phím tắt (`N` tạo buổi tập, `Space` bấm Đạt, `X` bấm Trượt, `/` tìm kiếm).
- **Trợ năng:** độ tương phản đạt AA, có viền focus rõ, hỗ trợ chế độ giảm chuyển động.

---

## 5. Kiến trúc kỹ thuật

```
hung-hoc-ky-nang/
├─ index.html              # khung app
├─ styles.css              # giao diện
├─ js/                     # core, sync, charts, views, main (vanilla JS, không cần build)
├─ fonts/  vendor/         # phông chữ và thư viện Supabase lưu sẵn (offline)
├─ config.js               # Supabase URL/anon key, VAPID public key (điền 1 lần)
├─ sw.js                   # service worker: cache offline, nhận push
├─ manifest.webmanifest    # cài PWA
├─ icons/                  # icon 192/512 + maskable
├─ supabase/
│  ├─ schema.sql           # bảng, RLS, trigger, cron
│  ├─ cron.sql             # lịch chạy 5 phút/lần
│  └─ functions/send-reminders/index.ts   # Edge Function gửi nhắc tập
└─ HUONG-DAN.md            # hướng dẫn triển khai từng bước
```

- **Offline trước, đồng bộ sau:** dữ liệu luôn lưu trên máy trước (localStorage), app chạy được khi mất mạng.
- **Đồng bộ:** một bảng chung `records (id, user_id, kind, data jsonb, updated_at, deleted, server_at)`.
  - Đẩy lên: các bản ghi đã sửa (upsert).
  - Kéo về: các bản ghi có `server_at` mới hơn lần kéo trước.
  - Xung đột: bản ghi sửa sau cùng sẽ thắng (trigger trên server bỏ qua bản cũ hơn).
  - Realtime: sửa trên laptop thì điện thoại cập nhật ngay. Ngoài ra app tự đồng bộ khi mở lại và mỗi 60 giây.
  - RLS: mỗi tài khoản chỉ đọc/ghi được dữ liệu của chính mình.
- **Loại bản ghi (`kind`):** `skill`, `subskill`, `session`, `card`, `benchmark`, `bench_result`, `review` (rà soát tuần), `settings`.
- **Nhắc tập (Web Push):**
  - Trình duyệt đăng ký nhận push; thông tin đăng ký lưu ở bảng `push_subscriptions`.
  - `pg_cron` gọi Edge Function `send-reminders` mỗi 5 phút. Hàm này đọc giờ nhắc trong `settings` (múi giờ Asia/Ho_Chi_Minh), tính số phút đã tập hôm nay và số mục đến hạn ôn, rồi gửi thông báo qua thư viện `@pushforge/builder` (chạy trên Web Crypto, hợp với Deno).
  - Bảng `reminder_log` chống gửi trùng.
- **Thư viện ngoài:** chỉ `@supabase/supabase-js` v2, lưu sẵn trong `vendor/` và chỉ tải khi cần đồng bộ. Phông Be Vietnam Pro lưu sẵn trong `fonts/`. App không gọi CDN nào, chạy được offline hoàn toàn. Biểu đồ vẽ bằng SVG tự viết.

---

## 6. Mẫu kỹ năng có sẵn

**Lập kế hoạch:** Xác định mục tiêu (SMART/OKR) · Chia nhỏ công việc (WBS) · Ước lượng thời gian · Sắp thứ tự ưu tiên (Eisenhower/MoSCoW) · Xếp lịch theo khối thời gian · Lường trước rủi ro · Rà soát tuần.
- Test mốc: sai số ước lượng (%) · tỉ lệ việc xong đúng hạn (%).

**Lập trình:** Đọc hiểu code · Cấu trúc dữ liệu & thuật toán · Gỡ lỗi (debug) · Viết test · Thiết kế & kiến trúc · Công cụ (Git, terminal) · Làm việc cùng AI (prompt, review code AI viết).
- Test mốc: số bài kata giải được trong 30 phút · thời gian làm xong một tính năng chuẩn.

**Thể thao (khung chung; với môn cụ thể hãy tự tạo kỹ năng riêng):** Kỹ thuật động tác · Sức bền · Sức mạnh · Linh hoạt & phục hồi · Chiến thuật · Tâm lý thi đấu.
- Test mốc: tùy môn, ví dụ thời gian chạy 5 km hoặc số lần thực hiện đúng kỹ thuật trên 20 lần.

---

## 7. Lộ trình code

1. Khung PWA: manifest, service worker, icon, bố cục responsive, điều hướng.
2. Kho dữ liệu cục bộ và các hàm xử lý bản ghi.
3. Màn Kỹ năng: tạo từ mẫu hoặc tạo trống, bản đồ kỹ năng con.
4. Màn Buổi tập: đồng hồ, Đạt/Trượt, ghi lại sau buổi, gợi ý độ khó và nâng mức.
5. Bộ lập kế hoạch hôm nay và lịch ôn giãn cách.
6. Thẻ tự kiểm tra (SM-2).
7. Thống kê, lịch nhiệt, biểu đồ, rà soát tuần.
8. ~~Tích hợp Gemini~~ (bỏ ở v1.1).
9. Đồng bộ Supabase + realtime.
10. Web Push: đăng ký trên trình duyệt, schema SQL, Edge Function.
11. Kiểm tra trên khung màn hình S23 Ultra và ThinkPad P1, sửa lỗi, viết HUONG-DAN.md.

## 8. Ngoài phạm vi bản đầu (có thể làm sau)
- Ghi âm hoặc quay video buổi tập để tự xem lại.
- Kết nối dữ liệu từ đồng hồ thể thao hoặc Google Fit.
- Chế độ tối.

---

## 9. Thay đổi ở v1.1 (22/11/2026)

**Bỏ AI hoàn toàn:** xóa `js/ai.js`, mục Cài đặt → AI, các nút AI. Key Gemini cũ còn lưu trên máy sẽ tự bị xóa khi mở bản mới. Thay thế bằng:
- Gợi ý mục tiêu buổi tập từ dữ liệu: lần trước dặn, lỗi lặp ≥ 2 lần, kết quả buổi trước (quá dễ → "Khó hơn", quá khó → "Chia nhỏ hơn"), bài tập có sẵn.
- Tự tạo kỹ năng kèm danh sách kỹ năng con trong một bước.
- Nhập nhiều thẻ một lúc (`câu hỏi | đáp án`, Tab, hoặc dán 2 cột).
- Nhận xét tuần tự động theo quy tắc luyện tập có chủ đích (tối đa 6 dòng, ưu tiên vấn đề nặng).

**Tốc độ** (đo trên dữ liệu 1 năm, ~640 bản ghi):
- Chỉ mục dữ liệu theo loại + nhớ đệm truy vấn (buổi tập, phút theo ngày, kỹ năng con): màn Hôm nay 7,6 → 4,2 ms.
- Gộp ghi localStorage (250 ms) thay vì ghi mỗi thay đổi: 20 lần lưu 92 → 1,5 ms; ghi ngay khi ẩn app/rời trang.
- Phông chữ và thư viện Supabase lưu sẵn, script `defer`, Supabase tải sau khi giao diện đã hiện. Không còn request tới CDN.

**Giao diện:**
- Sửa lỗi tràn ngang trên điện thoại khi câu hỏi thẻ dài (làm lệch hộp thoại).
- Hôm nay: Kế hoạch đưa lên ngay dưới tiến độ; nút Bắt đầu gọn trên điện thoại.
- Thông báo nổi lên đầu màn hình khi đang mở hộp thoại để không che nút.
- Ô giờ nhắc đủ rộng, thẻ Cài đặt không bị kéo giãn, hiệu ứng nhấn nút.
