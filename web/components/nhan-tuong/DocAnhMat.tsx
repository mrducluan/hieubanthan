"use client";
// NT-1 — "Để máy gợi ý từ ảnh" (CHỈ hiện khi người vận hành bật ở engine: GET /api/nhan-tuong/cau-hinh → doc_anh = true).
// Ảnh gương mặt là dữ liệu sinh trắc: ô đồng ý KHÔNG tích sẵn, một ảnh, thu nhỏ trên máy (lib/anh-nha: bỏ EXIF, ≤ 1280 px),
// không lưu; máy chỉ trả GỢI Ý lựa chọn cho từng câu, người dùng bấm "Dùng" mới điền vào khảo sát. Mặc định tắt.
import { useEffect, useRef, useState } from "react";
import Link from "@/components/khung/Lien";
import { Check, ImagePlus, ScanFace, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chuanBiAnhGui } from "@/lib/anh-nha";
import { ghi } from "@/lib/do-luong";
import type { KhaoSat } from "@/lib/nhan-tuong";

interface Kq { da_bat: boolean; ly_do_tat: null | "chua_bat" | "het_luot" | "loi_dich_vu"; tra_loi: { cau: string; lua_chon: string; do_tin: number }[]; luu_y: string[]; can_xac_nhan: true }
const LOI: Record<string, string> = {
  chua_bat: "Máy gợi ý từ ảnh chưa bật trên bản này — bạn tự soi gương và chọn nhé.",
  het_luot: "Hôm nay máy gợi ý đã hết lượt — bạn tự chọn hoặc thử lại sau.",
  loi_dich_vu: "Chưa đọc được ảnh, bạn thử lại hoặc tự chọn.",
};

export function DocAnhMat({ ks, daTraLoi, onDung }: { ks: KhaoSat; daTraLoi: Record<string, string>; onDung: (cau: string, lua: string) => void }) {
  const [bat, setBat] = useState<boolean | null>(null);
  const [tep, setTep] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [dongY, setDongY] = useState(false);
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState<Kq | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  urlRef.current = url;
  useEffect(() => {
    fetch("/api/nhan-tuong/cau-hinh").then((r) => (r.ok ? r.json() : null)).then((d) => setBat(Boolean(d?.doc_anh))).catch(() => setBat(false));
    return () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
  }, []);
  if (!bat) return null;
  const cau = Object.fromEntries(ks.cau_hoi.map((c) => [c.ma, c]));
  const doc = async () => {
    if (!dongY || !tep || dang) return;
    setDang(true); setKq(null); setThongBao(null);
    try {
      const anh = await chuanBiAnhGui([tep]);
      const r = await fetch("/api/nhan-tuong/doc-anh", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ anh: anh.slice(0, 1) }) });
      const d = (await r.json().catch(() => null)) as Kq | null;
      if (!r.ok || !d || typeof d.da_bat !== "boolean") { setThongBao(LOI.loi_dich_vu!); return; }
      if (!d.da_bat) setThongBao(LOI[d.ly_do_tat ?? "loi_dich_vu"] ?? LOI.loi_dich_vu!);
      else setKq({ ...d, tra_loi: (d.tra_loi ?? []).filter((x) => cau[x.cau]?.lua_chon.some((l) => l.ma === x.lua_chon)) });
      ghi("chart_interacted", { mo_dun: "nhantuong", kind: "doc_anh", so_goi_y: d.da_bat ? (d.tra_loi ?? []).length : 0, da_bat: d.da_bat ? 1 : 0 });
    } catch { setThongBao(LOI.loi_dich_vu!); } finally { setDang(false); }
  };
  return (
    <div className="rounded-xl border border-line/70 bg-bg/30 p-3" data-testid="doc-anh-mat">
      <p className="flex items-center gap-2 text-sm font-medium text-fg"><ScanFace className="size-4 text-gold" aria-hidden /> Để máy gợi ý từ ảnh (thử nghiệm)</p>
      <p className="mt-1 text-xs text-fg-muted">Chọn một ảnh chụp thẳng; máy gợi ý lựa chọn cho từng câu, bạn bấm “Dùng” mới điền. Ảnh được thu nhỏ trên máy bạn, chỉ đi qua một lượt gọi, không lưu.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-2.5 py-1 text-fg-muted hover:text-fg">
          <ImagePlus className="size-3.5" aria-hidden /> {tep ? "Đổi ảnh" : "Chọn ảnh"}
          <input type="file" accept="image/*" className="sr-only" aria-label="Chọn một ảnh chân dung để máy gợi ý (không lưu)"
            onChange={(e) => { const f = e.target.files?.[0]; if (f?.type.startsWith("image/")) { if (url) URL.revokeObjectURL(url); setTep(f); setUrl(URL.createObjectURL(f)); setKq(null); } e.target.value = ""; }} />
        </label>
        {url && (
          <span className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng */}
            <img src={url} alt="Ảnh bạn chọn (chỉ hiện trên máy)" className="size-14 rounded-lg border border-line object-cover" />
            <button type="button" aria-label="Bỏ ảnh" onClick={() => { if (url) URL.revokeObjectURL(url); setUrl(null); setTep(null); setKq(null); }} className="absolute -right-1.5 -top-1.5 rounded-full border border-line bg-bg p-0.5 text-fg-faint hover:text-fg"><X className="size-3" aria-hidden /></button>
          </span>
        )}
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs text-fg-muted">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={dongY} onChange={(e) => setDongY(e.target.checked)} data-testid="doc-anh-mat-dong-y" />
        <span>Tôi đồng ý gửi ảnh gương mặt của chính tôi tới dịch vụ AI bên thứ ba để nhận gợi ý. Ảnh là dữ liệu sinh trắc — không được lưu, chỉ đi qua lượt gọi; mọi gợi ý tôi tự xác nhận. Bỏ tích là không gửi.{" "}
          <Link href="/chinh-sach-rieng-tu#anh-mat" className="text-gold underline">Chính sách riêng tư</Link></span>
      </label>
      <div className="mt-2"><Button size="sm" onClick={doc} disabled={!dongY || !tep || dang}>{dang ? "Đang đọc…" : "Đọc ảnh"}</Button></div>
      {thongBao && <p className="mt-2 text-xs text-fg-muted">{thongBao}</p>}
      {kq && (
        <ul className="mt-3 space-y-1.5 text-sm" aria-label="Gợi ý từ ảnh (cần bạn xác nhận)">
          {kq.tra_loi.length === 0 && <li className="text-xs text-fg-muted">Máy không chắc câu nào — bạn tự soi gương và chọn nhé.</li>}
          {kq.tra_loi.map((x) => {
            const c = cau[x.cau]!, nhan = c.lua_chon.find((l) => l.ma === x.lua_chon)?.nhan ?? x.lua_chon, daDung = daTraLoi[x.cau] === x.lua_chon;
            return (
              <li key={x.cau} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line/60 px-3 py-2">
                <span><span className="text-fg-muted">{c.hoi}</span> <b className="text-fg">{nhan}</b> <span className="text-xs text-fg-faint">({Math.round(x.do_tin * 100)}%)</span></span>
                <Button size="sm" variant={daDung ? "secondary" : "primary"} disabled={daDung} onClick={() => onDung(x.cau, x.lua_chon)}>{daDung ? <><Check aria-hidden /> Đã dùng</> : "Dùng"}</Button>
              </li>
            );
          })}
          {kq.luu_y.map((l, i) => <li key={`ly${i}`} className="text-xs text-fg-faint">{l}</li>)}
        </ul>
      )}
    </div>
  );
}
