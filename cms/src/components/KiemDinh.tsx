"use client";
// Khung "Kiểm định" ở cột phải trình soạn bài: chấm SEO · AI SEO/GEO · E-E-A-T · ranh giới nội dung NGAY khi gõ.
// Cùng một hàm kiemDinhBai với máy chủ (máy chủ chặn xuất bản nếu còn lỗi chặn).
import { useAllFormFields, useDocumentInfo } from "@payloadcms/ui";
import { useMemo, useState } from "react";
import { kiemDinhBai, TEN_NHOM, type BaiKiem, type MucKiem, type Nhom } from "../kiem-dinh/kiem-dinh";

const MAU = { dat: "#3fa66b", canh_bao: "#d9a23a", loi: "#d9534f" } as const;
const KY = { dat: "✓", canh_bao: "!", loi: "✕" } as const;

/** Form Payload lưu phẳng ("hoi_dap.0.cau_hoi", và "hoi_dap" = số dòng) → dựng lại object lồng nhau cho kiemDinhBai. */
function giaTriForm(fields: Record<string, { value?: unknown }>): BaiKiem {
  const goc: Record<string, unknown> = {};
  const duong = Object.keys(fields).sort((a, b) => a.split(".").length - b.split(".").length);
  for (const p of duong) {
    const phan = p.split(".");
    let o: Record<string, unknown> | unknown[] = goc;
    for (let i = 0; i < phan.length - 1; i++) {
      const k = phan[i]!, sau = phan[i + 1]!;
      const cur = (o as Record<string, unknown>)[k];
      if (!cur || typeof cur !== "object") (o as Record<string, unknown>)[k] = /^\d+$/.test(sau) ? [] : {};
      o = (o as Record<string, unknown>)[k] as Record<string, unknown>;
    }
    const cuoi = phan[phan.length - 1]!;
    const v = fields[p]?.value;
    const daCo = (o as Record<string, unknown>)[cuoi];
    if (!(daCo && typeof daCo === "object" && typeof v !== "object")) (o as Record<string, unknown>)[cuoi] = v;
  }
  return goc as BaiKiem;
}

function mauDiem(d: number) {
  return d >= 80 ? MAU.dat : d >= 55 ? MAU.canh_bao : MAU.loi;
}

export function KiemDinh() {
  const [fields] = useAllFormFields();
  const [mo, setMo] = useState<Record<string, boolean>>({});
  const [hienDat, setHienDat] = useState(false);
  const { id } = useDocumentInfo();
  const [trung, setTrung] = useState<{ dang: boolean; muc: MucKiem[] | null; loi?: string }>({ dang: false, muc: null });
  // CG-6: so với bài khác + kho tri thức chạy ở máy chủ (cần dữ liệu các bài khác) → bấm mới chạy, không chạy mỗi lần gõ.
  // Máy chủ cũng tự kiểm khi Gửi duyệt / Xuất bản.
  const kiemTrung = async () => {
    setTrung({ dang: true, muc: null });
    try {
      const b = giaTriForm(fields) as BaiKiem & { tra_loi_nhanh?: unknown; noi_dung?: unknown; hoi_dap?: unknown };
      const r = await fetch("/api/bai-viet/kiem-trung", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id ?? null, tra_loi_nhanh: b.tra_loi_nhanh, noi_dung: b.noi_dung, hoi_dap: b.hoi_dap }),
      });
      const j = (await r.json()) as { muc?: MucKiem[]; loi?: string };
      setTrung({ dang: false, muc: j.muc ?? [], loi: r.ok ? undefined : (j.loi ?? "Không kiểm được") });
    } catch {
      setTrung({ dang: false, muc: null, loi: "Không kết nối được máy chủ" });
    }
  };
  const kq = useMemo(() => kiemDinhBai(giaTriForm(fields)), [fields]);
  const theoNhom = useMemo(() => {
    const m = new Map<Nhom, MucKiem[]>();
    for (const x of kq.muc) m.set(x.nhom, [...(m.get(x.nhom) ?? []), x]);
    return m;
  }, [kq]);

  return (
    <section className="hbt-kd" data-testid="kiem-dinh" aria-label="Kiểm định bài viết">
      <div className="hbt-kd-dau">
        <div className="hbt-kd-vong" style={{ borderColor: mauDiem(kq.diem) }}>
          <b data-testid="kiem-dinh-diem">{kq.diem}</b><span>/100</span>
        </div>
        <div>
          <p className="hbt-kd-tieu-de">Kiểm định SEO · GEO</p>
          <p className="hbt-kd-phu">
            {kq.loi_chan.length
              ? <span style={{ color: MAU.loi }} data-testid="kiem-dinh-chan">{kq.loi_chan.length} lỗi chặn xuất bản</span>
              : kq.diem >= 80 ? "Sẵn sàng xuất bản" : "Xuất bản được — còn gợi ý nên sửa"}
          </p>
        </div>
      </div>
      {(Object.keys(TEN_NHOM) as Nhom[]).map((n) => {
        const ds = theoNhom.get(n) ?? [];
        if (!ds.length) return null;
        const xau = ds.filter((m) => m.muc_do !== "dat").length;
        const dangMo = mo[n] ?? xau > 0;
        return (
          <div key={n} className="hbt-kd-nhom">
            <button type="button" className="hbt-kd-nut" aria-expanded={dangMo} onClick={() => setMo({ ...mo, [n]: !dangMo })}>
              <span>{TEN_NHOM[n]}</span>
              <span className="hbt-kd-dem">{xau ? `${xau} cần xem` : "ổn"}</span>
            </button>
            {dangMo && (
              <ul>
                {ds.filter((m) => hienDat || m.muc_do !== "dat").map((m) => (
                  <li key={m.ma} data-ma={m.ma} data-muc-do={m.muc_do}>
                    <span className="hbt-kd-ky" style={{ background: MAU[m.muc_do] }} aria-hidden>{KY[m.muc_do]}</span>
                    <span>{m.thong_diep}{m.chan ? <b style={{ color: MAU.loi }}> (chặn xuất bản)</b> : null}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <div className="hbt-kd-nhom" data-testid="kiem-trung">
        <button type="button" className="hbt-kd-nut" onClick={kiemTrung} disabled={trung.dang}>
          <span>{trung.dang ? "Đang so…" : "Kiểm trùng nội dung"}</span>
          <span className="hbt-kd-dem">bài khác · kho tri thức</span>
        </button>
        {trung.loi ? <p className="hbt-kd-phu" style={{ color: MAU.loi }}>{trung.loi}</p> : null}
        {trung.muc && !trung.loi && (
          trung.muc.length ? (
            <ul>
              {trung.muc.map((m) => (
                <li key={m.ma} data-ma={m.ma} data-muc-do={m.muc_do}>
                  <span className="hbt-kd-ky" style={{ background: MAU[m.muc_do] }} aria-hidden>{KY[m.muc_do]}</span>
                  <span>{m.thong_diep}{m.chan ? <b style={{ color: MAU.loi }}> (chặn gửi duyệt)</b> : null}</span>
                </li>
              ))}
            </ul>
          ) : <p className="hbt-kd-phu">Bài còn ngắn — viết thêm rồi kiểm.</p>
        )}
      </div>
      <button type="button" className="hbt-kd-them" onClick={() => setHienDat(!hienDat)}>
        {hienDat ? "Ẩn các mục đã đạt" : `Xem cả ${kq.muc.filter((m) => m.muc_do === "dat").length} mục đã đạt`}
      </button>
    </section>
  );
}
