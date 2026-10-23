"use client";
// ND-7 — tab "Chữ trên trang": mỗi đoạn chữ cố định của URL (nhãn, tiêu đề mục, chip, bảng so sánh…) là một dòng: chữ
// gốc trong code (chỉ đọc, từ sổ trang của web — mac_dinh.chu) + ô gõ chữ thay. Lưu vào ô json `chu` = { khoá: chữ }.
// Để trống = web dùng chữ gốc. `*đoạn*` = đoạn nhấn; `{bien}` = giá trị web điền (giữ nguyên dấu ngoặc nhọn).
import { useField, useFormFields } from "@payloadcms/ui";
import { useMemo, useState } from "react";

type MucChu = { nhan?: string; mac_dinh?: string; toi_da?: number; nhom?: string; lua_chon?: { gia_tri: string; nhan: string }[] };

const khung: React.CSSProperties = { border: "1px solid var(--theme-elevation-150)", borderRadius: 8, padding: 12, marginBottom: 12 };

export function ChuTrenTrang({ path }: { path: string }) {
  const { value, setValue } = useField<Record<string, string> | null>({ path });
  const macDinh = useFormFields(([f]) => f.mac_dinh?.value) as { chu?: Record<string, MucChu> } | null | undefined;
  const bang = macDinh?.chu ?? {};
  const [loc, setLoc] = useState("");
  const giaTri = value && typeof value === "object" ? value : {};

  const nhom = useMemo(() => {
    const m = new Map<string, [string, MucChu][]>();
    for (const [k, v] of Object.entries(bang)) {
      const q = loc.trim().toLowerCase();
      if (q && ![k, v.nhan, v.mac_dinh, giaTri[k]].some((x) => String(x ?? "").toLowerCase().includes(q))) continue;
      const n = v.nhom || "Khác";
      m.set(n, [...(m.get(n) ?? []), [k, v]]);
    }
    return [...m.entries()];
  }, [bang, loc, giaTri]);

  const dat = (k: string, s: string) => {
    const moi = { ...giaTri };
    if (s.trim()) moi[k] = s; else delete moi[k];
    setValue(Object.keys(moi).length ? moi : null);
  };

  const soKhoa = Object.keys(bang).length;
  if (!soKhoa) {
    return <p style={{ opacity: 0.7, fontSize: 13 }} data-testid="chu-tren-trang-trong">Trang này chưa có chữ cố định nào khai trong sổ trang (hoặc chưa đồng bộ — bấm "Đồng bộ ngay" ở danh sách).</p>;
  }
  const daSua = Object.keys(giaTri).filter((k) => bang[k]).length;
  return (
    <div data-testid="chu-tren-trang">
      <p style={{ margin: "0 0 8px", fontSize: 13, opacity: 0.8 }}>
        {soKhoa} đoạn chữ · đã sửa {daSua}. Để trống = giữ chữ gốc. <code>*chữ*</code> = đoạn nhấn (màu/đậm theo chỗ đặt),{" "}
        <code>{"{ten}"}</code> = giá trị web tự điền — giữ nguyên dấu ngoặc nhọn. Chỉ chữ thuần, không HTML.
      </p>
      <input type="search" placeholder="Tìm đoạn chữ…" value={loc} onChange={(e) => setLoc(e.target.value)}
        style={{ width: "100%", maxWidth: 360, marginBottom: 12, padding: "6px 10px" }} aria-label="Tìm đoạn chữ" />
      {nhom.map(([ten, ds]) => (
        <details key={ten} open style={khung}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>{ten} · {ds.length}</summary>
          {ds.map(([k, m]) => {
            if (m.lua_chon) {
              const hien = giaTri[k] ?? m.mac_dinh ?? "";
              return (
                <div key={k} style={{ marginTop: 12 }} data-khoa={k}>
                  <label htmlFor={`chu-${k}`} style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{m.nhan || k}</label>
                  <select id={`chu-${k}`} value={hien} onChange={(e) => dat(k, e.target.value === m.mac_dinh ? "" : e.target.value)}
                    style={{ marginTop: 4, padding: "6px 10px", minWidth: 220 }}>
                    {m.lua_chon.map((o) => <option key={o.gia_tri} value={o.gia_tri}>{o.nhan}{o.gia_tri === m.mac_dinh ? " (mặc định)" : ""}</option>)}
                  </select>
                  <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}><code>{k}</code></div>
                </div>
              );
            }
            const v = giaTri[k] ?? "", toiDa = m.toi_da ?? 300, dai = (m.mac_dinh ?? "").length > 70 || toiDa > 120;
            const Nhap = dai ? "textarea" : "input";
            return (
              <div key={k} style={{ marginTop: 12 }} data-khoa={k}>
                <label htmlFor={`chu-${k}`} style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{m.nhan || k}</label>
                <p style={{ margin: "2px 0 4px", fontSize: 12, opacity: 0.7 }}>Gốc: {m.mac_dinh}</p>
                <Nhap id={`chu-${k}`} value={v} maxLength={toiDa} placeholder={m.mac_dinh} rows={dai ? 3 : undefined}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => dat(k, e.target.value)}
                  style={{ width: "100%", padding: "6px 10px", fontFamily: "inherit" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.65 }}>
                  <code>{k}</code>
                  <span>
                    {v ? <button type="button" onClick={() => dat(k, "")} style={{ marginRight: 8, fontSize: 11 }}>Về chữ gốc</button> : null}
                    {v.length}/{toiDa}
                  </span>
                </div>
              </div>
            );
          })}
        </details>
      ))}
    </div>
  );
}
