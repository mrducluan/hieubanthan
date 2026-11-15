"use client";
import Link from "@/components/khung/Lien";
import { useEffect, useRef, useState } from "react";
import { useChuChung } from "@/components/cms/ChuChung";
import { ArrowRight, ChevronDown, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GIO_DAI_DIEN_KHONG_BIET, luuHoSo, moTaAm, ngayHopLe, NUOC_NGOAI, type HoSo } from "@/lib/hoso";
import { postJson } from "@/lib/goi-api";
import { useDanhSachTinh } from "@/lib/dia-ly";
import { cacVungIana, nhanUtc, useDanhSachNuoc, vungMay, type KetQuaMuiGio } from "@/lib/mui-gio";
import { ghi, layMaMoi, quenMaMoi } from "@/lib/do-luong";
import { ghiDongY, thuHoiDongY, useDongYDuLieu } from "@/lib/dong-y-du-lieu";
import { cn } from "@/lib/utils";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { useChuGiaoDien } from "@/components/khung/chu-giao-dien";
import { useDuong } from "@/components/khung/NgonNgu";
import { MUI_GIO_KHOA } from "@/lib/chu/giao-dien";

interface Props {
  macDinh?: HoSo | null;
  nutGui?: string;
  /** Mảng cần thêm: "day_du" = giờ sinh + giới tính + nơi sinh (Tử vi, Bát tự) · "gioi_tinh" (Phong thuỷ). */
  can?: "day_du" | "gioi_tinh";
  onXong: (h: HoSo) => void;
  className?: string;
}

interface KetQuaDoi {
  duong: { ngay: number; thang: number; nam: number };
  am: { ngay: number; thang: number; nam: number; nhuan: boolean };
  can_chi_nam: string;
  can_chi_ngay: string;
  can_chi_thang: string;
  thang_nhuan_nam: number | null;
  lich_mien_nam_utc8: boolean;
  /** TV-LICH: âm lịch theo lịch Trung Quốc (UTC+8) — sổ tử vi/phần mềm Trung Quốc đổi theo lịch này. */
  am_trung_quoc?: { ngay: number; thang: number; nam: number; nhuan: boolean };
  lech_lich_trung?: boolean;
  /** TP-LICH: cách đọc âm lịch Việt Nam của ngày dương đó (luôn có, kể cả khi nhập theo lịch Trung Quốc). */
  am_viet?: { ngay: number; thang: number; nam: number; nhuan: boolean };
}

/** QTE-2: giá trị ô "Nước" khi thành phố không có trong danh sách → chọn mã vùng IANA. */
const KHAC = "khac";

// EN-6 BI-3: múi giờ chuẩn hay gặp (giờ mùa hè đã có ô riêng) — giá trị là số giờ lệch UTC; chữ ở lib/chu/giao-dien.ts (MUI_GIO_KHOA).

// Nhập MỘT LẦN, dùng mọi mảng (docs/THIET-KE-UI.md §4.3). Chỉ tên + ngày sinh bắt buộc; phần còn lại
// hỏi đúng lúc mảng cần (can). Ngày âm do engine đổi — web không tự đổi lịch.
// ĐY-1: chưa có đồng ý xử lý dữ liệu (lib/dong-y-du-lieu) → khối đồng ý ngắn ngay trên nút, nút thành "Đồng ý và xem kết
// quả", và KHÔNG gửi gì lên máy chủ (kể cả xem trước đổi lịch) cho tới khi người dùng bấm. Đã đồng ý → nút như cũ + dòng
// "Bạn đã đồng ý · Thu hồi" (thu hồi = xoá đồng ý + hồ sơ trên máy). Không modal che trang, không ô tích sẵn.
/** EN-2 mục 5: chỉ hỏi tình trạng người đủ 18 tuổi tròn (review T1: so đủ ngày/tháng/năm — không thu dữ liệu của người
 *  17 tuổi sinh cuối năm). Chỉ lọc hiển thị; lời theo tuổi do engine chọn. */
function du18(nam: number, thang: number, ngay: number): boolean {
  if (!(nam > 1900 && thang >= 1 && thang <= 12 && ngay >= 1 && ngay <= 31)) return false;
  const h = new Date();
  const tuoi = h.getFullYear() - nam - ((h.getMonth() + 1 < thang || (h.getMonth() + 1 === thang && h.getDate() < ngay)) ? 1 : 0);
  return tuoi >= 18;
}

/** Ô đang gõ có thể là ngày ÂM (đi sau ngày dương ~1 tháng): cộng một tháng trước khi so — nghiêng về không hỏi sớm. Lúc
 *  lưu dùng ngày dương đã đổi (`dg`). */
