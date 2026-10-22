"use client";
// ND-7 đợt 2 — tab "Hình trên trang": mỗi chỗ đặt hình của URL (mac_dinh.hinh, từ sổ trang của web) là một dòng — hình gốc
// trong code (mô tả) + ảnh đang dùng + "Chọn từ thư viện" / "Tải ảnh mới" / "Về hình gốc". Lưu ô json `hinh` = { khoá: id ảnh };
// máy chủ chụp lại url/alt/cỡ của ảnh khi lưu (hook locHinh). Ảnh tải mới vào Thư viện ảnh (bắt buộc mô tả ảnh).
import { useField, useFormFields } from "@payloadcms/ui";
import { useEffect, useState } from "react";

type MucHinh = { nhan?: string; mac_dinh?: string; goi_y?: string; nhom?: string };
type Anh = { id: number | string; url?: string; alt?: string; sizes?: Record<string, { url?: string | null } | undefined>; filename?: string };

const khung: React.CSSProperties = { border: "1px solid var(--theme-elevation-150)", borderRadius: 8, padding: 12, marginBottom: 12 };
const nho = (a: Anh | null | undefined) => a?.sizes?.nho?.url || a?.url || "";

function ThuVien({ chon, dong }: { chon: (a: Anh) => void; dong: () => void }) {
  const [ds, setDs] = useState<Anh[] | null>(null);
  const [tim, setTim] = useState("");
  useEffect(() => {
    let huy = false;
    const q = tim.trim() ? `&where[alt][like]=${encodeURIComponent(tim.trim())}` : "";
    fetch(`/api/media?limit=24&sort=-createdAt&depth=0${q}`, { credentials: "include" })
      .then((r) => r.json()).then((d: { docs?: Anh[] }) => { if (!huy) setDs(d.docs ?? []); }).catch(() => { if (!huy) setDs([]); });
    return () => { huy = true; };
  }, [tim]);
  return (
    <div style={{ ...khung, marginTop: 8 }} data-testid="thu-vien-anh">
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input type="search" placeholder="Tìm theo mô tả ảnh…" value={tim} onChange={(e) => setTim(e.target.value)} style={{ flex: 1, padding: "4px 8px" }} />
        <button type="button" onClick={dong}>Đóng</button>
      </div>
      {!ds && <p style={{ fontSize: 12 }}>Đang tải…</p>}
      {ds && !ds.length && <p style={{ fontSize: 12 }}>Chưa có ảnh nào — dùng "Tải ảnh mới".</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
        {ds?.map((a) => (
          <button key={a.id} type="button" onClick={() => chon(a)} title={a.alt} style={{ padding: 0, border: "1px solid var(--theme-elevation-150)", background: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nho(a)} alt={a.alt ?? ""} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function TaiMoi({ xong }: { xong: (a: Anh) => void }) {
  const [tep, setTep] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [loi, setLoi] = useState("");
  const [dang, setDang] = useState(false);
  const gui = async () => {
    if (!tep || alt.trim().length < 3) { setLoi("Chọn ảnh và ghi mô tả ảnh (ít nhất 3 ký tự)."); return; }
    setDang(true); setLoi("");
    const f = new FormData();
    f.append("file", tep);
    f.append("_payload", JSON.stringify({ alt: alt.trim(), nguon_anh: "Hiểu Bản Thân" }));
    try {
      const r = await fetch("/api/media", { method: "POST", body: f, credentials: "include" });
      const d = await r.json() as { doc?: Anh; errors?: { message: string }[] };
      if (!r.ok || !d.doc) throw new Error(d.errors?.[0]?.message || `Lỗi ${r.status}`);
      xong(d.doc);
    } catch (e) { setLoi((e as Error).message); } finally { setDang(false); }
  };
  return (
    <div style={{ ...khung, marginTop: 8, display: "grid", gap: 6 }} data-testid="tai-anh-moi">
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => setTep(e.target.files?.[0] ?? null)} aria-label="Chọn tệp ảnh" />
      <input type="text" placeholder="Mô tả ảnh (alt) — bắt buộc" value={alt} maxLength={160} onChange={(e) => setAlt(e.target.value)} style={{ padding: "4px 8px" }} aria-label="Mô tả ảnh" />
      <button type="button" onClick={gui} disabled={dang}>{dang ? "Đang tải…" : "Tải lên và dùng ảnh này"}</button>
      {loi && <p role="alert" style={{ fontSize: 12, color: "var(--theme-error-500)" }}>{loi}</p>}
    </div>
  );
}

export function HinhTrenTrang({ path }: { path: string }) {
  const { value, setValue } = useField<Record<string, unknown> | null>({ path });
  const macDinh = useFormFields(([f]) => f.mac_dinh?.value) as { hinh?: Record<string, MucHinh> } | null | undefined;
  const bang = macDinh?.hinh ?? {};
  const giaTri = value && typeof value === "object" ? value : {};
  const [mo, setMo] = useState<{ khoa: string; kieu: "thu_vien" | "tai" } | null>(null);
  // Ảnh vừa chọn trong phiên (để hiện ngay, trước khi máy chủ chụp lại lúc lưu).
  const [vuaChon, setVuaChon] = useState<Record<string, Anh>>({});

  const dat = (k: string, a: Anh | null) => {
    const moi: Record<string, unknown> = { ...giaTri };
    if (a) moi[k] = a.id; else delete moi[k];
    setVuaChon((x) => { const y = { ...x }; if (a) y[k] = a; else delete y[k]; return y; });
    setValue(Object.keys(moi).length ? moi : null);
    setMo(null);
  };

  const ds = Object.entries(bang);
  if (!ds.length) return <p style={{ opacity: 0.7, fontSize: 13 }}>Trang này không có chỗ đặt hình nào khai trong sổ trang.</p>;
  return (
    <div data-testid="hinh-tren-trang">
      <p style={{ margin: "0 0 8px", fontSize: 13, opacity: 0.8 }}>
        Chọn ảnh từ Thư viện ảnh hoặc tải ảnh mới cho từng chỗ. Bỏ chọn = hình gốc (vẽ bằng code, có chuyển động). Ảnh cần có mô tả (alt).
      </p>
      {ds.map(([k, m]) => {
        const v = giaTri[k];
        const anh: Anh | null = vuaChon[k] ?? (v && typeof v === "object" ? (v as Anh) : null);
        const coAnh = v !== undefined && v !== null;
        return (
          <div key={k} style={khung} data-khoa={k}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{m.nhan || k}</p>
            <p style={{ margin: "2px 0 6px", fontSize: 12, opacity: 0.7 }}>Gốc: {m.mac_dinh} · Gợi ý: {m.goi_y}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {coAnh && anh && nho(anh)
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={nho(anh)} alt={anh.alt ?? ""} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 6 }} />
                : <span style={{ fontSize: 12, opacity: 0.7 }}>{coAnh ? `Ảnh #${String(v)} (lưu để xem trước)` : "Đang dùng hình gốc"}</span>}
              <button type="button" onClick={() => setMo({ khoa: k, kieu: "thu_vien" })}>Chọn từ thư viện</button>
              <button type="button" onClick={() => setMo({ khoa: k, kieu: "tai" })}>Tải ảnh mới</button>
              {coAnh && <button type="button" onClick={() => dat(k, null)}>Về hình gốc</button>}
            </div>
            {mo?.khoa === k && mo.kieu === "thu_vien" && <ThuVien chon={(a) => dat(k, a)} dong={() => setMo(null)} />}
            {mo?.khoa === k && mo.kieu === "tai" && <TaiMoi xong={(a) => dat(k, a)} />}
            <code style={{ fontSize: 11, opacity: 0.6 }}>{k}</code>
          </div>
        );
      })}
    </div>
  );
}
