"use client";
// CMS-2 — "Trợ lý AI" ở cột phải trình viết bài: dán MỘT đoạn → chọn việc (viết lại / sâu hơn / rút gọn / soát lỗi /
// lời đời thường) → nhận NHÁP kèm cảnh báo kiểm định (giọng phán, vùng cấm, số lạ…). Người viết tự đọc, sửa, dán vào bài.
// AI không ghi thẳng vào bài và không xuất bản.
import { useFormFields } from "@payloadcms/ui";
import { useState } from "react";
import { HANH_DONG, type HanhDong, type KetQuaSoan } from "../lib/soan-nhap";

const O: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 6, border: "1px solid var(--theme-elevation-150)",
  background: "var(--theme-input-bg)", color: "var(--theme-text)", padding: 8, fontSize: 13, fontFamily: "inherit", lineHeight: 1.5 };

export function TroLyAI() {
  const tieuDe = useFormFields(([f]) => f.tieu_de?.value as string | undefined);
  const mang = useFormFields(([f]) => f.mang?.value as string | undefined);
  const [van, setVan] = useState("");
  const [hd, setHd] = useState<HanhDong>("viet_lai");
  const [yc, setYc] = useState("");
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState<KetQuaSoan | null>(null);
  const [daChep, setDaChep] = useState(false);

  async function soan() {
    setDang(true); setKq(null); setDaChep(false);
    try {
      const r = await fetch("/api/bai-viet/soan-nhap", {
        method: "POST", credentials: "include", headers: { "content-type": "application/json" },
        body: JSON.stringify({ van, hanh_dong: hd, yeu_cau: yc, tieu_de: tieuDe ?? "", mang: mang ?? "" }),
      });
      const d = (await r.json().catch(() => ({}))) as KetQuaSoan;
      setKq(r.ok ? d : { nhap: null, kiem_dinh: [], loi: d.loi ?? `Lỗi ${r.status}` });
    } catch { setKq({ nhap: null, kiem_dinh: [], loi: "Không gửi được, thử lại." }); }
    finally { setDang(false); }
  }

  return (
    <details open style={{ marginBottom: 24, border: "1px solid var(--theme-elevation-150)", borderRadius: 8, padding: 12 }} data-testid="tro-ly-ai">
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>Trợ lý AI soạn nháp đoạn văn</summary>
      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        <textarea aria-label="Đoạn cần sửa" rows={5} value={van} onChange={(e) => setVan(e.target.value)} placeholder="Dán một đoạn trong bài…" style={O} />
        <select aria-label="Việc cần làm" value={hd} onChange={(e) => setHd(e.target.value as HanhDong)} style={O}>
          {(Object.keys(HANH_DONG) as HanhDong[]).map((k) => <option key={k} value={k}>{HANH_DONG[k]}</option>)}
        </select>
        <input aria-label="Ghi chú cho AI" value={yc} onChange={(e) => setYc(e.target.value)} maxLength={300} placeholder="Ghi chú thêm (tuỳ chọn)" style={O} />
        <button type="button" className="btn btn--style-secondary btn--size-small" disabled={dang || van.trim().length < 10} onClick={() => void soan()}>
          {dang ? "Đang soạn…" : "Soạn nháp"}
        </button>
        {kq?.loi && <p role="alert" style={{ color: "#d9534f", fontSize: 13, margin: 0 }}>{kq.loi}</p>}
        {kq?.nhap && (
          <div style={{ display: "grid", gap: 6 }}>
            <textarea aria-label="Nháp của AI" rows={8} readOnly value={kq.nhap} style={O} data-testid="nhap-ai" />
            {kq.kiem_dinh.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#d9a23a" }}>
                {kq.kiem_dinh.map((m, i) => <li key={i}>{m.noi_dung}</li>)}
              </ul>
            )}
            <button type="button" className="btn btn--style-primary btn--size-small"
              onClick={() => void navigator.clipboard.writeText(kq.nhap!).then(() => setDaChep(true))}>
              {daChep ? "Đã chép — dán vào bài" : "Chép nháp"}
            </button>
            <p style={{ fontSize: 11, opacity: 0.7, margin: 0 }}>Nháp do AI soạn: đọc kỹ, sửa theo giọng của bạn. Kiểm định của bài vẫn chạy khi lưu.</p>
          </div>
        )}
      </div>
    </details>
  );
}
