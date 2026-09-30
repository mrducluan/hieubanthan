"use client";

import { useState } from "react";

interface Res {
  cau_tra_loi?: string;
  phan_loai?: { loai: string; chu_de: string | null };
  can_them?: string[];
  co_canh_bao?: { loai: string; chi_tiet: string }[];
  error?: string;
}

export function PhongThuy() {
  const [cau, setCau] = useState("");
  const [ngay, setNgay] = useState("");
  const [gioiTinh, setGioiTinh] = useState("nam");
  const [dang, setDang] = useState(false);
  const [res, setRes] = useState<Res | null>(null);

  async function hoi(e: React.FormEvent) {
    e.preventDefault();
    if (cau.trim().length < 3 || dang) return;
    setDang(true);
    try {
      const sinh = ngay ? { birth_date: ngay, gender: gioiTinh } : undefined;
      const r = await fetch("/api/phongthuy/hoi", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ cau_hoi: cau, ...(sinh ? { sinh } : {}) }),
      });
      setRes((await r.json()) as Res);
    } catch { setRes({ error: "Không kết nối được. Thử lại sau." }); }
    finally { setDang(false); }
  }

  return (
    <section>
      <form className="reading-form" onSubmit={hoi}>
        <label className="field"><span>Câu hỏi</span>
          <input value={cau} onChange={(e) => setCau(e.target.value)} maxLength={500}
            placeholder="Nhà hướng Nam có hợp với tôi không?" aria-label="Câu hỏi Phong thuỷ" /></label>
        <div className="field-row">
          <label className="field"><span>Ngày sinh (dương lịch)</span>
            <input type="date" value={ngay} onChange={(e) => setNgay(e.target.value)} aria-label="Ngày sinh" /></label>
          <label className="field"><span>Giới tính</span>
            <select value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value)} aria-label="Giới tính">
              <option value="nam">Nam</option><option value="nu">Nữ</option>
            </select></label>
        </div>
        <p className="qa-note">Câu hỏi chung (ví dụ “Gương đối diện giường có sao không?”) không cần ngày sinh. Hướng hợp tuổi cần ngày sinh và giới tính.</p>
        <button type="submit" className="btn-primary" disabled={dang}>{dang ? "Đang xem…" : "Hỏi"}</button>
      </form>

      {res?.error && <p className="notice-error">{res.error}</p>}
      {res?.cau_tra_loi && (
        <div className="result" data-testid="pt-ket-qua">
          <div className="qa-answer">
            {res.cau_tra_loi.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {res.co_canh_bao?.map((c) => <p key={c.loai} className="sensitivity">ⓘ {c.chi_tiet}</p>)}
        </div>
      )}
    </section>
  );
}
