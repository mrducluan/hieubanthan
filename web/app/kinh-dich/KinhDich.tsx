"use client";

import { useState } from "react";

interface Hao { vi_tri: number; am_duong: string; luc_than: string; the_ung: string }
interface Quai { so_king_wen: number; ten: string; hao: Hao[] }
interface Que { quai_ban: Quai; quai_bien: Quai | null; hao_dong: number[]; nguon_ngau_nhien?: string }
interface Res {
  que?: Que | null;
  cau_tra_loi?: string;
  phan_loai?: { truong_phai: string | null; loai: string };
  co_canh_bao?: { loai: string; chi_tiet: string }[];
  error?: string;
}

const PHAI: Record<string, string> = { nghia_ly: "Nghĩa Lý", luc_hao: "Lục Hào", mai_hoa: "Mai Hoa" };
const KHOA_LS = "kd-da-hoi";

function daHoiGanDay(cau: string): boolean {
  try {
    const m = JSON.parse(localStorage.getItem(KHOA_LS) ?? "{}") as Record<string, number>;
    const t = m[cau.trim().toLowerCase()];
    return !!t && Date.now() - t < 30 * 86400_000;
  } catch { return false; }
}
function ghiDaHoi(cau: string) {
  try {
    const m = JSON.parse(localStorage.getItem(KHOA_LS) ?? "{}") as Record<string, number>;
    m[cau.trim().toLowerCase()] = Date.now();
    localStorage.setItem(KHOA_LS, JSON.stringify(m));
  } catch { /* trình duyệt chặn lưu — bỏ qua */ }
}

function VeQue({ q, dong }: { q: Quai; dong: number[] }) {
  return (
    <div className="kd-que" aria-label={`Quẻ ${q.ten}`}>
      {[...q.hao].reverse().map((h) => (
        <div key={h.vi_tri} className={`kd-hao ${h.am_duong === "Dương" ? "duong" : "am"}`}>
          <span className="kd-vach" />
          {h.am_duong === "Âm" && <span className="kd-vach" />}
          <span className="kd-nhan">
            {dong.includes(h.vi_tri) ? "động · " : ""}{h.luc_than}{h.the_ung ? ` · ${h.the_ung}` : ""}
          </span>
        </div>
      ))}
      <div className="kd-ten">{q.ten} <span className="tag">quẻ {q.so_king_wen}</span></div>
    </div>
  );
}

export function KinhDich() {
  const [cau, setCau] = useState("");
  const [cheDo, setCheDo] = useState("tu_dong");
  const [cach, setCach] = useState("may_gieo");
  const [tay, setTay] = useState("");
  const [dang, setDang] = useState(false);
  const [res, setRes] = useState<Res | null>(null);
  const [nhac, setNhac] = useState<string | null>(null);

  async function hoi(e: React.FormEvent) {
    e.preventDefault();
    if (cau.trim().length < 3 || dang) return;
    setNhac(daHoiGanDay(cau) ? "Bạn đã hỏi đúng câu này trong 30 ngày qua. Theo lời quẻ Mông, hỏi lại cùng việc làm lần xem mất giá trị — nên suy ngẫm quẻ trước." : null);
    const vals = tay.split(/[^6-9]+/).filter(Boolean).map(Number);
    if (cach === "gieo_tay" && vals.length !== 6) { setRes({ error: "Gieo tay: nhập đủ 6 số 6/7/8/9, từ hào 1 lên hào 6." }); return; }
    setDang(true);
    try {
      const r = await fetch("/api/kinhdich/hoi", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ cau_hoi: cau, che_do: cheDo, cach_ra_que: cach,
          ...(cach === "gieo_tay" ? { gia_tri_hao: vals } : {}) }),
      });
      const d = (await r.json()) as Res;
      setRes(d);
      if (d.que) ghiDaHoi(cau);
    } catch { setRes({ error: "Không kết nối được. Thử lại sau." }); }
    finally { setDang(false); }
  }

  return (
    <section>
      <form className="reading-form" onSubmit={hoi}>
        <label className="field"><span>Câu hỏi (một việc, cụ thể)</span>
          <input value={cau} onChange={(e) => setCau(e.target.value)} maxLength={500}
            placeholder="Có nên nhận lời làm quản lý không?" aria-label="Câu hỏi Kinh Dịch" /></label>
        <div className="field-row">
          <label className="field"><span>Chế độ</span>
            <select value={cheDo} onChange={(e) => setCheDo(e.target.value)} aria-label="Chế độ">
              <option value="tu_dong">Tự động chọn phái</option>
              <option value="nghia_ly">Chỉ Nghĩa Lý (phản tư)</option>
              <option value="day_du">Đầy đủ (thành bại, ứng kỳ)</option>
            </select></label>
          <label className="field"><span>Cách ra quẻ</span>
            <select value={cach} onChange={(e) => setCach(e.target.value)} aria-label="Cách ra quẻ">
              <option value="may_gieo">Máy gieo ngẫu nhiên</option>
              <option value="mai_hoa">Mai Hoa theo giờ hiện tại</option>
              <option value="gieo_tay">Tôi tự gieo</option>
            </select></label>
        </div>
        {cach === "gieo_tay" && (
          <label className="field"><span>6 hào tự gieo (6/7/8/9, hào 1 → 6)</span>
            <input value={tay} onChange={(e) => setTay(e.target.value)} placeholder="7 7 8 7 7 9"
              aria-label="Sáu hào tự gieo" /></label>
        )}
        <button type="submit" className="btn-primary" disabled={dang}>{dang ? "Đang gieo…" : "Hỏi quẻ"}</button>
      </form>

      {nhac && <p className="qa-note">{nhac}</p>}
      {res?.error && <p className="notice-error">{res.error}</p>}
      {res?.cau_tra_loi && (
        <div className="result" data-testid="kd-ket-qua">
          {res.que && (
            <div className="kd-hai-que">
              <VeQue q={res.que.quai_ban} dong={res.que.hao_dong} />
              {res.que.quai_bien && <VeQue q={res.que.quai_bien} dong={[]} />}
            </div>
          )}
          {res.phan_loai?.truong_phai && (
            <p className="src">Phái đọc: {PHAI[res.phan_loai.truong_phai] ?? res.phan_loai.truong_phai}
              {res.que?.nguon_ngau_nhien ? ` · nguồn quẻ: ${res.que.nguon_ngau_nhien}` : ""}</p>
          )}
          <div className="qa-answer">
            {res.cau_tra_loi.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {res.co_canh_bao?.filter((c) => c.loai !== "khong_gieo_lai").map((c) => (
            <p key={c.loai} className="sensitivity">ⓘ {c.chi_tiet}</p>
          ))}
        </div>
      )}
    </section>
  );
}
