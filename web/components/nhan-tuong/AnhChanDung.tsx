"use client";
// ANH-1 — "Tải ảnh chân dung" ở ĐẦU trang Nhân tướng học: 1 ảnh chính diện (bắt buộc) + 2 ảnh nghiêng (tuỳ chọn) → máy nhận
// diện gương mặt và gợi ý lựa chọn cho khảo sát; người dùng xác nhận từng gợi ý rồi xem bài đọc. Ảnh gương mặt là dữ liệu
// sinh trắc → chỉ gửi khi người dùng đã tích THOẢ THUẬN (lib/dong-y-anh-mat, không tích sẵn, rút được) VÀ người vận hành đã
// bật ở engine (GET /api/nhan-tuong/cau-hinh). Trên máy: thu nhỏ + bỏ EXIF (lib/anh-nha), kiểm "đúng một gương mặt" bằng
// FaceDetector của trình duyệt khi có (không có thì máy chủ kiểm bằng mô hình). Ảnh không lưu ở đâu; web chỉ đo số ảnh / số
// gợi ý. Đọc tướng vẫn là KB + luật tất định của engine — mô hình chỉ gắn nhãn điều nhìn thấy.
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, ImagePlus, ScanFace, ShieldCheck, Sparkles, X } from "lucide-react";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { chuanBiAnhGui } from "@/lib/anh-nha";
import { ghi } from "@/lib/do-luong";
import { daDongYAnhMat, ghiDongYAnhMat, ngayDongYAnhMat, thuHoiDongYAnhMat, useDongYAnhMat, PHIEN_BAN_DONG_Y_ANH } from "@/lib/dong-y-anh-mat";
import type { KhaoSat, TraLoi } from "@/lib/nhan-tuong";
import { cn } from "@/lib/utils";

type Goc = "thang" | "nghieng_trai" | "nghieng_phai";
const GOC: { ma: Goc; ten: string; mo: string; batBuoc: boolean }[] = [
  { ma: "thang", ten: "Chính diện", mo: "Nhìn thẳng, không cười gượng, tóc không che trán", batBuoc: true },
  { ma: "nghieng_trai", ten: "Nghiêng trái", mo: "Quay mặt sang trái ~45°, thấy sống mũi và tai", batBuoc: false },
  { ma: "nghieng_phai", ten: "Nghiêng phải", mo: "Quay mặt sang phải ~45°", batBuoc: false },
];
interface Anh { tep: File; url: string; soMat: number | null }
interface GoiY { cau: string; lua_chon: string; do_tin: number }
interface Kq { da_bat: boolean; ly_do_tat: null | "chua_bat" | "het_luot" | "loi_dich_vu"; tra_loi: GoiY[]; luu_y: string[];
  kiem_tra: null | { thay_mat: boolean; so_nguoi: number; nhin_thang: boolean; du_sang: boolean } }
const LOI: Record<string, string> = {
  het_luot: "Hôm nay máy đọc ảnh đã hết lượt — bạn tự soi gương ở phần Khảo sát hoặc thử lại sau.",
  loi_dich_vu: "Chưa đọc được ảnh lúc này — bạn thử lại hoặc tự soi gương ở phần Khảo sát.",
  chua_bat: "Máy đọc ảnh chưa bật trên bản này.",
};

/** Chỉ nhận URL `blob:` do trình duyệt cấp cho tệp trên máy. */
const urlBlob = (f: File): string | null => { const u = URL.createObjectURL(f); return u.startsWith("blob:") ? u : null; };

/** Đếm gương mặt NGAY TRÊN MÁY bằng FaceDetector của trình duyệt (Shape Detection API) — không có thì `null` (máy chủ kiểm). */
async function demMat(tep: File): Promise<number | null> {
  const FD = (globalThis as unknown as { FaceDetector?: new (o?: { maxDetectedFaces?: number; fastMode?: boolean }) => { detect: (i: ImageBitmap) => Promise<unknown[]> } }).FaceDetector;
  if (!FD || typeof createImageBitmap !== "function") return null;
  try {
    const bmp = await createImageBitmap(tep, { imageOrientation: "from-image" });
    try { return (await new FD({ maxDetectedFaces: 4, fastMode: true }).detect(bmp)).length; } finally { bmp.close(); }
  } catch { return null; }
}

