"use client";
// PT-V2 — "Để máy đọc ảnh (thử nghiệm)": người dùng chọn 1–3 ảnh góc nhà, TỰ TÍCH đồng ý (không tích sẵn) gửi ảnh tới dịch
// vụ AI bên thứ ba qua engine → máy trả dấu hiệu GỢI Ý kèm độ tin + lý do; người dùng bấm Đúng / Không từng dòng, hệ
// thống mới luận. Ảnh thu nhỏ trên trình duyệt (lib/anh-nha.ts: bỏ EXIF, ≤ 1280 px, ≤ ~1 MB), xem trước là `blob:`
// trên máy; không lưu ảnh ở đâu (kể cả base64 trong hồ sơ nhà). Dấu hiệu CHƯA bấm không đi vào bố cục.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ImagePlus, ScanEye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chuanBiAnhGui, SO_ANH_TOI_DA } from "@/lib/anh-nha";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

export interface KqDocAnh {
  da_bat: boolean;
  ly_do_tat: null | "chua_dat_khoa" | "het_luot" | "loi_dich_vu";
  dau_hieu: { ma: string; co: boolean; do_tin: number; ly_do: string }[];
  phong_doan: { phong: string; do_tin: number }[];
  luu_y: string[];
  can_xac_nhan: true;
}
const GOC_CHUP = ["mặt tiền", "phòng khách", "bếp", "phòng ngủ", "bàn thờ", "WC", "khác"];
const LOI_TAT: Record<NonNullable<KqDocAnh["ly_do_tat"]>, string> = {
  chua_dat_khoa: "Máy đọc ảnh chưa bật trên bản này — bạn tích tay các ô bên dưới nhé.",
  het_luot: "Hôm nay máy đọc ảnh đã hết lượt — bạn tích tay hoặc thử lại sau.",
  loi_dich_vu: "Chưa đọc được ảnh, bạn thử lại hoặc tích tay.",
};
const LOI_CHUNG = LOI_TAT.loi_dich_vu;
type AnhChon = { tep: File; url: string };

export function doTinChu(d: number): "cao" | "vừa" | "thấp" { return d >= 0.7 ? "cao" : d >= 0.4 ? "vừa" : "thấp"; }

