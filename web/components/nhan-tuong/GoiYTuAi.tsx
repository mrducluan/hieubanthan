"use client";
// ANH-1 — "Cho máy AI xem thêm" (tuỳ chọn, CHỈ hiện khi người vận hành đã bật ở engine): ≤ 3 ảnh (chính diện + nghiêng trái /
// phải) đi qua máy chủ tới dịch vụ AI nhận diện bên thứ ba MỘT lượt để gợi ý thêm những nét phép đo hình học không làm được
// (sắc da, nếp, ánh mắt…). Thoả thuận RIÊNG `am1` (khác mục đích với phép đo `dm1`). Thu nhỏ + bỏ EXIF trên máy (lib/anh-nha),
// đếm mặt bằng FaceDetector của trình duyệt khi có. Không lưu ảnh; gợi ý người dùng tự xác nhận.
import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, ScanFace, ShieldCheck, X } from "lucide-react";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { chuanBiAnhGui } from "@/lib/anh-nha";
import { ghi } from "@/lib/do-luong";
import { DONG_Y_ANH_AI, ngayDongYAnhMat } from "@/lib/dong-y-anh-mat";
import type { KhaoSat, TraLoi } from "@/lib/nhan-tuong";
import { cn } from "@/lib/utils";
import { DanhSachGoiY, type GoiYNet } from "./DanhSachGoiY";

type Goc = "thang" | "nghieng_trai" | "nghieng_phai";
const GOC: { ma: Goc; ten: string; mo: string; batBuoc: boolean }[] = [
  { ma: "thang", ten: "Chính diện", mo: "Nhìn thẳng, tóc không che trán", batBuoc: true },
  { ma: "nghieng_trai", ten: "Nghiêng trái", mo: "Quay ~45°, thấy sống mũi và tai", batBuoc: false },
  { ma: "nghieng_phai", ten: "Nghiêng phải", mo: "Quay ~45° sang phải", batBuoc: false },
];
interface Anh { tep: File; url: string; soMat: number | null }
interface Kq { da_bat: boolean; ly_do_tat: null | "chua_bat" | "het_luot" | "loi_dich_vu"; tra_loi: GoiYNet[]; luu_y: string[] }
const LOI: Record<string, string> = {
  het_luot: "Hôm nay máy AI đã hết lượt — phép đo trên ảnh và Khảo sát vẫn dùng được.",
  loi_dich_vu: "Máy AI chưa đọc được ảnh lúc này — thử lại sau, hoặc dùng phép đo trên ảnh.",
  chua_bat: "Máy AI chưa bật trên bản này.",
};
const urlBlob = (f: File): string | null => { const u = URL.createObjectURL(f); return u.startsWith("blob:") ? u : null; };

async function demMat(tep: File): Promise<number | null> {
  const FD = (globalThis as unknown as { FaceDetector?: new (o?: { maxDetectedFaces?: number; fastMode?: boolean }) => { detect: (i: ImageBitmap) => Promise<unknown[]> } }).FaceDetector;
  if (!FD || typeof createImageBitmap !== "function") return null;
  try {
    const bmp = await createImageBitmap(tep, { imageOrientation: "from-image" });
    try { return (await new FD({ maxDetectedFaces: 4, fastMode: true }).detect(bmp)).length; } finally { bmp.close(); }
  } catch { return null; }
}