export function AnhChanDung({ ks, daTraLoi, onGoiY, onXem, dangXem }: {
  ks: KhaoSat | null; daTraLoi: TraLoi; onGoiY: (tl: TraLoi) => void; onXem: () => void; dangXem?: boolean;
}) {
  const [bat, setBat] = useState<boolean | null>(null);
  const [anh, setAnh] = useState<Partial<Record<Goc, Anh>>>({});
  const [tick, setTick] = useState(false);
  const dongY = useDongYAnhMat();
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState<Kq | null>(null);
  const [chon, setChon] = useState<Record<string, boolean>>({});
  const [loi, setLoi] = useState<string | null>(null);
  const [daDung, setDaDung] = useState<number | null>(null);
  const anhRef = useRef(anh);
  anhRef.current = anh;
  useEffect(() => {
    fetch("/api/nhan-tuong/cau-hinh").then((r) => (r.ok ? r.json() : null)).then((d) => setBat(Boolean(d?.doc_anh))).catch(() => setBat(false));
    return () => { for (const a of Object.values(anhRef.current)) if (a) URL.revokeObjectURL(a.url); };
  }, []);
  const cau = useMemo(() => Object.fromEntries((ks?.cau_hoi ?? []).map((c) => [c.ma, c])), [ks]);

  const chonAnh = async (goc: Goc, f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    const url = urlBlob(f);
    if (!url) return;
    setAnh((a) => { if (a[goc]) URL.revokeObjectURL(a[goc]!.url); return { ...a, [goc]: { tep: f, url, soMat: null } }; });
    setKq(null); setLoi(null); setDaDung(null);
    const so = await demMat(f);
    setAnh((a) => (a[goc]?.tep === f ? { ...a, [goc]: { ...a[goc]!, soMat: so } } : a));
  };
  const boAnh = (goc: Goc) => setAnh((a) => { if (a[goc]) URL.revokeObjectURL(a[goc]!.url); const { [goc]: _bo, ...con } = a; return con; });

  const thang = anh.thang;
  const canhBaoMat = thang?.soMat != null && thang.soMat !== 1 ? (thang.soMat === 0 ? "Chưa thấy gương mặt trong ảnh chính diện — chọn ảnh chụp thẳng, đủ sáng." : "Ảnh có nhiều hơn một gương mặt — chỉ gửi ảnh của chính bạn, một mình trong khung.") : null;
  const sanSang = Boolean(bat && thang && !canhBaoMat && (dongY || tick) && !dang);

  const doc = async () => {
    if (!sanSang || !thang) return;
    if (!daDongYAnhMat()) ghiDongYAnhMat();          // ghi đúng lúc hành động, theo ô người dùng vừa tích
    setDang(true); setKq(null); setLoi(null); setDaDung(null);
    try {
      const ds = GOC.filter((g) => anh[g.ma]).map((g) => ({ goc: g.ma, tep: anh[g.ma]!.tep }));
      const gui = await chuanBiAnhGui(ds.map((x) => x.tep));
      const body = { anh: gui.map((a, i) => ({ ...a, goc: ds[i]!.goc })), dong_y: true };
      const r = await fetch("/api/nhan-tuong/doc-anh", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const d = (await r.json().catch(() => null)) as Kq | null;
      if (!r.ok || !d || typeof d.da_bat !== "boolean") { setLoi(LOI.loi_dich_vu!); return; }
      if (!d.da_bat) { setLoi(LOI[d.ly_do_tat ?? "loi_dich_vu"] ?? LOI.loi_dich_vu!); if (d.ly_do_tat === "chua_bat") setBat(false); return; }
      const hopLe = (d.tra_loi ?? []).filter((x) => cau[x.cau]?.lua_chon.some((l) => l.ma === x.lua_chon));
      setKq({ ...d, tra_loi: hopLe });
      setChon(Object.fromEntries(hopLe.map((x) => [x.cau, true])));
      ghi("chart_interacted", { mo_dun: "nhantuong", kind: "doc_anh", so_anh: ds.length, so_goi_y: hopLe.length, da_bat: 1 });
    } catch { setLoi(LOI.loi_dich_vu!); } finally { setDang(false); }
  };
  const dung = () => {
    if (!kq) return;
    const moi: TraLoi = { ...daTraLoi };
    let n = 0;
    for (const x of kq.tra_loi) if (chon[x.cau]) { moi[x.cau] = x.lua_chon; n++; }
    onGoiY(moi); setDaDung(n);
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: "doc_anh_xac_nhan", so_goi_y: n });
  };

  if (bat === false) {
    return (
      <section aria-label="Tải ảnh chân dung" data-testid="anh-chan-dung" data-bat="0"
        className="mx-auto mb-8 max-w-5xl rounded-2xl border border-line/70 bg-surface/40 p-4 text-sm text-fg-muted sm:p-5">
        <p className="flex items-center gap-2 font-medium text-fg"><Camera className="size-4 text-gold" aria-hidden /> Đọc tướng từ ảnh chân dung — đang chờ bật</p>
        <p className="mt-1">Tính năng tải ảnh để máy gợi ý nét mặt đang chờ người vận hành bật (ảnh gương mặt là dữ liệu sinh trắc, cần thoả thuận riêng). Trong lúc đó bạn vẫn có bài đọc đầy đủ bằng cách <a href="#khao-sat" className="text-gold underline underline-offset-4">tự soi gương sáu bước</a> hoặc đo ba đình trên ảnh ngay trên máy (ảnh không rời máy).</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="anh-chan-dung" data-testid="anh-chan-dung" data-bat={bat ? "1" : "x"}
      className="relative mx-auto mb-8 max-w-5xl overflow-hidden rounded-3xl border border-gold/45 bg-gradient-to-br from-gold/[0.09] via-surface/70 to-bg/40 p-5 sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" aria-hidden />
      <div className="relative grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="eyebrow text-gold">Nhanh nhất · khoảng một phút</p>
          <h2 id="anh-chan-dung" className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">Tải ảnh chân dung — máy đọc nét, <span className="text-gradient-gold">bạn xác nhận</span></h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted sm:text-base">
            Một ảnh chính diện là đủ; thêm hai ảnh nghiêng để đọc sống mũi, tai, cằm rõ hơn. Máy chỉ gắn nhãn điều nhìn thấy theo đúng bộ câu khảo sát, bạn bấm xác nhận từng nét rồi mới có bài đọc. Không chấm điểm, không nhận ra bạn là ai, không lưu ảnh.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="Ba góc chụp">
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
                      <img src={a.url} alt={`Ảnh ${g.ten.toLowerCase()} bạn chọn (chỉ hiện trên máy)`} className="h-28 w-full rounded-lg border border-line object-cover" />
                      {a.soMat === 1 && <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-bg/80 px-1.5 py-0.5 text-[11px] text-jade"><Check className="size-3" aria-hidden /> thấy 1 gương mặt</span>}
                    </div>
                  ) : (
                    <label className="mt-2 flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line/80 text-xs text-fg-muted hover:border-gold/60 hover:text-fg">
                      <ImagePlus className="size-5" aria-hidden />{g.batBuoc ? "Chọn hoặc chụp" : "Thêm (không bắt buộc)"}
                      <input type="file" accept="image/*" capture={g.ma === "thang" ? "user" : undefined} className="sr-only" data-testid={`anh-input-${g.ma}`}
                        aria-label={`Chọn ảnh ${g.ten.toLowerCase()} (chỉ hiện trên máy)`}
                        onChange={(e) => { void chonAnh(g.ma, e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                  )}
                  <p className="mt-1.5 text-xs leading-snug text-fg-faint">{g.mo}</p>
                </li>
              );
            })}
          </ul>
          {canhBaoMat && <p className="mt-2 text-sm text-cinnabar" data-testid="anh-canh-bao-mat">{canhBaoMat}</p>}
        </div>

        <div className="rounded-2xl border border-line/70 bg-bg/70 p-4 shadow-card sm:p-5" data-testid="anh-thoa-thuan">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg"><ShieldCheck className="size-4 text-gold" aria-hidden /> Thoả thuận xử lý ảnh gương mặt</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-fg-muted">
            <li>· Ảnh là của <b className="text-fg">chính bạn</b>, bạn đủ 18 tuổi và tự nguyện gửi; không gửi ảnh người khác.</li>
            <li>· Ảnh được thu nhỏ và bỏ thông tin máy ảnh ngay trên máy bạn, rồi đi qua <b className="text-fg">một lượt gọi</b> tới dịch vụ AI nhận diện bên thứ ba (nhóm nhà cung cấp AI thị giác) để gắn nhãn nét mặt theo bộ câu khảo sát.</li>
            <li>· Hiểu Bản Thân <b className="text-fg">không lưu ảnh</b>, không ghi nhật ký ảnh, không dùng ảnh để nhận ra bạn hay để huấn luyện; nhãn chỉ là gợi ý, bạn xác nhận mới dùng.</li>
            <li>· Bạn rút thoả thuận bất cứ lúc nào ở đây hoặc ở <Link href="/tai-khoan#du-lieu-cua-toi" className="text-gold underline underline-offset-2">Dữ liệu của tôi</Link>. Chi tiết: <Link href="/chinh-sach-rieng-tu#anh-mat" className="text-gold underline underline-offset-2">Chính sách riêng tư</Link>.</li>
          </ul>
          {dongY ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-fg-muted" data-testid="anh-da-dong-y">
              <Check className="size-3.5 text-jade" aria-hidden /> Đã đồng ý ngày {ngayDongYAnhMat(dongY)} (bản {PHIEN_BAN_DONG_Y_ANH}).
              <button type="button" className="underline underline-offset-2 hover:text-fg" onClick={() => { thuHoiDongYAnhMat(); setTick(false); }}>Rút thoả thuận</button>
            </p>
          ) : (
            <label className="mt-3 flex items-start gap-2 text-sm text-fg">
              <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={tick} onChange={(e) => setTick(e.target.checked)} data-testid="anh-dong-y" />
              <span>Tôi đã đọc và đồng ý thoả thuận trên cho ảnh của chính tôi.</span>
            </label>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={doc} disabled={!sanSang} data-testid="anh-doc">
              <ScanFace aria-hidden /> {dang ? "Đang đọc ảnh…" : bat === null ? "Đang kiểm tra…" : "Đọc ảnh và gợi ý"}
            </Button>
            {!thang && <span className="text-xs text-fg-faint">Cần ít nhất ảnh chính diện.</span>}
          </div>
          {loi && <p className="mt-2 text-sm text-fg-muted" data-testid="anh-loi">{loi}</p>}
        </div>
      </div>

      {kq && (
        <div className="relative mt-6 rounded-2xl border border-line/70 bg-bg/60 p-4 sm:p-5" data-testid="anh-goi-y">
          {kq.luu_y.map((l, i) => <p key={i} className="mb-1 text-xs text-fg-muted">{l}</p>)}
          {kq.tra_loi.length === 0 ? (
            <p className="text-sm text-fg-muted">Máy chưa chắc nét nào — bạn tự soi gương ở <a href="#khao-sat" className="text-gold underline">Khảo sát</a> nhé.</p>
          ) : (
            <>
              <p className="flex items-center gap-2 font-serif text-lg text-fg"><Sparkles className="size-4 text-gold" aria-hidden /> Máy thấy {kq.tra_loi.length} nét — bạn xác nhận</p>
              <p className="mt-1 text-xs text-fg-muted">Bỏ tích nét nào bạn thấy chưa đúng; nét còn lại điền vào khảo sát, bạn vẫn sửa được ở dưới.</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {kq.tra_loi.map((x) => {
                  const c = cau[x.cau]!, nhan = c.lua_chon.find((l) => l.ma === x.lua_chon)?.nhan ?? x.lua_chon;
                  return (
                    <li key={x.cau}>
                      <label className={cn("flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm", chon[x.cau] ? "border-gold/50 bg-gold/[0.06]" : "border-line/60")}>
                        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={Boolean(chon[x.cau])} onChange={(e) => setChon((s) => ({ ...s, [x.cau]: e.target.checked }))} />
                        <span><span className="text-fg-muted">{c.hoi}</span> <b className="text-fg">{nhan}</b> <span className="text-xs text-fg-faint">({Math.round(x.do_tin * 100)}%)</span></span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {daDung === null
                  ? <Button onClick={dung} data-testid="anh-dung"><Check aria-hidden /> Dùng {Object.values(chon).filter(Boolean).length} nét đã tích</Button>
                  : <>
                    <span className="text-sm text-jade" data-testid="anh-da-dung">Đã điền {daDung} nét vào khảo sát.</span>
                    <Button onClick={onXem} disabled={dangXem} data-testid="anh-xem-bai-doc">{dangXem ? "Đang đọc…" : "Xem bài đọc ngay"}</Button>
                    <a href="#khao-sat" className="text-sm text-gold underline underline-offset-4">Bổ sung thêm câu</a>
                  </>}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