export function DocAnhNha({ cauHoi, tenPhong, loaiNha, yDinh, anhGoiY, dau, daTraLoi, onXacNhan }: {
  /** mã dấu hiệu → câu hỏi của ô (danh mục engine) — mã lạ không hiện. */
  cauHoi: Record<string, string>;
  tenPhong: Record<string, string>;
  loaiNha: string;
  yDinh: string | null;
  /** Ảnh góc nhà người dùng vừa chọn ở "Chụp một góc, trả lời 3 câu" — dùng lại, khỏi chọn hai lần. */
  anhGoiY: File | null;
  dau: Set<string>;
  /** Dòng đã bấm Đúng / Không (cha giữ để đồng bộ với ô tích). */
  daTraLoi: Record<string, boolean>;
  onXacNhan: (ma: string, dung: boolean) => void;
}) {
  const [anh, setAnh] = useState<AnhChon[]>([]);
  const [dongY, setDongY] = useState(false);
  const [goc, setGoc] = useState("");
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState<KqDocAnh | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const anhRef = useRef<AnhChon[]>([]);
  anhRef.current = anh;
  useEffect(() => () => { anhRef.current.forEach((a) => URL.revokeObjectURL(a.url)); }, []);

  const them = (teps: File[]) => {
    setAnh((ds) => {
      const moi = teps.filter((t) => t.type.startsWith("image/") && !ds.some((a) => a.tep === t)).slice(0, Math.max(0, SO_ANH_TOI_DA - ds.length));
      return moi.length ? [...ds, ...moi.map((tep) => ({ tep, url: URL.createObjectURL(tep) }))] : ds;
    });
    setKq(null); setThongBao(null);
  };
  useEffect(() => { if (anhGoiY) them([anhGoiY]); }, [anhGoiY]);   // eslint-disable-line react-hooks/exhaustive-deps -- chỉ khi ảnh gợi ý đổi
  const bo = (i: number) => setAnh((ds) => { const a = ds[i]; if (a) URL.revokeObjectURL(a.url); return ds.filter((_, j) => j !== i); });

  const doc = async () => {
    if (!dongY || !anh.length || dang) return;
    setDang(true); setKq(null); setThongBao(null);
    try {
      const anhGui = await chuanBiAnhGui(anh.map((a) => a.tep));
      const r = await fetch("/api/phongthuy/doc-anh", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ anh: anhGui, goc: goc || null, loai_nha: loaiNha || null, y_dinh: yDinh }),
      });
      const d = (await r.json().catch(() => null)) as KqDocAnh | null;
      if (!r.ok || !d || typeof d.da_bat !== "boolean") { setThongBao(LOI_CHUNG); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh", so_anh: anh.length, so_dau_hieu: 0, da_bat: 0 }); return; }
      const dh = (d.dau_hieu ?? []).filter((x) => x.co && /^[a-z0-9_]{2,40}$/.test(x.ma));
      if (!d.da_bat) setThongBao(LOI_TAT[d.ly_do_tat ?? "loi_dich_vu"] ?? LOI_CHUNG);
      else setKq({ ...d, dau_hieu: dh, phong_doan: d.phong_doan ?? [], luu_y: d.luu_y ?? [] });
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh", so_anh: anh.length, so_dau_hieu: dh.length, da_bat: d.da_bat ? 1 : 0 });
    } catch {
      setThongBao(LOI_CHUNG);
    } finally { setDang(false); }
  };
  const phong = kq?.phong_doan[0];
  const tenPhongDoan = phong ? (tenPhong[phong.phong] ?? phong.phong) : null;

  return (
    <div className="rounded-xl border border-line/70 bg-bg/30 p-3" data-testid="doc-anh-nha">
      <p className="flex items-center gap-2 text-sm font-medium text-fg"><ScanEye className="size-4 text-gold" aria-hidden /> Để máy đọc ảnh (thử nghiệm)</p>
      <p className="mt-1 text-xs text-fg-muted">Chọn 1–3 ảnh góc nhà (mặt tiền, phòng khách, bếp, phòng ngủ…). Máy gợi ý dấu hiệu nó nhìn thấy, bạn bấm Đúng / Không từng dòng.
        Ảnh được thu nhỏ ngay trên máy bạn trước khi gửi.</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <label className={cn("inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-2.5 py-1 text-fg-muted hover:text-fg", anh.length >= SO_ANH_TOI_DA && "pointer-events-none opacity-50")}>
          <ImagePlus className="size-3.5" aria-hidden /> {anh.length ? "Thêm ảnh" : "Chọn ảnh"}
          <input type="file" accept="image/*" multiple className="sr-only" aria-label="Chọn 1–3 ảnh để máy đọc (không lưu)" disabled={anh.length >= SO_ANH_TOI_DA}
            onChange={(e) => { them(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        </label>
        <select aria-label="Góc chụp" value={goc} onChange={(e) => setGoc(e.target.value)} className="h-8 rounded-full border border-line bg-surface/60 px-2.5 text-xs">
          <option value="">Góc chụp (tuỳ chọn)…</option>
          {[...GOC_CHUP, ...(goc && !GOC_CHUP.includes(goc) ? [goc] : [])].map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="text-fg-faint">{anh.length}/{SO_ANH_TOI_DA} ảnh</span>
      </div>
      {anh.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Ảnh đã chọn (chỉ hiện trên máy)">
          {anh.map((a, i) => (
            <li key={a.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng, không qua next/image */}
              <img src={a.url} alt={`Ảnh ${i + 1} bạn chọn (chỉ hiện trên máy)`} className="size-16 rounded-lg border border-line object-cover" />
              <button type="button" onClick={() => bo(i)} aria-label={`Bỏ ảnh ${i + 1}`} className="absolute -right-1.5 -top-1.5 rounded-full border border-line bg-bg p-0.5 text-fg-faint hover:text-fg"><X className="size-3" aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}

      <label className="mt-3 flex items-start gap-2 text-xs text-fg-muted">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={dongY} onChange={(e) => setDongY(e.target.checked)} data-testid="doc-anh-dong-y" />
        <span>Tôi đồng ý gửi ảnh này tới dịch vụ AI bên thứ ba để nhận diện dấu hiệu. Ảnh không được lưu — chỉ đi qua lượt gọi, kết quả bạn tự xác nhận.{" "}
          <Link href="/chinh-sach-rieng-tu#ben-thu-ba" className="text-gold underline">Chính sách quyền riêng tư</Link></span>
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" onClick={doc} disabled={!dongY || !anh.length || dang} data-testid="doc-anh-nut"><ScanEye aria-hidden /> {dang ? "Đang đọc…" : "Đọc ảnh"}</Button>
        {thongBao && <p className="text-xs text-fg-muted" data-testid="doc-anh-thong-bao">{thongBao}</p>}
      </div>

      {kq && (
        <div className="mt-3 space-y-2" data-testid="doc-anh-ket-qua">
          {tenPhongDoan && (
            <p className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">Có vẻ đây là <b className="text-fg">{tenPhongDoan}</b>.
              {goc !== tenPhongDoan && <button type="button" onClick={() => setGoc(tenPhongDoan)} className="rounded-full border border-line px-2 py-0.5 hover:text-fg" data-testid="doc-anh-dung-goc">Dùng làm góc chụp</button>}
            </p>
          )}
          {kq.dau_hieu.length ? (
            <>
              <p className="text-sm font-medium text-fg">Máy thấy có thể có…</p>
              <ul className="space-y-2">
                {kq.dau_hieu.map((x) => {
                  const tl = daTraLoi[x.ma];
                  const dt = doTinChu(x.do_tin);
                  return (
                    <li key={x.ma} className="rounded-lg border border-line/60 bg-surface/40 px-3 py-2 text-sm" data-testid={`doc-anh-dong-${x.ma}`}>
                      <p className="text-fg">{cauHoi[x.ma] ?? x.ma.replace(/_/g, " ")}</p>
                      <p className="mt-0.5 text-xs text-fg-faint">
                        <span className={cn("mr-1.5 rounded-full border px-1.5 py-px", dt === "cao" ? "border-gold/60 text-gold" : dt === "vừa" ? "border-line text-fg-muted" : "border-line/60 text-fg-faint")}>Độ tin: {dt}</span>
                        {x.ly_do}
                      </p>
                      <div className="mt-1.5 flex gap-1.5">
                        <button type="button" onClick={() => onXacNhan(x.ma, true)} aria-pressed={tl === true} data-testid={`doc-anh-dung-${x.ma}`}
                          className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs", tl === true && dau.has(x.ma) ? "border-moon bg-moon/15 text-fg" : "border-line text-fg-muted hover:text-fg")}><Check className="size-3" aria-hidden /> Đúng</button>
                        <button type="button" onClick={() => onXacNhan(x.ma, false)} aria-pressed={tl === false} data-testid={`doc-anh-khong-${x.ma}`}
                          className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs", tl === false ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}><X className="size-3" aria-hidden /> Không</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : <p className="text-sm text-fg-muted">Máy chưa thấy dấu hiệu nào rõ trong ảnh — bạn tích tay ở mục 4 nếu có.</p>}
          {kq.luu_y.map((l) => <p key={l} className="text-xs text-fg-faint">{l}</p>)}
        </div>
      )}
      <p className="mt-2 text-xs text-fg-faint">Máy chỉ gợi ý điều nhìn thấy trong ảnh — bạn xác nhận rồi hệ thống mới luận. Ảnh không được lưu.</p>
    </div>
  );
}
