"use client";
// ND-1 — "Sửa nội dung các trang trong chân trang": mọi link đang có ở các cột → mở thẳng tài liệu "Trang website" của
// URL đó (link tới bài / chuyên mục → mở bài / chuyên mục). Neo (#nguon) bỏ khi tìm trang.
import { useAllFormFields } from "@payloadcms/ui";
import { useEffect, useMemo, useState } from "react";

type Link = { nhan: string; loai: string; duong?: string; id?: string | number };

export function LoiTatChanTrang() {
  const [fields] = useAllFormFields();
  const ds = useMemo(() => {
    const ra: Record<string, Link> = {};
    for (const [k, f] of Object.entries(fields)) {
      const m = /^cot\.(\d+)\.lien_ket\.(\d+)\.(nhan|loai|duong_dan|bai|chuyen_muc)$/.exec(k);
      if (!m) continue;
      const khoa = `${m[1]!.padStart(2, "0")}.${m[2]!.padStart(2, "0")}`;
      const l = (ra[khoa] ??= { nhan: "", loai: "duong_dan" });
      const v = f?.value;
      if (m[3] === "nhan") l.nhan = String(v ?? "");
      else if (m[3] === "loai") l.loai = String(v ?? "duong_dan");
      else if (m[3] === "duong_dan") l.duong = typeof v === "string" ? v.split("#")[0] : undefined;
      else if (v != null && v !== "") l.id = typeof v === "object" ? (v as { id?: string | number; value?: string | number }).id ?? (v as { value?: string | number }).value : (v as string | number);
    }
    return Object.keys(ra).sort().map((k) => ra[k]!).filter((l) => l.nhan);
  }, [fields]);
  const [taiLieu, setTaiLieu] = useState<Record<string, string | number>>({});
  const duongs = useMemo(() => [...new Set(ds.filter((l) => l.loai === "duong_dan" && l.duong).map((l) => l.duong!))], [ds]);

  useEffect(() => {
    if (!duongs.length) return;
    const q = duongs.map((d, i) => `where[duong][in][${i}]=${encodeURIComponent(d)}`).join("&");
    fetch(`/api/noi-dung-trang?${q}&limit=100&depth=0&draft=true&select[duong]=true`, { credentials: "include" })
      .then((r) => r.json()).catch(() => ({ docs: [] }))
      .then((d: { docs?: { id: string | number; duong: string }[] }) =>
        setTaiLieu(Object.fromEntries((d.docs ?? []).map((x) => [x.duong, x.id]))));
  }, [duongs]);

  const href = (l: Link) => l.loai === "bai" && l.id ? `/admin/collections/bai-viet/${l.id}`
    : l.loai === "chuyen_muc" && l.id ? `/admin/collections/chuyen-muc/${l.id}`
    : l.duong && taiLieu[l.duong] != null ? `/admin/collections/noi-dung-trang/${taiLieu[l.duong]}` : null;

  return (
    <details style={{ margin: "8px 0 24px", border: "1px solid var(--theme-elevation-150)", borderRadius: 8, padding: 12 }} data-testid="loi-tat-chan-trang">
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>Sửa nội dung các trang trong chân trang</summary>
      <p style={{ fontSize: 12, opacity: 0.75, margin: "6px 0 8px" }}>
        Ở đây chỉ đổi chữ của link. Nội dung của từng trang (tiêu đề SEO, lời dẫn, khối…) sửa ở mục &quot;Trang website&quot;.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4, fontSize: 13 }}>
        {ds.map((l, i) => {
          const h = href(l);
          return (
            <li key={i}>
              {l.nhan}{" "}
              {h ? <a href={h}>→ sửa {l.loai === "bai" ? "bài viết" : l.loai === "chuyen_muc" ? "chuyên mục" : <code>{l.duong}</code>}</a>
                : <span style={{ opacity: 0.6 }}>({l.duong ? `${l.duong} chưa có trong "Trang website" — bấm Đồng bộ ngay` : "chưa chọn"})</span>}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