function du18Nhap(lich: "duong" | "am", nam: number, thang: number, ngay: number): boolean {
  if (lich !== "am") return du18(nam, thang, ngay);
  return thang >= 12 ? du18(nam + 1, 1, ngay) : du18(nam, thang + 1, ngay);
}

export function NhapHoSo({ macDinh, nutGui, can, onXong, className }: Props) {
  const c = useChuChung();
  const { c: g, en } = useChuGiaoDien();
  const dd = useDuong();
  // EN-ALL: link sang trang chưa có bản Anh thì không hiện ở trang Anh (không đẩy người đọc sang chữ Việt giữa form).
  const coLink = (duongVi: string) => !en || dd(duongVi).startsWith("/en");
  const dongY = useDongYDuLieu();
  const coDongY = Boolean(dongY);
  const nhapAm = macDinh?.lich_nhap === "am" && macDinh.am;
  const [ten, setTen] = useState(macDinh?.ho_ten ?? "");
  const [lich, setLich] = useState<"duong" | "am">(nhapAm ? "am" : "duong");
  const [ngay, setNgay] = useState(macDinh ? String(nhapAm ? macDinh.am!.ngay : macDinh.ngay) : "");
  const [thang, setThang] = useState(macDinh ? String(nhapAm ? macDinh.am!.thang : macDinh.thang) : "");
  const [nam, setNam] = useState(macDinh ? String(nhapAm ? macDinh.am!.nam : macDinh.nam) : "");
  const [nhuan, setNhuan] = useState(Boolean(nhapAm && macDinh.am!.nhuan));
  const [lichAm, setLichAm] = useState<"viet" | "trung">(macDinh?.lich_am ?? "viet");
  const [moThem, setMoThem] = useState(Boolean(can) || Boolean(macDinh?.gio || macDinh?.ten_khac));
  const [tenKhac, setTenKhac] = useState(macDinh?.ten_khac ?? "");
  // "Không biết giờ": giờ lưu là giờ đại diện 12:00 — ô giờ để trống, người dùng nhập khi đã biết.
  const [gio, setGio] = useState(macDinh?.do_tin_gio === "unknown" ? "" : macDinh?.gio ?? "");
  const [doTin, setDoTin] = useState<string>(macDinh?.do_tin_gio ?? "exact");
  const [gioiTinh, setGioiTinh] = useState<string>(macDinh?.gioi_tinh ?? "");
  const [noiSinh, setNoiSinh] = useState<string>(macDinh?.noi_sinh ?? "");
  const [gioMuaHe, setGioMuaHe] = useState(Boolean(macDinh?.gio_mua_he));
  const [utcNoiSinh, setUtcNoiSinh] = useState(typeof macDinh?.utc_noi_sinh === "number" ? String(macDinh.utc_noi_sinh) : "");
  // QTE-2 giai đoạn 0: nước + thành phố nơi sinh (mã thành phố "us-san_jose" hoặc mã vùng IANA khi chọn "Khác").
  const [muiGio, setMuiGio] = useState<string>(macDinh?.mui_gio ?? "");
  const [nuoc, setNuoc] = useState<string>(macDinh?.mui_gio ? (macDinh.mui_gio.includes("/") ? KHAC : macDinh.mui_gio.slice(0, 2)) : "");
  const [kqMuiGio, setKqMuiGio] = useState<KetQuaMuiGio | null>(null);
  const [vung, setVung] = useState<string>(macDinh?.vung ?? "");
  // EN-2 mục 5: tình trạng tự chọn (chỉ trên máy). Giữ giá trị cũ cả khi ô không hiện ở trang đang mở.
  const [tinhTrang, setTinhTrang] = useState<string>(macDinh?.tinh_trang ?? "");
  const [doi, setDoi] = useState<KetQuaDoi | null>(null);
  const [loiDoi, setLoiDoi] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [moDongY, setMoDongY] = useState(false);
  const thangRef = useRef<HTMLInputElement>(null);
  const namRef = useRef<HTMLInputElement>(null);
  const { tinh, loi: loiTinh, thuLai: taiLaiTinh } = useDanhSachTinh();
  const { nuoc: dsNuoc, loi: loiNuoc, thuLai: taiLaiNuoc } = useDanhSachNuoc(noiSinh === NUOC_NGOAI);

  const d = Number(ngay), m = Number(thang), y = Number(nam);
  const duSo = d > 0 && m > 0 && nam.length === 4 && y >= 1900;
  const coTheDoi = duSo && (lich === "am" ? d <= 30 : ngayHopLe(d, m, y));
  const yeuCauDoi = coTheDoi
    ? { chieu: lich === "am" ? "am_sang_duong" : "duong_sang_am", ngay: d, thang: m, nam: y,
        ...(lich === "am" && nhuan ? { nhuan: true } : {}), ...(lich === "am" && lichAm === "trung" ? { lich: "trung" } : {}),
        ...(noiSinh ? { noi_sinh: noiSinh } : {}) }
    : null;
  const khoaDoi = yeuCauDoi ? JSON.stringify(yeuCauDoi) : null;

  // Xem trước lịch bên kia để người dùng đối chiếu giấy tờ (âm ↔ dương) — chỉ sau khi đã đồng ý gửi ngày sinh đi tính.
  useEffect(() => {
    setDoi(null); setLoiDoi(null);
    if (!khoaDoi || !coDongY) return;
    let huy = false;
    const t = setTimeout(() => {
      postJson<KetQuaDoi>("/api/lich/doi", JSON.parse(khoaDoi))
        .then((r) => { if (!huy) setDoi(r); })
        .catch((e: unknown) => { if (!huy) setLoiDoi(e instanceof Error && !en ? e.message : g("hs.loi_doi_lich")); });
    }, 300);
    return () => { huy = true; clearTimeout(t); };
  }, [khoaDoi, coDongY]);

  // Dòng xác nhận múi giờ lúc sinh (engine tra tzdata) — chỉ sau khi đã đồng ý gửi ngày giờ sinh đi tính; không lưu gì.
  const isoChoMuiGio = lich === "duong" && coTheDoi ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : doi?.duong
    ? `${doi.duong.nam}-${String(doi.duong.thang).padStart(2, "0")}-${String(doi.duong.ngay).padStart(2, "0")}` : null;
  const khoaMuiGio = noiSinh === NUOC_NGOAI && muiGio && isoChoMuiGio && /^\d{2}:\d{2}$/.test(gio) && coDongY
    ? JSON.stringify({ mui_gio: muiGio, ngay: isoChoMuiGio, gio }) : null;
  useEffect(() => {
    setKqMuiGio(null);
    if (!khoaMuiGio) return;
    let huy = false;
    const t = setTimeout(() => {
      postJson<KetQuaMuiGio>("/api/dia-ly/mui-gio/tai", JSON.parse(khoaMuiGio))
        .then((r) => { if (!huy) setKqMuiGio(r); })
        .catch(() => { /* chỉ là dòng xác nhận; engine tự tính lại khi lập lá số */ });
    }, 300);
    return () => { huy = true; clearTimeout(t); };
  }, [khoaMuiGio]);

  // Ý6: thành phố đã chọn mang cờ engine tính (`canh_bao_mat_troi`, `nam_ban_cau_kha_dung`) → một dòng gợi ý công tắc Trường
  // phái + link trang nước (Ý3). Web không tính gì; engine cũ không có cờ → không gợi ý. Đo chỉ mã (một lần mỗi thành phố).
  const tpChon = noiSinh === NUOC_NGOAI && nuoc && nuoc !== KHAC ? dsNuoc?.find((n) => n.ma === nuoc)?.thanh_pho.find((t) => t.ma === muiGio) ?? null : null;
  const goiYCongTac = tpChon && (tpChon.canh_bao_mat_troi || tpChon.nam_ban_cau_kha_dung)
    ? [tpChon.canh_bao_mat_troi ? g("hs.gy_mat_troi") : null, tpChon.nam_ban_cau_kha_dung ? g("hs.gy_mua") : null].filter((x): x is string => Boolean(x)) : [];
  const goiYDaGhi = useRef<string | null>(null);
  useEffect(() => {
    if (!tpChon || !goiYCongTac.length || goiYDaGhi.current === tpChon.ma) return;
    goiYDaGhi.current = tpChon.ma;
    ghi("chart_interacted", { kind: "goi_y_cong_tac_hien", thanh_pho: tpChon.ma, cong_tac: goiYCongTac.length });
  }, [tpChon, goiYCongTac.length]);
  const duong = lich === "duong" ? (coTheDoi ? { ngay: d, thang: m, nam: y } : null) : doi?.duong ?? null;
  const isoDuong = duong ? `${duong.nam}-${String(duong.thang).padStart(2, "0")}-${String(duong.ngay).padStart(2, "0")}` : null;
  const truoc1975 = isoDuong ? isoDuong < "1975-06-13" : false;
  const tinhChon = tinh?.find((t) => t.ma === noiSinh);
  const canVung = truoc1975 && tinhChon?.vung === null;   // Quảng Trị: vắt ngang vĩ tuyến 17

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    if (ten.trim().length < 2 || !/\p{L}/u.test(ten)) return setLoi(g("hs.loi_ten"));
    if (!coTheDoi) return setLoi(g("hs.loi_ngay", { lich: lich === "am" ? g("hs.am") : g("hs.duong") }));
    const khongBietGio = doTin === "unknown";
    if (can === "day_du" && ((!gio && !khongBietGio) || !gioiTinh || !noiSinh)) return setLoi(g("hs.loi_day_du"));
    if (can === "gioi_tinh" && !gioiTinh) return setLoi(g("hs.loi_gioi_tinh"));
    if (can === "day_du" && canVung && !vung) return setLoi(g("hs.loi_vung"));
    setLoi(null);
    // Bấm "Đồng ý và xem kết quả" = đồng ý rõ ràng cho mục đích tính tại chỗ; ghi TRƯỚC lượt gửi đầu tiên.
    if (!coDongY) ghiDongY();
    setDang(true);
    let kq = doi;
    try {
      if (!kq && yeuCauDoi) kq = await postJson<KetQuaDoi>("/api/lich/doi", yeuCauDoi);
    } catch (e2) {
      // Nhập dương lịch vẫn lưu được khi chưa đổi được sang âm; nhập âm thì bắt buộc phải đổi.
      if (lich === "am") { setDang(false); return setLoi(e2 instanceof Error && !en ? e2.message : g("hs.loi_doi_am")); }
    }
    setDang(false);
    const dg = lich === "am" ? kq!.duong : { ngay: d, thang: m, nam: y };
    if (Date.UTC(dg.nam, dg.thang - 1, dg.ngay) > Date.now()) return setLoi(g("hs.loi_chua_toi"));
    const nuocNgoai = noiSinh === NUOC_NGOAI;
    const h = luuHoSo({
      ho_ten: ten.trim(),
      ngay: dg.ngay, thang: dg.thang, nam: dg.nam,
      lich_nhap: lich,
      ...(lich === "am" && lichAm === "trung" ? { lich_am: "trung" as const } : {}),
      ...(kq ? { am: kq.am } : {}),
      ...(tenKhac.trim() ? { ten_khac: tenKhac.trim() } : {}),
      ...(khongBietGio ? { gio: GIO_DAI_DIEN_KHONG_BIET, do_tin_gio: "unknown" as const }
        : gio ? { gio, do_tin_gio: doTin === "approx" ? "approx" as const : "exact" as const } : {}),
      ...(gioiTinh === "nam" || gioiTinh === "nu" ? { gioi_tinh: gioiTinh } : {}),
      ...(noiSinh ? { noi_sinh: noiSinh } : {}),
      ...(nuocNgoai && gioMuaHe ? { gio_mua_he: true } : {}),
      ...(nuocNgoai && utcNoiSinh !== "" ? { utc_noi_sinh: Number(utcNoiSinh) } : {}),
      ...(nuocNgoai && muiGio ? { mui_gio: muiGio } : {}),
      ...(canVung && (vung === "north" || vung === "south") ? { vung } : {}),
      ...((tinhTrang === "doc_than" || tinhTrang === "co_doi") && du18(dg.nam, dg.thang, dg.ngay) ? { tinh_trang: tinhTrang } : {}),
      ...(macDinh?.tao_luc ? { tao_luc: macDinh.tao_luc } : {}),
    });
    if (!macDinh) {
      // reading_started ghi khi kết quả hiện ra ở từng mảng (lib/do-luong batDauDoc), không ghi ở đây.
      ghi("profile_created", { kind: "may", nuoc_ngoai: nuocNgoai });
      const ma = layMaMoi();
      if (ma) { ghi("referral_signup", { ma_moi: ma }); quenMaMoi(); }
    }
    onXong(h);
  }

  // Thu hồi đồng ý: xoá đồng ý + hồ sơ trên máy, form về trạng thái đầu (ô trống, chưa hỏi phần thêm).
  function thuHoi() {
    thuHoiDongY();
    setTen(""); setNgay(""); setThang(""); setNam(""); setNhuan(false); setLich("duong"); setLichAm("viet");
    setTenKhac(""); setGio(""); setDoTin("exact"); setGioiTinh(""); setNoiSinh(""); setGioMuaHe(false); setVung("");
    setUtcNoiSinh(""); setTinhTrang("");
    setMoThem(Boolean(can)); setDoi(null); setLoiDoi(null); setLoi(null);
  }

  const chiSo = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
  const tieuDeThem = can === "day_du" ? c("ho_so.them_day_du")
    : can === "gioi_tinh" ? c("ho_so.them_gioi_tinh") : c("ho_so.them_khong_bat_buoc");

  return (
    <form onSubmit={gui} className={cn("space-y-3 sm:space-y-5", className)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="ho-ten">{c("ho_so.ho_ten")}</Label>
        <Input id="ho-ten" name="ho-ten" autoComplete="name" value={ten} maxLength={80}
          onChange={(e) => setTen(e.target.value)} placeholder={c("ho_so.ho_ten_vi_du")} />
      </div>

      <fieldset className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-medium text-fg-muted">{c("ho_so.ngay_sinh")}</legend>
          <div role="radiogroup" aria-label={g("hs.loai_lich")} className="flex rounded-full border border-line p-0.5 text-xs">
            {(["duong", "am"] as const).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lich === l} onClick={() => setLich(l)}
                className={cn("vung-cham rounded-full px-3 py-1.5 transition-colors", lich === l ? "bg-gold text-bg" : "text-fg-muted hover:text-fg")}>
                {l === "duong" ? g("hs.duong_lich") : g("hs.am_lich")}
              </button>
            ))}
          </div>
        </div>
        {/* EN-ALL GĐ 4: người đọc Mỹ quen tháng trước ngày — bản Anh ghi rõ nhãn từng ô (thứ tự ô và dữ liệu gửi đi không đổi). */}
        {en && (
          <div className="-mb-1 grid grid-cols-[1fr_1fr_1.4fr] gap-2 text-center text-[0.7rem] uppercase tracking-wide text-fg-faint" aria-hidden data-testid="nhan-o-ngay">
            <span>{g("hs.ngay")}</span><span>{g("hs.thang")}</span><span>{g("hs.nam")}</span>
          </div>
        )}
        <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
          <Input aria-label={g("hs.ngay")} name="ngay-sinh-ngay" autoComplete={lich === "duong" ? "bday-day" : "off"} inputMode="numeric" placeholder={g("hs.ngay")} value={ngay} className="text-center"
            onChange={(e) => { const v = chiSo(e.target.value, 2); setNgay(v); if (v.length === 2) thangRef.current?.focus(); }} />
          <Input ref={thangRef} aria-label={g("hs.thang")} name="ngay-sinh-thang" autoComplete={lich === "duong" ? "bday-month" : "off"} inputMode="numeric" placeholder={g("hs.thang")} value={thang} className="text-center"
            onChange={(e) => { const v = chiSo(e.target.value, 2); setThang(v); if (v.length === 2) namRef.current?.focus(); }} />
          <Input ref={namRef} aria-label={g("hs.nam")} name="ngay-sinh-nam" autoComplete={lich === "duong" ? "bday-year" : "off"} inputMode="numeric" placeholder={g("hs.nam")} value={nam} className="text-center"
            onChange={(e) => setNam(chiSo(e.target.value, 4))} />
        </div>
        {lich === "am" && (
          <div role="radiogroup" aria-label={g("hs.am_theo")} className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <span>{g("hs.am_theo_chu")}</span>
            {([["viet", g("hs.am_viet")], ["trung", g("hs.am_trung")]] as const).map(([v, chu]) => (
              <button key={v} type="button" role="radio" aria-checked={lichAm === v} onClick={() => setLichAm(v)}
                className={cn("vung-cham rounded-full border px-3 py-1 transition-colors", lichAm === v ? "border-gold text-gold" : "border-line hover:text-fg")}>
                {chu}
              </button>
            ))}
            <span className="text-fg-faint">{g("hs.am_goi_y")}</span>
          </div>
        )}
        {lich === "am" && (
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input type="checkbox" checked={nhuan} onChange={(e) => setNhuan(e.target.checked)} className="size-4 accent-[rgb(var(--gold))]" />
            {g("hs.thang_nhuan")}
          </label>
        )}
        <p className="min-h-5 text-xs empty:min-h-0" aria-live="polite" data-testid="doi-lich">
          {doi && lich === "duong" && <span className="text-fg-muted"><ChuNhan lopNhan="font-bold text-fg" chu={g("hs.doi_am", { am: moTaAm(doi.am, doi.can_chi_nam), ngay: doi.can_chi_ngay, thang: doi.can_chi_thang })} />{doi.lich_mien_nam_utc8 ? g("hs.mien_nam") : g("hs.lich_vn")}</span>}
          {doi && lich === "am" && <span className="text-fg-muted"><ChuNhan lopNhan="font-bold text-fg" chu={g("hs.doi_duong", { duong: `${doi.duong.ngay}/${doi.duong.thang}/${doi.duong.nam}`, nam: doi.can_chi_nam, ngay: doi.can_chi_ngay })} />{doi.lich_mien_nam_utc8 && g("hs.mien_nam")}{lichAm === "trung" && g("hs.theo_trung")}</span>}
          {loiDoi && lich === "am" && <span className="text-cinnabar">{loiDoi.replace(/^Ngày không tồn tại: /, "")}</span>}
        </p>
        {doi && lich === "am" && !nhuan && doi.thang_nhuan_nam === m && (
          <p className="rounded-lg bg-gold/10 px-3 py-2 text-xs text-fg" data-testid="nhac-nhuan">
            <ChuNhan lopNhan="font-bold" chu={g("hs.nhac_nhuan", { nam: String(doi.am.nam), m: String(m) })} />
          </p>
        )}
        {doi?.lech_lich_trung && doi.am_trung_quoc && (
          <p className="rounded-lg bg-moon/10 px-3 py-2 text-xs text-fg" data-testid="nhac-lich-trung">
            <ChuNhan lopNhan="font-bold" chu={g("hs.lech_trung", { viet: moTaAm(doi.am_viet ?? doi.am, doi.can_chi_nam),
              trung: `${doi.am_trung_quoc.ngay}/${doi.am_trung_quoc.thang}${doi.am_trung_quoc.nhuan ? g("hs.nhuan") : ""}/${doi.am_trung_quoc.nam}` })} />
          </p>
        )}
        {gio >= "23:00" && (
          <p className="text-xs text-fg-faint" data-testid="nhac-gio-ty">
            {g("hs.gio_ty")}
          </p>
        )}
      </fieldset>

      <div className="rounded-xl border border-line/70">
        <button type="button" onClick={() => setMoThem(!moThem)} aria-expanded={moThem}
          className="flex min-h-11 w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-[0.8125rem] text-fg-muted sm:text-sm transition-colors hover:text-fg">
          <span>{tieuDeThem}</span>
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", moThem && "rotate-180")} aria-hidden />
        </button>
        {moThem && (
          <div className="grid gap-4 border-t border-line/70 p-4 sm:grid-cols-2">
            {can !== "day_du" && can !== "gioi_tinh" && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ten-khac">{c("ho_so.ten_khac")}</Label>
                <Input id="ten-khac" value={tenKhac} maxLength={80} onChange={(e) => setTenKhac(e.target.value)}
                  placeholder={g("hs.ten_khac_vi_du")} />
              </div>
            )}
            {can !== "gioi_tinh" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="gio-sinh">{c("ho_so.gio_sinh")}</Label>
                  <Input id="gio-sinh" type="time" value={gio} disabled={doTin === "unknown"}
                    onChange={(e) => { setGio(e.target.value); if (e.target.value && doTin === "unknown") setDoTin("approx"); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="do-tin-gio">{g("hs.do_tin")}</Label>
                  <Select id="do-tin-gio" value={doTin} onChange={(e) => { setDoTin(e.target.value); if (e.target.value === "unknown") setGio(""); }}>
                    <option value="exact">{g("hs.do_tin_exact")}</option>
                    <option value="approx">{g("hs.do_tin_approx")}</option>
                    <option value="unknown">{g("hs.do_tin_unknown")}</option>
                  </Select>
                </div>
              </>
            )}
            {can !== "gioi_tinh" && doTin === "unknown" && (
              <p className="text-xs text-fg-muted sm:col-span-2" data-testid="nhac-khong-biet-gio">
                {g("hs.khong_biet_gio")}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="gioi-tinh">{c("ho_so.gioi_tinh")}</Label>
              <Select id="gioi-tinh" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value)}>
                <option value="">{g("hs.chon")}</option>
                <option value="nam">{g("hs.nam_gioi")}</option>
                <option value="nu">{g("hs.nu_gioi")}</option>
              </Select>
            </div>
            {can !== "gioi_tinh" && (
              <div className="space-y-2">
                <Label htmlFor="noi-sinh">{c("ho_so.noi_sinh")}</Label>
                <Select id="noi-sinh" value={noiSinh} onChange={(e) => setNoiSinh(e.target.value)} disabled={!tinh && !loiTinh}>
                  <option value="">{tinh ? g("hs.chon_tinh") : g("hs.dang_tai")}</option>
                  <option value={NUOC_NGOAI}>{g("hs.nuoc_ngoai")}</option>
                  {/* EN-ALL: trang Anh gom tỉnh Việt Nam vào một nhóm (người đọc phần lớn sinh ở nước ngoài). */}
                  {en ? (tinh && <optgroup label={g("hs.nhom_vn")}>{tinh.map((t) => <option key={t.ma} value={t.ma}>{t.ten}</option>)}</optgroup>)
                    : tinh?.map((t) => <option key={t.ma} value={t.ma}>{t.ten}</option>)}
                </Select>
                {loiTinh && <button type="button" onClick={taiLaiTinh} className="text-xs text-cinnabar underline">{loiTinh} {g("hs.thu_lai")}</button>}
              </div>
            )}
            {noiSinh === NUOC_NGOAI && (
              <div className="space-y-2 sm:col-span-2" data-testid="noi-sinh-nuoc-ngoai">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nuoc-sinh">{g("hs.nuoc")}</Label>
                    <Select id="nuoc-sinh" value={nuoc} onChange={(e) => { setNuoc(e.target.value); setMuiGio(""); }}
                      disabled={!dsNuoc && !loiNuoc}>
                      <option value="">{dsNuoc ? g("hs.chon_nuoc") : g("hs.dang_tai")}</option>
                      {dsNuoc?.map((n) => <option key={n.ma} value={n.ma}>{en ? n.ten_en || n.ten : n.ten}</option>)}
                      <option value={KHAC}>{g("hs.nuoc_khac")}</option>
                    </Select>
                    {loiNuoc && <button type="button" onClick={taiLaiNuoc} className="text-xs text-cinnabar underline">{loiNuoc} {g("hs.thu_lai")}</button>}
                  </div>
                  {nuoc && nuoc !== KHAC && (
                    <div className="space-y-2">
                      <Label htmlFor="thanh-pho-sinh">{g("hs.thanh_pho")}</Label>
                      <Select id="thanh-pho-sinh" value={muiGio} onChange={(e) => setMuiGio(e.target.value)}>
                        <option value="">{g("hs.chon_thanh_pho")}</option>
                        {dsNuoc?.find((n) => n.ma === nuoc)?.thanh_pho.map((t) => <option key={t.ma} value={t.ma}>{en ? t.ten_en || t.ten : t.ten}</option>)}
                      </Select>
                    </div>
                  )}
                  {nuoc === KHAC && (
                    <div className="space-y-2">
                      <Label htmlFor="vung-iana">{g("hs.mui_gio_noi_sinh")}</Label>
                      <Select id="vung-iana" value={muiGio} onChange={(e) => setMuiGio(e.target.value)}>
                        <option value="">{g("hs.chon_mui_gio")}</option>
                        {/* múi giờ của máy đang dùng lên đầu cho dễ chọn — KHÔNG tự điền: nơi sinh có thể khác nơi đang ở */}
                        {vungMay() && <option value={vungMay()!}>{vungMay()!.replace(/_/g, " ")}{g("hs.may_ban")}</option>}
                        {cacVungIana().filter((z) => z !== vungMay()).map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
                      </Select>
                    </div>
                  )}
                </div>
                {kqMuiGio && (
                  <p className="text-xs text-fg-muted" data-testid="xac-nhan-mui-gio">
                    <ChuNhan lopNhan="font-bold text-fg" chu={g("hs.xac_nhan_mg", { utc: nhanUtc(kqMuiGio.utc_chuan) })} />
                    {kqMuiGio.gio_mua_he ? g("hs.mua_he_co") : g("hs.mua_he_khong")}
                    {kqMuiGio.lam_tron ? g("hs.lam_tron") : ""}
                    {kqMuiGio.gio_mo_ho ? g("hs.mo_ho") : ""}{g("hs.cham")}
                  </p>
                )}
                {tpChon && goiYCongTac.length > 0 && (
                  <p className="rounded-lg border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-fg-muted" data-testid="goi-y-cong-tac">
                    <ChuNhan lopNhan="font-bold text-fg" chu={g("hs.gy_cau", { tp: (en ? tpChon.ten_en || tpChon.ten : tpChon.ten).split(" (")[0]!, so: goiYCongTac.length === 2 ? g("hs.gy_hai") : g("hs.gy_mot"), ds: goiYCongTac.join(", ") })} />
                    {" "}{g("hs.gy_bat")}{" "}
                    <Link href={`${dd("/bat-tu")}#truong-phai-bat-tu`} className="text-gold underline" onClick={() => ghi("chart_interacted", { kind: "goi_y_cong_tac_bam", den: "bat_tu" })}>{g("hs.gy_bat_tu")}</Link>
                    {tpChon.canh_bao_mat_troi && coLink("/tu-vi") && <> · <Link href={`${dd("/tu-vi")}#truong-phai`} className="text-gold underline" onClick={() => ghi("chart_interacted", { kind: "goi_y_cong_tac_bam", den: "tu_vi" })}>{g("hs.gy_tu_vi")}</Link></>}.
                    {coLink(`/sinh-o-nuoc-ngoai/${nuoc}`) && <>{" "}<Link href={dd(`/sinh-o-nuoc-ngoai/${nuoc}`)} className="text-gold underline" onClick={() => ghi("chart_interacted", { kind: "goi_y_cong_tac_bam", den: "trang_nuoc" })}>{g("hs.gy_nuoc")}</Link></>}
                  </p>
                )}
                {!goiYCongTac.length && nuoc && nuoc !== KHAC && coLink(`/sinh-o-nuoc-ngoai/${nuoc}`) && (
                  <p className="text-xs text-fg-faint"><Link href={dd(`/sinh-o-nuoc-ngoai/${nuoc}`)} className="underline hover:text-fg">{g("hs.nuoc_nhap")}</Link></p>
                )}
                <p className="text-xs text-fg-faint">{g("hs.chon_dung_tp")}</p>
                <details className="text-sm">
                  <summary className="cursor-pointer text-xs text-fg-muted underline">{g("hs.khai_tay")}</summary>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-start gap-2 text-sm text-fg-muted">
                      <input type="checkbox" checked={gioMuaHe} onChange={(e) => setGioMuaHe(e.target.checked)} className="mt-0.5 size-4 accent-[rgb(var(--gold))]" />
                      <span><ChuNhan lopNhan="font-bold text-fg" chu={g("hs.gio_mua_he")} /></span>
                    </label>
                    <Label htmlFor="utc-noi-sinh">{g("hs.mui_gio_chuan")}</Label>
                    <Select id="utc-noi-sinh" value={utcNoiSinh} onChange={(e) => setUtcNoiSinh(e.target.value)}>
                      <option value="">{g("hs.khong_ro")}</option>
                      {MUI_GIO_KHOA.map(([v, k]) => <option key={v} value={v}>{g(k)}</option>)}
                    </Select>
                    <p className="text-xs text-fg-faint">{g("hs.chi_dung_khi")}</p>
                  </div>
                </details>
              </div>
            )}
            {canVung && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="vung">{g("hs.vung")}</Label>
                <Select id="vung" value={vung} onChange={(e) => setVung(e.target.value)}>
                  <option value="">{g("hs.chon")}</option>
                  <option value="north">{g("hs.vung_bac")}</option>
                  <option value="south">{g("hs.vung_nam")}</option>
                </Select>
              </div>
            )}
            {can === "day_du" && du18Nhap(lich, Number(nam) || 0, Number(thang) || 0, Number(ngay) || 0) && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tinh-trang">{g("hs.tinh_trang")}</Label>
                <Select id="tinh-trang" value={tinhTrang} onChange={(e) => setTinhTrang(e.target.value)}>
                  <option value="">{g("hs.khong_noi")}</option>
                  <option value="doc_than">{g("hs.doc_than")}</option>
                  <option value="co_doi">{g("hs.co_doi")}</option>
                </Select>
                <p className="text-xs text-fg-faint" data-testid="tinh-trang-ghi-chu">{g("hs.tinh_trang_ghi_chu")}</p>
              </div>
            )}
            <p className="text-xs text-fg-faint sm:col-span-2">
              {can === "day_du" ? g("hs.vi_sao_day_du") : g("hs.vi_sao_khac")}
            </p>
          </div>
        )}
      </div>

      {loi && <p role="alert" className="rounded-xl bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">{loi}</p>}

      {/* Trục 2 UX: khối đồng ý rút còn MỘT dòng (nút chính nằm trong màn đầu điện thoại); câu cam kết đầy đủ + link chính
          sách vẫn ở ngay đây, gập/mở tại chỗ. Câu cam kết giữ trong code (lời hứa về hệ thống, ND-7). Không ô tích. */}
      {!coDongY && (
        <div className="text-xs leading-relaxed text-fg-muted" data-testid="dong-y-du-lieu">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <span>
              <ChuNhan lopNhan="font-bold text-fg" chu={g("hs.dong_y_ngan")} />{" "}
              <button type="button" onClick={() => setMoDongY((v) => !v)} aria-expanded={moDongY} aria-controls="dong-y-chi-tiet"
                className="vung-cham inline-flex items-center gap-0.5 text-gold underline underline-offset-2" data-testid="dong-y-chi-tiet-mo">
                {g("hs.chi_tiet")}<ChevronDown className={cn("size-3.5 transition-transform", moDongY && "rotate-180")} aria-hidden />
              </button>
            </span>
          </p>
          {moDongY && (
            <p id="dong-y-chi-tiet" className="mt-2 rounded-xl border border-gold/30 bg-gold/[0.05] p-3" data-testid="dong-y-chi-tiet">
              <b className="text-fg">{c("ho_so.dong_y_tieu_de")}:</b> <ChuNhan lopNhan="font-bold text-fg" chu={g("hs.dong_y_day_du")} />{" "}
              <Link href={`${dd("/chinh-sach-rieng-tu")}#dong-y`} className="text-gold underline">{c("ho_so.chinh_sach")}</Link>
            </p>
          )}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={dang}>
        {coDongY ? (nutGui ?? c("ho_so.nut_xem")) : c("ho_so.nut_dong_y")} <ArrowRight aria-hidden />
      </Button>
      <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> {g("hs.luu_may")}
        {coDongY && (
          <span data-testid="da-dong-y">
            · {c("ho_so.da_dong_y")} ·{" "}
            <button type="button" onClick={thuHoi} className="vung-cham underline underline-offset-2 hover:text-fg">{c("ho_so.thu_hoi")}</button>
          </span>
        )}
      </p>
    </form>
  );
}