export function GoiYTuAi({ ks, daTraLoi, onGoiY, onXem, dangXem }: {
  ks: KhaoSat; daTraLoi: TraLoi; onGoiY: (tl: TraLoi) => void; onXem: () => void; dangXem?: boolean;
}) {
  const [anh, setAnh] = useState<Partial<Record<Goc, Anh>>>({});
  const [tick, setTick] = useState(false);
  const dongY = DONG_Y_ANH_AI.use();
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState<Kq | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const anhRef = useRef(anh);
  anhRef.current = anh;
  useEffect(() => () => { for (const a of Object.values(anhRef.current)) if (a) URL.revokeObjectURL(a.url); }, []);

  const chonAnh = async (goc: Goc, f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    const url = urlBlob(f);
    if (!url) return;
    setAnh((a) => { if (a[goc]) URL.revokeObjectURL(a[goc]!.url); return { ...a, [goc]: { tep: f, url, soMat: null } }; });
    setKq(null); setLoi(null);
    const so = await demMat(f);
    setAnh((a) => (a[goc]?.tep === f ? { ...a, [goc]: { ...a[goc]!, soMat: so } } : a));
  };
  const boAnh = (goc: Goc) => setAnh((a) => { if (a[goc]) URL.revokeObjectURL(a[goc]!.url); const { [goc]: _bo, ...con } = a; return con; });
  const thang = anh.thang;
  const canhBaoMat = thang?.soMat != null && thang.soMat !== 1 ? (thang.soMat === 0 ? "Chưa thấy gương mặt trong ảnh chính diện — chọn ảnh chụp thẳng, đủ sáng." : "Ảnh có nhiều hơn một gương mặt — chỉ gửi ảnh của chính bạn, một mình trong khung.") : null;
  const sanSang = Boolean(thang && !canhBaoMat && (dongY || tick) && !dang);

  const doc = async () => {
    if (!sanSang) return;
    if (!DONG_Y_ANH_AI.da()) DONG_Y_ANH_AI.ghi();
    setDang(true); setKq(null); setLoi(null);
    try {
      const ds = GOC.filter((g) => anh[g.ma]).map((g) => ({ goc: g.ma, tep: anh[g.ma]!.tep }));
      const gui = await chuanBiAnhGui(ds.map((x) => x.tep));
      const r = await fetch("/api/nhan-tuong/doc-anh", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ anh: gui.map((a, i) => ({ ...a, goc: ds[i]!.goc })), dong_y: true }) });
      const d = (await r.json().catch(() => null)) as Kq | null;
      if (!r.ok || !d || typeof d.da_bat !== "boolean") { setLoi(LOI.loi_dich_vu!); return; }
      if (!d.da_bat) { setLoi(LOI[d.ly_do_tat ?? "loi_dich_vu"] ?? LOI.loi_dich_vu!); return; }
      setKq(d);
      ghi("chart_interacted", { mo_dun: "nhantuong", kind: "doc_anh", so_anh: ds.length, so_goi_y: (d.tra_loi ?? []).length, da_bat: 1 });
    } catch { setLoi(LOI.loi_dich_vu!); } finally { setDang(false); }
  };

  return (
    <div className="space-y-4" data-testid="anh-ai">
      <ul className="grid gap-2 sm:grid-cols-3" aria-label="Ba góc chụp">
        {GOC.map((g) => {
          const a = anh[g.ma];
          return (
            <li key={g.ma} className={cn("rounded-2xl border p-3 text-sm", a ? "border-jade/50 bg-jade/[0.05]" : "border-line/70 bg-bg/40")} data-testid={`anh-goc-${g.ma}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-fg">{g.ten}{g.batBuoc ? "" : <span className="ml-1 text-xs font-normal text-fg-faint">(tuỳ chọn)</span>}</span>
                {a && <button type="button" aria-label={`Bỏ ảnh ${g.ten.toLowerCase()}`} onClick={() => boAnh(g.ma)} className="rounded-full border border-line p-0.5 text-fg-faint hover:text-fg"><X className="size-3.5" aria-hidden /></button>}
              </div>
              {a ? (
                <div className="relative mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng */}
                  <img src={a.url} alt={`Ảnh ${g.ten.toLowerCase()} bạn chọn (chỉ hiện trên máy)`} className="h-24 w-full rounded-lg border border-line object-cover" />
                  {a.soMat === 1 && <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-bg/80 px-1.5 py-0.5 text-[11px] text-jade"><Check className="size-3" aria-hidden /> thấy 1 gương mặt</span>}
                </div>
              ) : (
                <label className="mt-2 flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line/80 text-xs text-fg-muted hover:border-gold/60 hover:text-fg">
                  <ImagePlus className="size-5" aria-hidden />{g.batBuoc ? "Chọn hoặc chụp" : "Thêm (không bắt buộc)"}
                  <input type="file" accept="image/*" capture={g.ma === "thang" ? "user" : undefined} className="sr-only" data-testid={`anh-input-${g.ma}`}
                    aria-label={`Chọn ảnh ${g.ten.toLowerCase()} gửi máy AI`} onChange={(e) => { void chonAnh(g.ma, e.target.files?.[0]); e.target.value = ""; }} />
                </label>
              )}
              <p className="mt-1.5 text-xs leading-snug text-fg-faint">{g.mo}</p>
            </li>
          );
        })}
      </ul>
      {canhBaoMat && <p className="text-sm text-cinnabar" data-testid="anh-canh-bao-mat">{canhBaoMat}</p>}
      <div className="rounded-2xl border border-line/70 bg-bg/70 p-4" data-testid="anh-thoa-thuan">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg"><ShieldCheck className="size-4 text-gold" aria-hidden /> Thoả thuận gửi ảnh cho máy AI (riêng với phép đo)</p>
        <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
          Ảnh của <b className="text-fg">chính bạn</b> (đủ 18 tuổi) được thu nhỏ, bỏ thông tin máy ảnh trên máy bạn rồi đi qua <b className="text-fg">một lượt gọi</b> tới dịch vụ AI nhận diện bên thứ ba (nhóm nhà cung cấp AI thị giác, máy chủ ngoài Việt Nam) để gợi ý nét mặt theo bộ câu khảo sát. Hiểu Bản Thân <b className="text-fg">không lưu ảnh</b>, không ghi nhật ký ảnh, không dùng để nhận ra bạn hay huấn luyện. <Link href="/chinh-sach-rieng-tu#anh-mat" className="text-gold underline underline-offset-2">Chính sách riêng tư</Link>.
        </p>
        {dongY ? (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted" data-testid="anh-da-dong-y">
            <Check className="size-3.5 text-jade" aria-hidden /> Đã đồng ý ngày {ngayDongYAnhMat(dongY)} (bản {DONG_Y_ANH_AI.phienBan}).
            <button type="button" className="underline underline-offset-2 hover:text-fg" onClick={() => { DONG_Y_ANH_AI.thuHoi(); setTick(false); }}>Rút thoả thuận</button>
          </p>
        ) : (
          <label className="mt-2 flex items-start gap-2 text-sm text-fg">
            <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={tick} onChange={(e) => setTick(e.target.checked)} data-testid="anh-dong-y" />
            <span>Tôi đồng ý gửi ảnh gương mặt của chính tôi tới dịch vụ AI theo thoả thuận trên.</span>
          </label>
        )}
        <div className="mt-3"><Button variant="secondary" onClick={doc} disabled={!sanSang} data-testid="anh-doc"><ScanFace aria-hidden /> {dang ? "Đang đọc ảnh…" : "Cho máy AI xem"}</Button></div>
        {loi && <p className="mt-2 text-sm text-fg-muted" data-testid="anh-loi">{loi}</p>}
      </div>
      {kq && <DanhSachGoiY key={JSON.stringify(kq.tra_loi)} ks={ks} goiY={kq.tra_loi} luuY={kq.luu_y} daTraLoi={daTraLoi} onGoiY={onGoiY} onXem={onXem} dangXem={dangXem} nguon="ai" />}
    </div>
  );
}
