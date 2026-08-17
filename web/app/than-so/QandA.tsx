"use client";

import { useState } from "react";

// Gợi ý câu hỏi — guide người chưa biết hỏi gì. Tất cả khung ở dạng TỰ SOI
// (không phải dự đoán tương lai), khớp định vị "tham khảo văn hoá".
const GOI_Y: { nhom: string; cau: string[] }[] = [
  { nhom: "Bản thân", cau: [
    "Điểm mạnh cốt lõi của tôi là gì?",
    "Mặt tối nào tôi hay bỏ qua ở chính mình?",
  ] },
  { nhom: "Nghề nghiệp", cau: [
    "Con số của tôi hợp với môi trường làm việc thế nào?",
    "Đâu là điểm nghẽn sự nghiệp theo con số của tôi?",
  ] },
  { nhom: "Tình cảm", cau: [
    "Tôi cần gì trong một mối quan hệ?",
    "Điều gì hay cản trở tôi trong tình cảm?",
  ] },
  { nhom: "Cuộc sống", cau: [
    "Bài học lớn của đời tôi là gì?",
    "Giai đoạn này tôi nên tập trung điều gì?",
  ] },
];

interface Props {
  hoTen: string[];
  ngay: number;
  thang: number;
  nam: number;
}

export function QandA({ hoTen, ngay, thang, nam }: Props) {
  const [cauHoi, setCauHoi] = useState("");
  const [dangHoi, setDangHoi] = useState(false);
  const [traLoi, setTraLoi] = useState<string | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);

  async function hoi(q: string) {
    const cau = q.trim();
    if (cau.length < 3 || dangHoi) return;
    setDangHoi(true);
    setTraLoi(null);
    setThongBao(null);
    try {
      const r = await fetch("/api/thanso/hoi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ho_ten: hoTen, ngay, thang, nam, cau_hoi: cau }),
      });
      const d = await r.json();
      if (d.da_bat_llm === false) {
        setThongBao("Tính năng hỏi sâu sắp có — đang được bật.");
      } else if (d.cau_tra_loi) {
        setTraLoi(d.cau_tra_loi);
      } else {
        setThongBao(d.loi ?? "Chưa trả lời được lúc này, thử lại sau.");
      }
    } catch {
      setThongBao("Không kết nối được. Thử lại sau.");
    } finally {
      setDangHoi(false);
    }
  }

  return (
    <div className="qa">
      <div className="section-label">Hỏi sâu hơn</div>
      <p className="qa-intro">
        Chưa biết hỏi gì? Chọn một câu gợi ý, hoặc tự đặt câu hỏi. Câu trả lời soi
        câu hỏi của bạn qua chính những con số ở trên — góc nhìn tham khảo để bạn
        tự ngẫm, không phải lời tiên đoán.
      </p>

      <div className="qa-suggest">
        {GOI_Y.map((g) => (
          <div key={g.nhom} className="qa-group">
            <span className="qa-group-name">{g.nhom}</span>
            {g.cau.map((c) => (
              <button key={c} type="button" className="qa-chip"
                onClick={() => { setCauHoi(c); hoi(c); }} disabled={dangHoi}>
                {c}
              </button>
            ))}
          </div>
        ))}
      </div>

      <form className="qa-form" onSubmit={(e) => { e.preventDefault(); hoi(cauHoi); }}>
        <input
          value={cauHoi}
          onChange={(e) => setCauHoi(e.target.value)}
          placeholder="Hoặc gõ câu hỏi của riêng bạn…"
          maxLength={400}
          aria-label="Câu hỏi của bạn"
        />
        <button type="submit" className="btn-primary" disabled={dangHoi || cauHoi.trim().length < 3}>
          {dangHoi ? "Đang soi…" : "Hỏi"}
        </button>
      </form>

      {traLoi && (
        <div className="qa-answer">
          <p>{traLoi}</p>
        </div>
      )}
      {thongBao && <p className="qa-note">{thongBao}</p>}
    </div>
  );
}
