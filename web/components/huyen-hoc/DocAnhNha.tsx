"use client";
// PT-V2 v2 — "Để máy đọc ảnh (thử nghiệm)": người dùng chọn hoặc chụp liên tiếp 1–6 ảnh góc nhà, xem trước & xoá ảnh nhạy cảm,
// TỰ TÍCH đồng ý (không tích sẵn) gửi ảnh tới dịch vụ AI bên thứ ba qua engine → máy trả dấu hiệu GỢI Ý kèm độ tin + lý do +
// chỉ số ảnh bằng chứng (`anh_so`); người dùng bấm Đúng / Không từng dòng, hệ thống mới luận.
// Ảnh thu nhỏ trên trình duyệt (lib/anh-nha.ts: bỏ EXIF, ≤ 1280 px, ngân sách thích ứng tổng ≤ 3,6M base64), xem trước là `blob:`
// trên máy; không lưu ảnh ở đâu (kể cả base64 trong hồ sơ nhà). Hỗ trợ cả bản Việt và bản Anh (/en/feng-shui).
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/khung/Lien";
import { Camera, Check, ImagePlus, ScanEye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { chuanBiAnhGui, SO_ANH_TOI_DA } from "@/lib/anh-nha";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

export interface KqDocAnh {
  da_bat: boolean;
  ly_do_tat: null | "chua_dat_khoa" | "het_luot" | "loi_dich_vu";
  dau_hieu: { ma: string; co: boolean; do_tin: number; ly_do: string; anh_so?: number }[];
  phong_doan: { phong: string; do_tin: number }[];
  luu_y: string[];
  can_xac_nhan: true;
}

const MA_GOC = ["mat_tien", "phong_khach", "bep", "phong_ngu", "ban_tho", "wc", "khac"] as const;
type AnhChon = { tep: File; url: string };

export function doTinChu(d: number): "cao" | "vừa" | "thấp" { return d >= 0.7 ? "cao" : d >= 0.4 ? "vừa" : "thấp"; }
function doTinKhoa(d: number): "cao" | "vua" | "thap" { return d >= 0.7 ? "cao" : d >= 0.4 ? "vua" : "thap"; }

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
  const { c: t, en } = useChuPT();
  const [anh, setAnh] = useState<AnhChon[]>([]);
  const [dongY, setDongY] = useState(false);
  const [goc, setGoc] = useState("");
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState<KqDocAnh | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [dangCam, setDangCam] = useState(false);
  const [loiCam, setLoiCam] = useState<string | null>(null);

  const anhRef = useRef<AnhChon[]>([]);
  anhRef.current = anh;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const tatCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setDangCam(false);
  }, []);

  useEffect(() => () => {
    tatCamera();
    anhRef.current.forEach((a) => URL.revokeObjectURL(a.url));
  }, [tatCamera]);

  const dsGoc = MA_GOC.map((k) => t(`da.goc.${k}`));

  const them = useCallback((teps: File[]) => {
    setAnh((ds) => {
      const moi = teps.filter((f) => f.type.startsWith("image/") && !ds.some((a) => a.tep === f)).slice(0, Math.max(0, SO_ANH_TOI_DA - ds.length));
      if (!moi.length) return ds;
      const capNhat = [...ds, ...moi.map((tep) => ({ tep, url: URL.createObjectURL(tep) }))];
      if (capNhat.length >= SO_ANH_TOI_DA) tatCamera();
      return capNhat;
    });
    setKq(null); setThongBao(null);
  }, [tatCamera]);

  useEffect(() => { if (anhGoiY) them([anhGoiY]); }, [anhGoiY, them]);
  const bo = (i: number) => {
    setAnh((ds) => {
      const a = ds[i];
      if (a) URL.revokeObjectURL(a.url);
      return ds.filter((_, j) => j !== i);
    });
    setKq(null);
  };

  const moCamera = async () => {
    setLoiCam(null);
    if (dangCam) { tatCamera(); return; }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setLoiCam(t("da.loi_cam"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setDangCam(true);
      window.requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      });
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh_mo_cam" });
    } catch {
      setLoiCam(t("da.loi_cam"));
    }
  };

  const chupTuCamera = async () => {
    const v = videoRef.current;
    if (!v || anh.length >= SO_ANH_TOI_DA) return;
    const w = v.videoWidth || 640;
    const h = v.videoHeight || 480;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    if (!blob) return;
    const file = new File([blob], `goc-nha-${anh.length + 1}.jpg`, { type: "image/jpeg" });
    them([file]);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh_chup_live", so_anh: anh.length + 1 });
  };

  const doc = async () => {
    if (!dongY || !anh.length || dang) return;
    setDang(true); setKq(null); setThongBao(null);
    try {
      const anhGui = await chuanBiAnhGui(anh.map((a) => a.tep));
      const r = await fetch("/api/phongthuy/doc-anh", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          anh: anhGui,
          goc: goc || null,
          loai_nha: loaiNha || null,
          y_dinh: yDinh,
          ...(en ? { ngon_ngu: "en" } : {}),
        }),
      });
      const d = (await r.json().catch(() => null)) as KqDocAnh | null;
      if (!r.ok || !d || typeof d.da_bat !== "boolean") {
        setThongBao(t("da.tat.loi_dich_vu"));
        ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh", so_anh: anh.length, so_dau_hieu: 0, da_bat: 0 });
        return;
      }
      const dh = (d.dau_hieu ?? []).filter((x) => x.co && /^[a-z0-9_]{2,40}$/.test(x.ma));
      if (!d.da_bat) {
        const maTat = d.ly_do_tat ?? "loi_dich_vu";
        setThongBao(t(`da.tat.${maTat}`));
      } else {
        setKq({ ...d, dau_hieu: dh, phong_doan: d.phong_doan ?? [], luu_y: d.luu_y ?? [] });
      }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh", so_anh: anh.length, so_dau_hieu: dh.length, da_bat: d.da_bat ? 1 : 0 });
    } catch {
      setThongBao(t("da.tat.loi_dich_vu"));
    } finally { setDang(false); }
  };
  const phong = kq?.phong_doan[0];
  const tenPhongDoan = phong ? (tenPhong[phong.phong] ?? phong.phong) : null;

  return (
    <div id="doc-anh-nha" className="scroll-mt-24 rounded-xl border border-line/70 bg-bg/30 p-3" data-testid="doc-anh-nha">
      <p className="flex items-center gap-2 text-sm font-medium text-fg"><ScanEye className="size-4 text-gold" aria-hidden /> {t("da.tieu_de")}</p>
      <p className="mt-1 text-xs text-fg-muted">{t("da.mo_ta")}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <label className={cn("inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-2.5 py-1 text-fg-muted hover:text-fg", anh.length >= SO_ANH_TOI_DA && "pointer-events-none opacity-50")}>
          <ImagePlus className="size-3.5" aria-hidden /> {anh.length ? t("da.them_anh") : t("da.chon_anh")}
          <input type="file" accept="image/*" multiple className="sr-only" aria-label={t("da.chon_aria")} disabled={anh.length >= SO_ANH_TOI_DA}
            onChange={(e) => { them(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        </label>
        <button
          type="button"
          onClick={() => void moCamera()}
          disabled={anh.length >= SO_ANH_TOI_DA && !dangCam}
          data-testid="doc-anh-mo-cam"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition-colors",
            dangCam ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
            anh.length >= SO_ANH_TOI_DA && !dangCam && "pointer-events-none opacity-50",
          )}
        >
          <Camera className="size-3.5" aria-hidden /> {dangCam ? t("da.dong_cam") : t("da.chup_live")}
        </button>
        <select aria-label={t("da.goc_aria")} value={goc} onChange={(e) => setGoc(e.target.value)} className="h-8 rounded-full border border-line bg-surface/60 px-2.5 text-xs">
          <option value="">{t("da.goc_chon")}</option>
          {[...dsGoc, ...(goc && !dsGoc.includes(goc) ? [goc] : [])].map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="text-fg-faint" data-testid="doc-anh-dem">{t("da.so_anh", { so: String(anh.length), toi_da: String(SO_ANH_TOI_DA) })}</span>
      </div>

      {loiCam && <p className="mt-2 text-xs text-moon" data-testid="doc-anh-loi-cam">{loiCam}</p>}

      {dangCam && (
        <div className="mt-2.5 rounded-xl border border-gold/40 bg-bg/60 p-2.5 space-y-2" data-testid="doc-anh-khung-cam">
          <video ref={videoRef} playsInline muted className="max-h-56 w-full rounded-lg bg-black object-cover" />
          <div className="flex items-center justify-between gap-2">
            <Button type="button" size="sm" onClick={() => void chupTuCamera()} disabled={anh.length >= SO_ANH_TOI_DA} data-testid="doc-anh-bam-chup">
              <Camera className="mr-1 size-3.5" aria-hidden /> {t("da.bam_chup")} ({anh.length}/{SO_ANH_TOI_DA})
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={tatCamera}>
              {t("da.dong_cam")}
            </Button>
          </div>
        </div>
      )}

      {anh.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label={t("da.ds_aria")}>
          {anh.map((a, i) => (
            <li key={a.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng, không qua next/image */}
              <img src={a.url} alt={t("da.anh_alt", { so: String(i + 1) })} className="size-16 rounded-lg border border-line object-cover" />
              <span className="absolute bottom-0.5 left-0.5 rounded bg-bg/85 px-1 text-[10px] font-medium text-fg">#{i + 1}</span>
              <button type="button" onClick={() => bo(i)} aria-label={t("da.bo_anh", { so: String(i + 1) })} className="absolute -right-1.5 -top-1.5 rounded-full border border-line bg-bg p-0.5 text-fg-faint hover:text-fg"><X className="size-3" aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}

      <label className="mt-3 flex items-start gap-2 text-xs text-fg-muted">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={dongY} onChange={(e) => setDongY(e.target.checked)} data-testid="doc-anh-dong-y" />
        <span>{t("da.dong_y")}{" "}
          <Link href={en ? "/en/privacy#ben-thu-ba" : "/chinh-sach-rieng-tu#ben-thu-ba"} className="text-gold underline">{t("da.chinh_sach")}</Link></span>
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" onClick={doc} disabled={!dongY || !anh.length || dang} data-testid="doc-anh-nut"><ScanEye aria-hidden /> {dang ? t("da.dang_doc") : t("da.nut_doc")}</Button>
        {thongBao && <p className="text-xs text-fg-muted" data-testid="doc-anh-thong-bao">{thongBao}</p>}
      </div>

      {kq && (
        <div className="mt-3 space-y-2" data-testid="doc-anh-ket-qua">
          {tenPhongDoan && (
            <p className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">{t("da.co_ve_la")}<b className="text-fg">{tenPhongDoan}</b>.
              {goc !== tenPhongDoan && <button type="button" onClick={() => setGoc(tenPhongDoan)} className="rounded-full border border-line px-2 py-0.5 hover:text-fg" data-testid="doc-anh-dung-goc">{t("da.dung_goc")}</button>}
            </p>
          )}
          {kq.dau_hieu.length ? (
            <>
              <p className="text-sm font-medium text-fg">{t("da.may_thay")}</p>
              <ul className="space-y-2">
                {kq.dau_hieu.map((x) => {
                  const tl = daTraLoi[x.ma];
                  const dtKhoa = doTinKhoa(x.do_tin);
                  const dtNhan = t(`da.tin.${dtKhoa}`);
                  const anhNguon = typeof x.anh_so === "number" && x.anh_so >= 1 && x.anh_so <= anh.length ? anh[x.anh_so - 1] : undefined;
                  return (
                    <li key={x.ma} className="flex items-start gap-3 rounded-lg border border-line/60 bg-surface/40 px-3 py-2 text-sm" data-testid={`doc-anh-dong-${x.ma}`}>
                      {anhNguon && (
                        <div className="shrink-0 text-center" data-testid={`doc-anh-bang-chung-${x.ma}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob bằng chứng trên máy người dùng */}
                          <img src={anhNguon.url} alt={t("da.tu_anh_so", { so: String(x.anh_so) })} className="size-12 rounded-md border border-gold/40 object-cover" />
                          <span className="mt-0.5 block text-[10px] text-gold">{t("da.tu_anh_so", { so: String(x.anh_so) })}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-fg">{cauHoi[x.ma] ?? x.ma.replace(/_/g, " ")}</p>
                        <p className="mt-0.5 text-xs text-fg-faint">
                          <span className={cn("mr-1.5 rounded-full border px-1.5 py-px", dtKhoa === "cao" ? "border-gold/60 text-gold" : dtKhoa === "vua" ? "border-line text-fg-muted" : "border-line/60 text-fg-faint")}>
                            {t("da.do_tin", { dt: dtNhan })}
                          </span>
                          {x.ly_do}
                        </p>
                        <div className="mt-1.5 flex gap-1.5">
                          <button type="button" onClick={() => onXacNhan(x.ma, true)} aria-pressed={tl === true} data-testid={`doc-anh-dung-${x.ma}`}
                            className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs", tl === true && dau.has(x.ma) ? "border-moon bg-moon/15 text-fg" : "border-line text-fg-muted hover:text-fg")}><Check className="size-3" aria-hidden /> {t("da.dung")}</button>
                          <button type="button" onClick={() => onXacNhan(x.ma, false)} aria-pressed={tl === false} data-testid={`doc-anh-khong-${x.ma}`}
                            className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs", tl === false ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}><X className="size-3" aria-hidden /> {t("da.khong")}</button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : <p className="text-sm text-fg-muted">{t("da.chua_thay")}</p>}
          {kq.luu_y.map((l) => <p key={l} className="text-xs text-fg-faint">{l}</p>)}
        </div>
      )}
      <p className="mt-2 text-xs text-fg-faint">{t("da.chan")}</p>
    </div>
  );
}
