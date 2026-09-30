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
  { nhom: "Hai người", cau: [
    "Tôi và người yêu có hợp nhau không?",
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

interface HoiResponse {
  cau_tra_loi?: string;
  che_do?: string;
  can_them?: string[];
  error?: string;
}

export function QandA({ hoTen, ngay, thang, nam }: Props) {
  const [cauHoi, setCauHoi] = useState("");
  const [dangHoi, setDangHoi] = useState(false);
  const [traLoi, setTraLoi] = useState<string | null>(null);
  const [cheDo, setCheDo] = useState<string | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [moKia, setMoKia] = useState(false);
  const [kia, setKia] = useState({ ten: "", ngay: "", thang: "", nam: "" });

  const kiaHopLe = kia.ngay !== "" && kia.thang !== "" && kia.nam.length === 4;

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
        body: JSON.stringify({
          ho_ten: hoTen, ngay, thang, nam, cau_hoi: cau,
          ...(kiaHopLe ? { nguoi_kia: {
            ...(kia.ten.trim() ? { ho_ten: [kia.ten.trim()] } : {}),
            ngay: Number(kia.ngay), thang: Number(kia.thang), nam: Number(kia.nam),
          } } : {}),
        }),
      });
      const d = (await r.json()) as HoiResponse;
      if (d.can_them?.includes("nguoi_kia")) setMoKia(true);
      if (d.cau_tra_loi) {
        setTraLoi(d.cau_tra_loi);
        setCheDo(d.che_do ?? null);
      } else {
        setThongBao(d.error ?? "Chưa trả lời được lúc này, thử lại sau.");
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

      <details className="qa-kia" open={moKia} onToggle={(e) => setMoKia((e.target as HTMLDetailsElement).open)}>
        <summary>Hỏi về người khác hoặc xem hợp đôi? Nhập ngày sinh người thứ hai</summary>
        <div className="field-row">
          <label className="field"><span>Họ tên (không bắt buộc)</span>
            <input value={kia.ten} onChange={(e) => setKia({ ...kia, ten: e.target.value })} /></label>
        </div>
        <div className="field-row">
          <label className="field"><span>Ngày</span>
            <input type="number" min={1} max={31} value={kia.ngay} aria-label="Ngày sinh người thứ hai"
              onChange={(e) => setKia({ ...kia, ngay: e.target.value })} /></label>
          <label className="field"><span>Tháng</span>
            <input type="number" min={1} max={12} value={kia.thang} aria-label="Tháng sinh người thứ hai"
              onChange={(e) => setKia({ ...kia, thang: e.target.value })} /></label>
          <label className="field"><span>Năm</span>
            <input type="number" min={1900} max={2100} value={kia.nam} aria-label="Năm sinh người thứ hai"
              onChange={(e) => setKia({ ...kia, nam: e.target.value })} /></label>
        </div>
      </details>

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
        <div className="qa-answer" data-testid="qa-answer">
          {traLoi.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
          <p className="qa-mode">
            {cheDo === "llm" ? "Diễn đạt bởi AI từ kho tri thức có nguồn."
              : "Ghép trực tiếp từ kho tri thức có nguồn."}
          </p>
        </div>
      )}
      {thongBao && <p className="qa-note">{thongBao}</p>}
    </div>
  );
}
