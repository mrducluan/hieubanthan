"use client";
// Đầu danh sách "Thư viện ảnh": cho biết ảnh đang lưu ở đâu (Supabase Storage / Cloudflare R2 / ổ đĩa máy) và nút "Kiểm tra kho ảnh" —
// tải thử một ảnh 16×16 qua đúng đường đi của Payload rồi xoá, hiện từng bước đạt / hỏng + việc cần làm (tiếng Việt).
// Sự cố 2026-10-24: tải ảnh báo "There was a problem while uploading the file." mà không rõ vì sao.
import { useEffect, useState } from "react";

type Kho = { nguon?: "s3" | "dia"; ten?: string; vercel?: boolean; thieu?: string[]; loi?: string };
type Kq = { ok: boolean; nguon: "s3" | "dia"; vercel: boolean; thieu: string[]; buoc: { ten: string; ok: boolean; chi_tiet?: string }[]; goi_y: string[]; url?: string; loi?: string };

export function KiemKhoAnh() {
  const [kho, setKho] = useState<Kho | null>(null);
  const [kq, setKq] = useState<Kq | null>(null);
  const [dang, setDang] = useState(false);

  useEffect(() => {
    void fetch("/api/media/kho", { credentials: "include" }).then(async (r) => (r.status === 403 ? { loi: "403" } : ((await r.json()) as Kho)))
      .catch(() => ({ loi: "Không kết nối được CMS." })).then(setKho);
  }, []);
  if (kho?.loi === "403") return null;   // biên tập viên / cộng tác viên không cần thấy

  async function kiem() {
    setDang(true); setKq(null);
    const r = await fetch("/api/media/kiem-kho", { credentials: "include" }).catch(() => null);
    const d = ((await r?.json().catch(() => null)) ?? { ok: false, nguon: "dia", vercel: false, thieu: [], buoc: [], goi_y: [], loi: "Không kết nối được CMS." }) as Kq;
    setKq(d); setDang(false);
  }

  const canhBao = kho?.nguon === "dia" && kho.vercel;
  return (
    <div style={{ margin: "0 0 16px", border: `1px solid ${canhBao ? "var(--theme-error-400)" : "var(--theme-elevation-150)"}`, borderRadius: 6, padding: "10px 14px", fontSize: 13 }}
      data-testid="kiem-kho-anh">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <span>
          Kho ảnh: {!kho ? "đang đọc…" : kho.loi ? kho.loi : kho.nguon === "s3" ? <b>{kho.ten ?? "S3"}</b> : <b>ổ đĩa máy</b>}
          {kho?.thieu?.length ? <span style={{ opacity: 0.75 }}> · thiếu biến {kho.thieu.join(", ")}</span> : null}
        </span>
        <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} disabled={dang} onClick={() => void kiem()} data-testid="nut-kiem-kho">
          {dang ? "Đang tải thử…" : "Kiểm tra kho ảnh"}
        </button>
        <span style={{ opacity: 0.65 }}>Tải thử một ảnh 16×16 rồi tự xoá — xem lỗi gốc khi tải ảnh hỏng.</span>
      </div>
      {canhBao && <p role="alert" style={{ margin: "8px 0 0" }}>CMS đang chạy trên Vercel nhưng chưa nối kho ảnh → tải ảnh sẽ lỗi. Đặt 5 biến S3_* (mục CMS1, docs/VIEC-CUA-ANH.md) rồi Redeploy.</p>}
      {kq && (
        <div style={{ marginTop: 10 }} data-testid="kq-kiem-kho" data-ok={kq.ok ? "1" : "0"}>
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>{kq.loi ? kq.loi : kq.ok ? "✓ Kho ảnh hoạt động bình thường." : "✕ Kho ảnh đang lỗi — xem bước hỏng và việc cần làm bên dưới."}</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kq.buoc.map((b) => (
              <li key={b.ten} style={{ margin: "2px 0" }}>{b.ok ? "✓" : "✕"} {b.ten}{b.chi_tiet ? <span style={{ opacity: 0.7 }}> — {b.chi_tiet}</span> : null}</li>
            ))}
          </ul>
          {kq.goi_y.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <b>Việc cần làm:</b>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{kq.goi_y.map((g) => <li key={g}>{g}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
