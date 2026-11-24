"use client";
// PT-V2 v3 — "Để máy đọc ảnh (thử nghiệm)": người dùng chọn hoặc chụp liên tiếp 1–6 ảnh góc nhà, xem trước & bỏ ảnh nhạy cảm,
// TỰ TÍCH đồng ý (không tích sẵn; tự bỏ tích sau MỖI lần gửi) gửi ảnh tới dịch vụ AI bên thứ ba qua máy chủ tính toán → máy
// trả dấu hiệu GỢI Ý kèm độ tin + lý do + ảnh bằng chứng (`anh_so`) + phòng của từng ảnh; người dùng bấm Đúng / Không từng
// dòng, hệ thống mới luận.
// Ảnh thu nhỏ trên trình duyệt (lib/anh-nha.ts: bỏ EXIF, ≤ 1280 px, tổng ≤ 3,6 triệu ký tự base64), xem trước là `blob:` trên
// máy; không lưu ảnh ở đâu. `anh_so` trỏ vào danh sách ĐÃ GỬI → kết quả giữ kèm bản chụp danh sách ấy (người dùng bỏ / thêm
// ảnh sau đó không làm lệch ảnh bằng chứng). CHỈ có ở bản Việt (bản Anh không gửi ảnh cho AI — KhaoSatNha ẩn khối này).
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/khung/Lien";
import { Camera, Check, ImagePlus, ScanEye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { chuanBiAnhGui, SO_ANH_TOI_DA } from "@/lib/anh-nha";
import { ghi } from "@/lib/do-luong";
import { appNhung } from "@/lib/trinh-duyet-nhung";
import { cn } from "@/lib/utils";

export interface KqDocAnh {
  da_bat: boolean;
  ly_do_tat: null | "chua_dat_khoa" | "het_luot" | "loi_dich_vu";
  dau_hieu: { ma: string; co: boolean; do_tin: number; ly_do: string; anh_so?: number; phong?: string }[];
  phong_doan: { phong: string; do_tin: number }[];
  /** Phòng của TỪNG ảnh đã gửi (`so` bắt đầu từ 1). */
  anh?: { so: number; phong: string; do_tin: number }[];
  /** Mã phòng chính (cửa chính / bếp / phòng ngủ chính) chưa có ảnh nào. */
  goc_thieu?: string[];
  luu_y: string[];
  can_xac_nhan: true;
}

const MA_GOC = ["mat_tien", "phong_khach", "bep", "phong_ngu", "ban_tho", "wc", "khac"] as const;
type AnhChon = { id: number; tep: File; url: string };
type DauHieu = KqDocAnh["dau_hieu"][number];
/** Kết quả + bản chụp danh sách ảnh ĐÃ GỬI (thứ tự gửi) — `anh_so` / `anh[].so` tra vào `gui`. */
type KetQua = { d: KqDocAnh; gui: AnhChon[] };

function doTinKhoa(d: number): "cao" | "vua" | "thap" { return d >= 0.7 ? "cao" : d >= 0.4 ? "vua" : "thap"; }

export function DocAnhNha({ cauHoi, tenPhong, loaiNha, yDinh, anhGoiY, dau, daTraLoi, onXacNhan }: {
  /** mã dấu hiệu → câu hỏi của ô (danh mục máy chủ trả) — mã lạ không hiện câu hỏi riêng. */
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
  const { c: t } = useChuPT();
  const [anh, setAnh] = useState<AnhChon[]>([]);
  const [dongY, setDongY] = useState(false);
  const [goc, setGoc] = useState("");
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState<KetQua | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [dangCam, setDangCam] = useState(false);
  const [camSan, setCamSan] = useState(false);
  const [loiCam, setLoiCam] = useState<string | null>(null);
  const [nhung, setNhung] = useState(false);
  const [xemTo, setXemTo] = useState<string | null>(null);

  // Danh sách ảnh hiện tại: MỘT đường ghi (datAnh) cập nhật cả ref lẫn state → hàm xử lý đọc ref, không cần updater có tác dụng phụ.
  const anhRef = useRef<AnhChon[]>([]);
  const soId = useRef(0);
  const urlSong = useRef<Set<string>>(new Set());
  const song = useRef(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const theHeCam = useRef(0);

  const datAnh = useCallback((ds: AnhChon[]) => { anhRef.current = ds; setAnh(ds); }, []);

  const tatCamera = useCallback(() => {
    theHeCam.current += 1;                     // lượt xin camera đang chờ (nếu có) thành "cũ" → về tới nơi sẽ tự tắt
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setDangCam(false); setCamSan(false);
  }, []);

  // Thu hồi `blob:` không còn ai dùng (không nằm trong danh sách đang chọn, cũng không nằm trong bản chụp của kết quả).
  useEffect(() => {
    const can = new Set<string>([...anh.map((a) => a.url), ...(kq?.gui ?? []).map((a) => a.url)]);
    for (const u of [...urlSong.current]) if (!can.has(u)) { URL.revokeObjectURL(u); urlSong.current.delete(u); }
  }, [anh, kq]);

  // Rời trang: tắt camera ngay; thu hồi blob sau một nhịp (StrictMode gắn – gỡ – gắn lại thì không thu hồi oan).
  useEffect(() => {
    song.current = true;
    const urls = urlSong.current;
    return () => {
      song.current = false;
      theHeCam.current += 1;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      window.setTimeout(() => {
        if (song.current) return;
        urls.forEach((u) => URL.revokeObjectURL(u));
        urls.clear();
      }, 0);
    };
  }, []);

  // Trang bị ẩn (đổi tab, khoá máy) → tắt camera.
  useEffect(() => {
    const an = () => { if (document.visibilityState === "hidden" && streamRef.current) tatCamera(); };
    document.addEventListener("visibilitychange", an);
    return () => document.removeEventListener("visibilitychange", an);
  }, [tatCamera]);

  // Trình duyệt nhúng trong app khác (Facebook, Zalo…): camera trực tiếp hay bị chặn → ẩn nút, nói rõ; ô chọn ảnh vẫn dùng được.
  useEffect(() => { setNhung(appNhung(navigator.userAgent) !== null); }, []);

  // Gắn luồng camera vào thẻ video SAU khi khung camera đã vẽ.
  useEffect(() => {
    if (!dangCam) return;
    const v = videoRef.current;
    if (!v || !streamRef.current) return;
    v.srcObject = streamRef.current;
    void v.play().catch(() => { /* trình duyệt chặn tự phát — người dùng vẫn thấy khung, nút chụp chờ có hình */ });
  }, [dangCam]);

  const dsGoc = MA_GOC.map((k) => t(`da.goc.${k}`));

  const them = useCallback((teps: File[]) => {
    const ds = anhRef.current;
    const moi = teps.filter((f) => f.type.startsWith("image/") && !ds.some((a) => a.tep === f)).slice(0, Math.max(0, SO_ANH_TOI_DA - ds.length));
    if (!moi.length) return;
    const capNhat = [...ds, ...moi.map((tep) => {
      const url = URL.createObjectURL(tep);
      urlSong.current.add(url);
      return { id: ++soId.current, tep, url };
    })];
    datAnh(capNhat);
    setThongBao(null);
    if (capNhat.length >= SO_ANH_TOI_DA) tatCamera();
  }, [datAnh, tatCamera]);

  useEffect(() => { if (anhGoiY) them([anhGoiY]); }, [anhGoiY, them]);

  const bo = (id: number) => {
    if (dang) return;
    datAnh(anhRef.current.filter((a) => a.id !== id));
  };

  const moCamera = async () => {
    setLoiCam(null);
    if (dangCam) { tatCamera(); return; }
    if (dang || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      if (!dang) setLoiCam(t("da.loi_cam"));
      return;
    }
    const luot = ++theHeCam.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      if (luot !== theHeCam.current || !song.current) {      // người dùng đã đóng / rời trang trong lúc chờ cấp quyền
        stream.getTracks().forEach((tr) => tr.stop());
        return;
      }
      streamRef.current = stream;
      setCamSan(false);
      setDangCam(true);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh_mo_cam" });
    } catch {
      if (luot === theHeCam.current && song.current) setLoiCam(t("da.loi_cam"));
    }
  };

  const kiemCamSan = () => {
    const v = videoRef.current;
    setCamSan(Boolean(v && v.readyState >= 2 && v.videoWidth > 0));
  };

  const chupTuCamera = async () => {
    const v = videoRef.current;
    if (!v || anhRef.current.length >= SO_ANH_TOI_DA) return;
    if (v.readyState < 2 || !v.videoWidth || !v.videoHeight) { setCamSan(false); return; }   // chưa có hình → không chụp khung đen
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    if (!blob || !song.current) return;
    const so = anhRef.current.length + 1;
    them([new File([blob], `goc-nha-${Date.now()}-${so}.jpg`, { type: "image/jpeg" })]);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh_chup_live", so_anh: so });
  };

  const doc = async () => {
    const gui = anhRef.current;
    if (!dongY || !gui.length || dang) return;
    tatCamera();
    setDang(true); setThongBao(null);
    let daGui = false;
    try {
      const anhGui = await chuanBiAnhGui(gui.map((a) => a.tep));
      if (!song.current) return;
      daGui = true;
      const r = await fetch("/api/phongthuy/doc-anh", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          anh: anhGui,
          goc: gui.length === 1 ? (goc || null) : null,        // nhiều ảnh: máy tự nhận phòng từng ảnh
          loai_nha: loaiNha || null,
          y_dinh: yDinh,
        }),
      });
      const d = (await r.json().catch(() => null)) as KqDocAnh | null;
      if (!song.current) return;
      if (!r.ok || !d || typeof d.da_bat !== "boolean") {
        setThongBao(t("da.tat.loi_dich_vu"));
        ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh", so_anh: gui.length, so_dau_hieu: 0, da_bat: 0 });
        return;
      }
      const dh = (d.dau_hieu ?? []).filter((x) => x.co && /^[a-z0-9_]{2,40}$/.test(x.ma));
      if (!d.da_bat) {
        setKq(null);
        setThongBao(t(`da.tat.${d.ly_do_tat ?? "loi_dich_vu"}`));
      } else {
        setXemTo(null);
        setKq({ gui, d: { ...d, dau_hieu: dh, phong_doan: d.phong_doan ?? [], anh: d.anh ?? [], goc_thieu: d.goc_thieu ?? [], luu_y: d.luu_y ?? [] } });
      }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh", so_anh: gui.length, so_dau_hieu: dh.length, da_bat: d.da_bat ? 1 : 0 });
    } catch {
      if (song.current) setThongBao(t("da.tat.loi_dich_vu"));
    } finally {
      if (song.current) {
        setDang(false);
        if (daGui) setDongY(false);            // mỗi lần gửi ảnh là một lần tự tích
      }
    }
  };

  // ---- đọc kết quả theo bản chụp danh sách ĐÃ GỬI
  const anhGuiSo = (so: number | undefined): AnhChon | undefined =>
    kq && typeof so === "number" && Number.isInteger(so) && so >= 1 && so <= kq.gui.length ? kq.gui[so - 1] : undefined;
  const phongCuaAnh = new Map<number, string>();      // id ảnh → mã phòng máy nhận
  for (const a of kq?.d.anh ?? []) {
    const g = anhGuiSo(a.so);
    if (g && tenPhong[a.phong]) phongCuaAnh.set(g.id, a.phong);
  }
  const nhom: { phong: string | null; ds: DauHieu[] }[] = [];
  for (const x of kq?.d.dau_hieu ?? []) {
    const p = x.phong && tenPhong[x.phong] ? x.phong : null;
    const n = nhom.find((g) => g.phong === p);
    if (n) n.ds.push(x); else nhom.push({ phong: p, ds: [x] });
  }
  nhom.sort((a, b) => Number(a.phong === null) - Number(b.phong === null));
  const coNhomPhong = nhom.some((g) => g.phong !== null);

  const motAnh = kq?.gui.length === 1;
  const maPhongDoan = motAnh ? (kq?.d.anh?.[0]?.phong ?? kq?.d.phong_doan[0]?.phong) : undefined;
  const tenPhongDoan = maPhongDoan ? (tenPhong[maPhongDoan] ?? null) : null;
  const thieu = (kq?.d.goc_thieu ?? []).map((p) => tenPhong[p]).filter((x): x is string => Boolean(x));
  const hienThieu = Boolean(kq && kq.gui.length >= 1 && anh.length < SO_ANH_TOI_DA && thieu.length);
  const ketQuaCu = Boolean(kq && (kq.gui.length !== anh.length || kq.gui.some((g, i) => anh[i]?.id !== g.id)));
  const day = anh.length >= SO_ANH_TOI_DA;

  const mucTo = xemTo ? kq?.d.dau_hieu.find((x) => x.ma === xemTo) : undefined;
  const anhTo = mucTo ? anhGuiSo(mucTo.anh_so) : undefined;

  const nutXacNhan = (x: DauHieu, viTri: "dong" | "to") => {
    const tl = daTraLoi[x.ma];
    const hau = viTri === "to" ? "-to" : "";
    return (
      <div className="mt-1.5 flex gap-1.5">
        <button type="button" onClick={() => onXacNhan(x.ma, true)} aria-pressed={tl === true} data-testid={`doc-anh-dung${hau}-${x.ma}`}
          className={cn("inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 text-xs", tl === true && dau.has(x.ma) ? "border-moon bg-moon/15 text-fg" : "border-line text-fg-muted hover:text-fg")}><Check className="size-3" aria-hidden /> {t("da.dung")}</button>
        <button type="button" onClick={() => onXacNhan(x.ma, false)} aria-pressed={tl === false} data-testid={`doc-anh-khong${hau}-${x.ma}`}
          className={cn("inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 text-xs", tl === false ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}><X className="size-3" aria-hidden /> {t("da.khong")}</button>
      </div>
    );
  };

  const dongDauHieu = (x: DauHieu) => {
    const dtKhoa = doTinKhoa(x.do_tin);
    const anhNguon = anhGuiSo(x.anh_so);
    return (
      <li key={x.ma} className="flex items-start gap-3 rounded-lg border border-line/60 bg-surface/40 px-3 py-2 text-sm" data-testid={`doc-anh-dong-${x.ma}`}>
        {anhNguon && (
          <button type="button" data-testid={`doc-anh-bang-chung-${x.ma}`} aria-label={t("da.phong_to", { so: String(x.anh_so) })}
            onClick={() => { setXemTo(x.ma); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh_phong_to", ma: x.ma }); }}
            className="shrink-0 rounded-md text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob bằng chứng trên máy người dùng */}
            <img src={anhNguon.url} alt="" data-anh-id={anhNguon.id} className="size-12 rounded-md border border-gold/40 object-cover" />
            <span className="mt-0.5 block text-[10px] text-gold">{t("da.tu_anh_so", { so: String(x.anh_so) })}</span>
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-fg">{cauHoi[x.ma] ?? x.ma.replace(/_/g, " ")}</p>
          <p className="mt-0.5 text-xs text-fg-faint">
            <span className={cn("mr-1.5 rounded-full border px-1.5 py-px", dtKhoa === "cao" ? "border-gold/60 text-gold" : dtKhoa === "vua" ? "border-line text-fg-muted" : "border-line/60 text-fg-faint")}>
              {t("da.do_tin", { dt: t(`da.tin.${dtKhoa}`) })}
            </span>
            {x.ly_do}
          </p>
          {nutXacNhan(x, "dong")}
        </div>
      </li>
    );
  };

  return (
    <div id="doc-anh-nha" className="scroll-mt-24 rounded-xl border border-line/70 bg-bg/30 p-3" data-testid="doc-anh-nha">
      <p className="flex items-center gap-2 text-sm font-medium text-fg"><ScanEye className="size-4 text-gold" aria-hidden /> {t("da.tieu_de")}</p>
      <p className="mt-1 text-xs text-fg-muted">{t("da.mo_ta")}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <label className={cn("inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-1 text-fg-muted hover:text-fg focus-within:outline focus-within:outline-2 focus-within:outline-gold", (day || dang) && "pointer-events-none opacity-50")}>
          <ImagePlus className="size-3.5" aria-hidden /> {anh.length ? t("da.them_anh") : t("da.chon_anh")}
          <input type="file" accept="image/*" multiple className="sr-only" aria-label={t("da.chon_aria")} disabled={day || dang}
            onChange={(e) => { them(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        </label>
        {!nhung && (
          <button
            type="button"
            onClick={() => void moCamera()}
            disabled={(day && !dangCam) || dang}
            aria-pressed={dangCam}
            data-testid="doc-anh-mo-cam"
            className={cn(
              "inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 transition-colors disabled:pointer-events-none disabled:opacity-50",
              dangCam ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
            )}
          >
            <Camera className="size-3.5" aria-hidden /> {dangCam ? t("da.dong_cam") : t("da.chup_live")}
          </button>
        )}
        {anh.length === 1 && (
          <select aria-label={t("da.goc_aria")} value={goc} onChange={(e) => setGoc(e.target.value)} className="h-9 rounded-full border border-line bg-surface/60 px-2.5 text-xs">
            <option value="">{t("da.goc_chon")}</option>
            {[...dsGoc, ...(goc && !dsGoc.includes(goc) ? [goc] : [])].map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
        <span className="text-fg-faint" data-testid="doc-anh-dem">{t("da.so_anh", { so: String(anh.length), toi_da: String(SO_ANH_TOI_DA) })}</span>
      </div>

      {nhung && <p className="mt-2 text-xs text-fg-muted" data-testid="doc-anh-cam-nhung">{t("da.cam_nhung")}</p>}
      {loiCam && <p className="mt-2 text-xs text-moon" data-testid="doc-anh-loi-cam">{loiCam}</p>}

      {dangCam && (
        <div className="mt-2.5 space-y-2 rounded-xl border border-gold/40 bg-bg/60 p-2.5" data-testid="doc-anh-khung-cam">
          <video ref={videoRef} playsInline muted onLoadedData={kiemCamSan} onCanPlay={kiemCamSan} onPlaying={kiemCamSan}
            className="max-h-56 w-full rounded-lg bg-black object-cover" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" size="sm" onClick={() => void chupTuCamera()} disabled={!camSan || day} data-testid="doc-anh-bam-chup">
              <Camera className="mr-1 size-3.5" aria-hidden /> {camSan ? t("da.bam_chup") : t("da.cam_cho")} ({anh.length}/{SO_ANH_TOI_DA})
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={tatCamera}>
              {t("da.dong_cam")}
            </Button>
          </div>
        </div>
      )}

      {anh.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-x-2.5 gap-y-2" aria-label={t("da.ds_aria")} data-testid="doc-anh-ds">
          {anh.map((a, i) => {
            const p = phongCuaAnh.get(a.id);
            return (
              <li key={a.id} className="w-16" data-anh-id={a.id}>
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng, không qua next/image */}
                  <img src={a.url} alt={t("da.anh_alt", { so: String(i + 1) })} className="size-16 rounded-lg border border-line object-cover" />
                  <span className="absolute bottom-0.5 left-0.5 rounded bg-bg/85 px-1 text-[10px] font-medium text-fg" aria-hidden>#{i + 1}</span>
                  <button type="button" onClick={() => bo(a.id)} disabled={dang} aria-label={t("da.bo_anh", { so: String(i + 1) })}
                    className="absolute -right-2.5 -top-2.5 inline-flex size-9 items-center justify-center text-fg-faint hover:text-fg disabled:opacity-40">
                    <span className="rounded-full border border-line bg-bg p-0.5"><X className="size-3" aria-hidden /></span>
                  </button>
                </div>
                {p && <span className="mt-1 block truncate rounded-full border border-gold/40 px-1 text-center text-[10px] text-gold" title={tenPhong[p]} data-testid="doc-anh-chip-phong">{tenPhong[p]}</span>}
              </li>
            );
          })}
        </ul>
      )}

      <label className="mt-3 flex items-start gap-2 text-xs text-fg-muted">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={dongY} onChange={(e) => setDongY(e.target.checked)} data-testid="doc-anh-dong-y" />
        <span>{t("da.dong_y")}{" "}
          <Link href="/chinh-sach-rieng-tu#ben-thu-ba" className="text-gold underline">{t("da.chinh_sach")}</Link></span>
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" onClick={() => void doc()} disabled={!dongY || !anh.length || dang} data-testid="doc-anh-nut"><ScanEye aria-hidden /> {dang ? t("da.dang_doc") : t("da.nut_doc")}</Button>
        <p className="text-xs text-fg-muted" aria-live="polite" data-testid={thongBao ? "doc-anh-thong-bao" : undefined}>{thongBao}</p>
      </div>

      {kq && (
        <div className="mt-3 space-y-2" data-testid="doc-anh-ket-qua">
          {ketQuaCu && <p className="text-xs text-fg-faint" data-testid="doc-anh-kq-cu">{t("da.anh_cu")}</p>}
          {tenPhongDoan && (
            <p className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">{t("da.co_ve_la")}<b className="text-fg">{tenPhongDoan}</b>.
              {anh.length === 1 && goc !== tenPhongDoan && <button type="button" onClick={() => setGoc(tenPhongDoan)} className="min-h-9 rounded-full border border-line px-2.5 py-0.5 hover:text-fg" data-testid="doc-anh-dung-goc">{t("da.dung_goc")}</button>}
            </p>
          )}
          {kq.d.dau_hieu.length ? (
            <>
              <p className="text-sm font-medium text-fg">{t("da.may_thay")}</p>
              {nhom.map((g) => (
                <div key={g.phong ?? "_"} className="space-y-1.5" data-testid={`doc-anh-nhom-${g.phong ?? "khac"}`}>
                  {coNhomPhong && <p className="text-xs font-medium uppercase tracking-wider text-gold">{g.phong ? tenPhong[g.phong] : t("da.nhom_khac")}</p>}
                  <ul className="space-y-2">{g.ds.map(dongDauHieu)}</ul>
                </div>
              ))}
            </>
          ) : <p className="text-sm text-fg-muted">{t("da.chua_thay")}</p>}
          {hienThieu && <p className="text-xs text-fg-muted" data-testid="doc-anh-goc-thieu">{t("da.goc_thieu", { phong: thieu.join(", ") })}</p>}
          {kq.d.luu_y.map((l) => <p key={l} className="text-xs text-fg-faint">{l}</p>)}
        </div>
      )}
      <p className="mt-2 text-xs text-fg-faint">{t("da.chan")}</p>

      <Sheet open={Boolean(mucTo && anhTo)} onOpenChange={(mo) => { if (!mo) setXemTo(null); }}>
        {mucTo && anhTo && (
          <SheetContent title={t("da.xem_to")} data-testid="doc-anh-xem-to">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng */}
            <img src={anhTo.url} alt={t("da.xem_to_alt", { so: String(mucTo.anh_so) })} data-anh-id={anhTo.id}
              className="mx-auto max-h-[55dvh] w-auto max-w-full rounded-lg border border-line object-contain" />
            <p className="mt-3 text-sm text-fg">{cauHoi[mucTo.ma] ?? mucTo.ma.replace(/_/g, " ")}</p>
            {mucTo.ly_do && <p className="mt-1 text-xs text-fg-muted">{mucTo.ly_do}</p>}
            {nutXacNhan(mucTo, "to")}
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
