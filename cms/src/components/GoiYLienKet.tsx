"use client";
// CMS-4 — "Gợi ý liên kết nội bộ" ở cột phải: lấy tiêu đề, từ khoá, thẻ, thân bài đang soạn → bài CMS + trang kiến thức
// của web gần nghĩa nhất. Người viết chép đường dẫn, bôi đen chữ trong bài → nút Link → dán. Không tự chèn vào bài.
import { useAllFormFields, useDocumentInfo } from "@payloadcms/ui";
import { useState } from "react";

type Muc = { tieu_de: string; url: string; loai: "bai" | "trang"; diem: number };

export function GoiYLienKet() {
  const [fields] = useAllFormFields();
  const { id } = useDocumentInfo();
  const [ds, setDs] = useState<Muc[] | null>(null);
  const [dang, setDang] = useState(false);
  const [chep, setChep] = useState<string | null>(null);
  const v = (k: string) => fields[k]?.value;

  async function tim() {
    setDang(true);
    const the = Object.keys(fields).filter((k) => /^the\.\d+$/.test(k)).map((k) => fields[k]?.value);
    const r = await fetch("/api/bai-viet/goi-y-lien-ket", {
      method: "POST", credentials: "include", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, tieu_de: v("tieu_de"), tu_khoa_chinh: v("tu_khoa_chinh"), tu_khoa_phu: v("tu_khoa_phu"),
        the: Array.isArray(v("the")) ? v("the") : the, mo_ta_ngan: v("mo_ta_ngan"), tra_loi_nhanh: v("tra_loi_nhanh"), noi_dung: v("noi_dung") }),
    }).catch(() => null);
    const d = (await r?.json().catch(() => null)) as { ds?: Muc[] } | null;
    setDs(d?.ds ?? []); setDang(false);
  }

  return (
    <details open style={{ marginBottom: 24, border: "1px solid var(--theme-elevation-150)", borderRadius: 8, padding: 12 }} data-testid="goi-y-lien-ket">
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>Gợi ý liên kết nội bộ</summary>
      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn--style-secondary btn--size-small" disabled={dang} onClick={() => void tim()}>
          {dang ? "Đang tìm…" : "Tìm trang liên quan"}
        </button>
        {ds && ds.length === 0 && <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>Chưa thấy trang gần nghĩa — thêm từ khoá chính, thẻ, tiêu đề mục rồi thử lại.</p>}
        {ds && ds.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            {ds.map((m) => (
              <li key={m.url} style={{ fontSize: 13, lineHeight: 1.35 }}>
                <span style={{ opacity: 0.6 }}>{m.loai === "bai" ? "Bài" : "Trang"} · </span>{m.tieu_de}
                <br />
                <button type="button" style={{ fontSize: 12, padding: 0, background: "none", border: 0, color: "var(--theme-success-500)", cursor: "pointer" }}
                  onClick={() => void navigator.clipboard.writeText(m.url).then(() => setChep(m.url))}>
                  {chep === m.url ? "✓ đã chép" : m.url}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p style={{ fontSize: 11, opacity: 0.7, margin: 0 }}>Bôi đen chữ trong bài → nút liên kết → dán đường dẫn. 2–5 liên kết nội bộ mỗi bài là đủ.</p>
      </div>
    </details>
  );
}
