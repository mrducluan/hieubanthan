"use client";
// ND — cầu nối CMS ↔ Kho tri thức (mục 8.2): xem trước CHỈ ĐỌC chữ kiến thức engine đang trả cho trang (mẫu cụm: một
// trang mẫu của cụm; ghi đè: chính URL đó) + nút mở /quan-tri/tri-thuc/<tệp> để sửa ở git (PR). CMS không lưu chữ KB.
import { useAllFormFields } from "@payloadcms/ui";
import { useEffect, useState } from "react";

type Xem = { duong?: string; tieu_de?: string | null; doan?: { nhan: string; chu: string }[]; tep?: { ten: string; url: string }[]; loi?: string };

/** Mẫu "/tu-vi/sao-o-cung/{slug}" + trang mẫu "tu-vi-cung-menh" → "/tu-vi/sao-o-cung/tu-vi-cung-menh". */
const duongMau = (mau: string, viDu: string) => `${mau.split("/").slice(0, -1).join("/")}/${viDu}`;

export function XemTruocKb() {
  const [fields] = useAllFormFields();
  const v = (k: string) => fields[k]?.value;
  const mau = v("mau_duong") as string | undefined;
  const nguon = v("nguon_kb") as { vi_du?: string } | undefined;
  const duong = mau ? (nguon?.vi_du ? duongMau(mau, nguon.vi_du) : "") : String(v("duong") ?? "");
  const [xem, setXem] = useState<Xem | null>(null);
  const [mo, setMo] = useState(false);

  useEffect(() => {
    if (!duong) return;
    let huy = false;
    setXem(null);
    fetch(`/api/mau-cum/xem-kb?duong=${encodeURIComponent(duong)}`, { credentials: "include" })
      .then((r) => r.json()).catch(() => ({ loi: "Không kết nối được CMS." }))
      .then((d: Xem) => { if (!huy) setXem(d); });
    return () => { huy = true; };
  }, [duong]);

  if (!duong) return null;
  return (
    <div style={{ margin: "8px 0 24px", border: "1px solid var(--theme-elevation-150)", borderRadius: 8, padding: 12 }} data-testid="xem-truoc-kb">
      <p style={{ margin: 0, fontWeight: 600 }}>Nội dung kho tri thức{mau ? " (trang mẫu của cụm)" : ""} — chỉ đọc</p>
      <p style={{ margin: "4px 0 8px", fontSize: 12, opacity: 0.75 }}>
        <code>{duong}</code> · Chữ này do kho tri thức (git) dựng. Muốn sửa: mở tệp bên dưới ở trang quản trị → tạo PR. Ở đây chỉ đặt khối quanh nội dung.
      </p>
      {xem?.tep?.length ? (
        <p style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 8px" }}>
          {xem.tep.map((t) => (
            <a key={t.ten} href={t.url} target="_blank" rel="noopener noreferrer" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }}>
              Sửa nội dung này trong Kho tri thức · {t.ten}
            </a>
          ))}
        </p>
      ) : null}
      {!xem && <p style={{ fontSize: 12, opacity: 0.7 }}>Đang tải…</p>}
      {xem?.loi && <p role="alert" style={{ fontSize: 12 }}>{xem.loi}</p>}
      {xem?.doan?.length ? (
        <details open={mo} onToggle={(e) => setMo((e.target as HTMLDetailsElement).open)}>
          <summary style={{ cursor: "pointer", fontSize: 13 }}>{xem.tieu_de || "Xem chữ"} · {xem.doan.length} đoạn</summary>
          <dl style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.45, maxHeight: 420, overflow: "auto" }}>
            {xem.doan.map((d, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <dt style={{ fontWeight: 600, opacity: 0.8 }}>{d.nhan}</dt>
                <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{d.chu}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </div>
  );
}
