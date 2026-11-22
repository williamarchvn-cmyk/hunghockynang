/* ai.js — tích hợp Gemini (key chỉ lưu trên máy này) */
'use strict';
(() => {
  const H = window.H;
  const BASE = 'https://generativelanguage.googleapis.com/v1beta';
  const AI = H.AI = {
    DEFAULT_MODEL: 'gemini-3.8-flash',
    key: () => H.Store.local.geminiKey || '',
    model: () => H.Store.local.geminiModel || AI.DEFAULT_MODEL,
    ready: () => !!AI.key(),

    async call(prompt, { json = true, temperature = 0.7 } = {}) {
      if (!AI.key()) throw new Error('Chưa có Gemini API key. Vào Cài đặt → AI để nhập.');
      const res = await fetch(`${BASE}/models/${encodeURIComponent(AI.model())}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': AI.key() },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'Bạn là huấn luyện viên kỹ năng theo phương pháp luyện tập có chủ đích (deliberate practice), kết hợp chia nhỏ kỹ năng, ôn giãn cách, tự kiểm tra và học xen kẽ. Luôn trả lời bằng tiếng Việt, cụ thể, đo được, thực tế cho người đi làm có khoảng 2 giờ/ngày cho nhiều kỹ năng.' }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: Object.assign({ temperature }, json ? { responseMimeType: 'application/json' } : {})
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || `Lỗi Gemini (${res.status})`);
      const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
      if (!text) throw new Error('Gemini không trả về nội dung.');
      if (!json) return text;
      try { return JSON.parse(text); } catch {
        const m = text.match(/[\[{][\s\S]*[\]}]/); if (m) return JSON.parse(m[0]);
        throw new Error('Không đọc được JSON từ Gemini.');
      }
    },

    async listModels() {
      const res = await fetch(`${BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': AI.key() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Không tải được danh sách model');
      return (data.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace('models/', ''));
    },

    // 1. Chia nhỏ kỹ năng
    decompose({ name, type, current, goal, minPerDay, notes }) {
      return AI.call(`Thiết kế lộ trình luyện tập có chủ đích cho kỹ năng: "${name}" (nhóm: ${H.TYPES[type]?.label || 'khác'}).
Trình độ hiện tại: ${current || 'mới bắt đầu'}. Mục tiêu mong muốn: ${goal || 'thuần thục để dùng trong công việc/đời sống'}.
Thời gian dành cho kỹ năng này: khoảng ${minPerDay} phút/ngày. Ghi chú thêm: ${notes || 'không'}.
Trả về JSON đúng cấu trúc:
{"goal":"định nghĩa thuần thục đo được (1-2 câu)",
 "subs":[{"name":"kỹ năng con","desc":"mô tả ngắn","importance":1-3,"level":0-5 (ước lượng theo trình độ hiện tại),"drills":["bài tập cụ thể có tiêu chí đạt", "..."],"model":"mẫu chuẩn để so sánh (chuyên gia, nguồn tham khảo)"}],
 "benches":[{"name":"bài test mốc","unit":"đơn vị","higherBetter":true,"howTo":"cách đo"}],
 "cards":[{"front":"câu hỏi tự kiểm tra","back":"đáp án ngắn"}]}
Yêu cầu: 5-8 kỹ năng con sắp theo thứ tự nên học; mỗi kỹ năng con 2-3 bài tập; 2 bài test mốc; 6-10 thẻ cho phần kiến thức nền.`);
    },

    // 2. Gợi ý bài tập cho buổi tập
    drills({ skill, sub, recent }) {
      const hist = recent.slice(0, 5).map(s => `- ${s.day}: mục tiêu "${s.goal || ''}", đạt ${s.success || 0}/${s.attempts || 0}, lỗi chính: ${s.mainError || 'không ghi'}, lần sau: ${s.nextTime || ''}`).join('\n') || 'chưa có';
      return AI.call(`Kỹ năng: ${skill.name}. Kỹ năng con: ${sub.name} (${sub.desc || ''}). Mức hiện tại ${sub.level || 0}/5 (thang: ${H.LEVELS.join(' / ')}).
Lịch sử gần đây:\n${hist}
Đề xuất 3 bài tập có chủ đích cho buổi hôm nay, độ khó sao cho tỉ lệ đạt khoảng 70-85%. Tập trung sửa lỗi lặp lại nếu có.
Trả JSON: {"drills":[{"title":"tên ngắn","how":"cách tập từng bước","criterion":"tiêu chí đạt cho mỗi lần thử","minutes":số phút}]}`);
    },

    // 3. Tạo thẻ tự kiểm tra
    cards({ skill, text, n = 10 }) {
      return AI.call(`Từ nội dung sau về kỹ năng "${skill.name}", tạo ${n} thẻ tự kiểm tra (retrieval practice). Câu hỏi buộc phải nhớ lại hoặc vận dụng, không hỏi kiểu có/không; đáp án ngắn gọn.
Nội dung:\n"""${text}"""
Trả JSON: {"cards":[{"front":"...","back":"..."}]}`);
    },

    // 4. Nhận xét tuần
    weekly(summary) {
      return AI.call(`Đây là số liệu luyện tập 7 ngày qua của tôi (JSON):\n${JSON.stringify(summary)}
Hãy rà soát như một huấn luyện viên: nhận xét thẳng thắn, dựa trên số liệu. Trả JSON:
{"summary":"2-3 câu tổng quan","wins":["điểm làm tốt"],"issues":["vấn đề, kèm số liệu"],"next":["3-5 điều chỉnh cụ thể cho tuần tới"]}`, { temperature: 0.5 });
    }
  };
})();
