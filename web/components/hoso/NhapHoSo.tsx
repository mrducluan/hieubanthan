"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { luuHoSo, moTaAm, ngayHopLe, NUOC_NGOAI, type HoSo } from "@/lib/hoso";
import { postJson } from "@/lib/goi-api";
import { useDanhSachTinh } from "@/lib/dia-ly";
import { ghi, layMaMoi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

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

// Nhập MỘT LẦN, dùng mọi mảng (docs/THIET-KE-UI.md §4.3). Chỉ tên + ngày sinh bắt buộc; phần còn lại
// hỏi đúng lúc mảng cần (can). Ngày âm do engine đổi — web không tự đổi lịch.
export function NhapHoSo({ macDinh, nutGui = "Xem con số của tôi", can, onXong, className }: Props) {
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
  const [gio, setGio] = useState(macDinh?.gio ?? "");
  const [doTin, setDoTin] = useState<string>(macDinh?.do_tin_gio ?? "exact");
  const [gioiTinh, setGioiTinh] = useState<string>(macDinh?.gioi_tinh ?? "");
  const [noiSinh, setNoiSinh] = useState<string>(macDinh?.noi_sinh ?? "");
  const [gioMuaHe, setGioMuaHe] = useState(Boolean(macDinh?.gio_mua_he));
  const [vung, setVung] = useState<string>(macDinh?.vung ?? "");
  const [doi, setDoi] = useState<KetQuaDoi | null>(null);
  const [loiDoi, setLoiDoi] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const thangRef = useRef<HTMLInputElement>(null);
  const namRef = useRef<HTMLInputElement>(null);
  const { tinh, loi: loiTinh, thuLai: taiLaiTinh } = useDanhSachTinh();

  const d = Number(ngay), m = Number(thang), y = Number(nam);
  const duSo = d > 0 && m > 0 && nam.length === 4 && y >= 1900;
  const coTheDoi = duSo && (lich === "am" ? d <= 30 : ngayHopLe(d, m, y));
  const yeuCauDoi = coTheDoi
    ? { chieu: lich === "am" ? "am_sang_duong" : "duong_sang_am", ngay: d, thang: m, nam: y,
        ...(lich === "am" && nhuan ? { nhuan: true } : {}), ...(lich === "am" && lichAm === "trung" ? { lich: "trung" } : {}),
        ...(noiSinh ? { noi_sinh: noiSinh } : {}) }
    : null;
  const khoaDoi = yeuCauDoi ? JSON.stringify(yeuCauDoi) : null;

  // Xem trước lịch bên kia để người dùng đối chiếu giấy tờ (âm ↔ dương).
  useEffect(() => {
    setDoi(null); setLoiDoi(null);
    if (!khoaDoi) return;
    let huy = false;
    const t = setTimeout(() => {
      postJson<KetQuaDoi>("/api/lich/doi", JSON.parse(khoaDoi))
        .then((r) => { if (!huy) setDoi(r); })
        .catch((e: unknown) => { if (!huy) setLoiDoi(e instanceof Error ? e.message : "Chưa đổi được lịch."); });
    }, 300);
    return () => { huy = true; clearTimeout(t); };
  }, [khoaDoi]);

  const duong = lich === "duong" ? (coTheDoi ? { ngay: d, thang: m, nam: y } : null) : doi?.duong ?? null;
  const isoDuong = duong ? `${duong.nam}-${String(duong.thang).padStart(2, "0")}-${String(duong.ngay).padStart(2, "0")}` : null;
  const truoc1975 = isoDuong ? isoDuong < "1975-06-13" : false;
  const tinhChon = tinh?.find((t) => t.ma === noiSinh);
  const canVung = truoc1975 && tinhChon?.vung === null;   // Quảng Trị: vắt ngang vĩ tuyến 17

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    if (ten.trim().length < 2 || !/\p{L}/u.test(ten)) return setLoi("Nhập họ tên đầy đủ (như trên giấy khai sinh).");
    if (!coTheDoi) return setLoi(`Ngày sinh chưa đúng — kiểm tra lại ngày, tháng, năm (${lich === "am" ? "âm" : "dương"} lịch).`);
    if (can === "day_du" && (!gio || !gioiTinh || !noiSinh)) return setLoi("Mảng này cần giờ sinh, giới tính và nơi sinh.");
    if (can === "gioi_tinh" && !gioiTinh) return setLoi("Mảng này cần giới tính.");
    if (can === "day_du" && canVung && !vung) return setLoi("Sinh ở Quảng Trị trước 13/6/1975: chọn bờ Bắc hay Nam sông Bến Hải.");
    setLoi(null);
    setDang(true);
    let kq = doi;
    try {
      if (!kq && yeuCauDoi) kq = await postJson<KetQuaDoi>("/api/lich/doi", yeuCauDoi);
    } catch (e2) {
      // Nhập dương lịch vẫn lưu được khi chưa đổi được sang âm; nhập âm thì bắt buộc phải đổi.
      if (lich === "am") { setDang(false); return setLoi(e2 instanceof Error ? e2.message : "Chưa đổi được ngày âm."); }
    }
    setDang(false);
    const dg = lich === "am" ? kq!.duong : { ngay: d, thang: m, nam: y };
    if (Date.UTC(dg.nam, dg.thang - 1, dg.ngay) > Date.now()) return setLoi("Ngày sinh chưa đúng — ngày này chưa tới.");
    const nuocNgoai = noiSinh === NUOC_NGOAI;
    const h = luuHoSo({
      ho_ten: ten.trim(),
      ngay: dg.ngay, thang: dg.thang, nam: dg.nam,
      lich_nhap: lich,
      ...(lich === "am" && lichAm === "trung" ? { lich_am: "trung" as const } : {}),
      ...(kq ? { am: kq.am } : {}),
      ...(tenKhac.trim() ? { ten_khac: tenKhac.trim() } : {}),
      ...(gio ? { gio, do_tin_gio: doTin === "approx" ? "approx" as const : "exact" as const } : {}),
      ...(gioiTinh === "nam" || gioiTinh === "nu" ? { gioi_tinh: gioiTinh } : {}),
      ...(noiSinh ? { noi_sinh: noiSinh } : {}),
      ...(nuocNgoai && gioMuaHe ? { gio_mua_he: true } : {}),
      ...(canVung && (vung === "north" || vung === "south") ? { vung } : {}),
      ...(macDinh?.tao_luc ? { tao_luc: macDinh.tao_luc } : {}),
    });
    if (!macDinh) {
      ghi("reading_started");
      ghi("profile_created", { kind: "may" });
      const ma = layMaMoi();
      if (ma) ghi("referral_signup", { ma_moi: ma });
    }
    onXong(h);
  }

  const chiSo = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
  const tieuDeThem = can === "day_du" ? "Giờ sinh, giới tính & nơi sinh (cần cho mảng này)"
    : can === "gioi_tinh" ? "Giới tính (cần cho mảng này)" : "Thêm tên thường gọi, giờ sinh, nơi sinh (không bắt buộc)";

  return (
    <form onSubmit={gui} className={cn("space-y-5", className)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="ho-ten">Họ và tên đầy đủ</Label>
        <Input id="ho-ten" name="ho-ten" autoComplete="name" value={ten} maxLength={80}
          onChange={(e) => setTen(e.target.value)} placeholder="Nguyễn Văn An" />
      </div>

      <fieldset className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-medium text-fg-muted">Ngày sinh</legend>
          <div role="radiogroup" aria-label="Loại lịch" className="flex rounded-full border border-line p-0.5 text-xs">
            {(["duong", "am"] as const).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lich === l} onClick={() => setLich(l)}
                className={cn("vung-cham rounded-full px-3 py-1.5 transition-colors", lich === l ? "bg-gold text-bg" : "text-fg-muted hover:text-fg")}>
                {l === "duong" ? "Dương lịch" : "Âm lịch"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
          <Input aria-label="Ngày" inputMode="numeric" placeholder="Ngày" value={ngay} className="text-center"
            onChange={(e) => { const v = chiSo(e.target.value, 2); setNgay(v); if (v.length === 2) thangRef.current?.focus(); }} />
          <Input ref={thangRef} aria-label="Tháng" inputMode="numeric" placeholder="Tháng" value={thang} className="text-center"
            onChange={(e) => { const v = chiSo(e.target.value, 2); setThang(v); if (v.length === 2) namRef.current?.focus(); }} />
          <Input ref={namRef} aria-label="Năm" inputMode="numeric" placeholder="Năm" value={nam} className="text-center"
            onChange={(e) => setNam(chiSo(e.target.value, 4))} />
        </div>
        {lich === "am" && (
          <div role="radiogroup" aria-label="Ngày âm theo lịch nào" className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <span>Ngày âm theo:</span>
            {([["viet", "Âm lịch Việt Nam"], ["trung", "Âm lịch Trung Quốc"]] as const).map(([v, chu]) => (
              <button key={v} type="button" role="radio" aria-checked={lichAm === v} onClick={() => setLichAm(v)}
                className={cn("vung-cham rounded-full border px-3 py-1 transition-colors", lichAm === v ? "border-gold text-gold" : "border-line hover:text-fg")}>
                {chu}
              </button>
            ))}
            <span className="text-fg-faint">— sổ tử vi, lịch in theo Trung Quốc thì chọn “Trung Quốc”.</span>
          </div>
        )}
        {lich === "am" && (
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input type="checkbox" checked={nhuan} onChange={(e) => setNhuan(e.target.checked)} className="size-4 accent-[rgb(var(--gold))]" />
            Tháng nhuận
          </label>
        )}
        <p className="min-h-5 text-xs empty:min-h-0" aria-live="polite" data-testid="doi-lich">
          {doi && lich === "duong" && <span className="text-fg-muted">Âm lịch: <b className="text-fg">{moTaAm(doi.am, doi.can_chi_nam)}</b> · ngày {doi.can_chi_ngay}, tháng {doi.can_chi_thang}{doi.lich_mien_nam_utc8 ? " · theo lịch miền Nam thời đó" : " · theo lịch Việt Nam"}</span>}
          {doi && lich === "am" && <span className="text-fg-muted">Dương lịch: <b className="text-fg">{doi.duong.ngay}/{doi.duong.thang}/{doi.duong.nam}</b> · năm {doi.can_chi_nam} · ngày {doi.can_chi_ngay}{doi.lich_mien_nam_utc8 && " · theo lịch miền Nam thời đó"}{lichAm === "trung" && " · đổi theo âm lịch Trung Quốc"}</span>}
          {loiDoi && lich === "am" && <span className="text-cinnabar">{loiDoi.replace(/^Ngày không tồn tại: /, "")}</span>}
        </p>
        {doi && lich === "am" && !nhuan && doi.thang_nhuan_nam === m && (
          <p className="rounded-lg bg-gold/10 px-3 py-2 text-xs text-fg" data-testid="nhac-nhuan">
            Năm {doi.am.nam} có <b>hai tháng {m}</b> (tháng {m} thường và tháng {m} nhuận). Nếu giấy tờ ghi “tháng {m} nhuận”, hãy đánh dấu ô Tháng nhuận.
          </p>
        )}
        {doi?.lech_lich_trung && doi.am_trung_quoc && (
          <p className="rounded-lg bg-moon/10 px-3 py-2 text-xs text-fg" data-testid="nhac-lich-trung">
            Ngày này âm lịch Việt Nam là <b>{moTaAm(doi.am_viet ?? doi.am, doi.can_chi_nam)}</b>, còn theo lịch Trung Quốc là{" "}
            <b>{doi.am_trung_quoc.ngay}/{doi.am_trung_quoc.thang}{doi.am_trung_quoc.nhuan ? " nhuận" : ""}/{doi.am_trung_quoc.nam}</b>.
            Sổ tử vi hay phần mềm theo lịch Trung Quốc sẽ ra lá số, lời luận khác. Hệ thống mặc định dùng lịch Việt Nam;
            ở trang Tử vi bạn chọn được xem theo lịch nào (mục “Trường phái”).
          </p>
        )}
        {gio >= "23:00" && (
          <p className="text-xs text-fg-faint" data-testid="nhac-gio-ty">
            Sinh 23:00–23:59 (đầu giờ Tý): Tử vi tính sang ngày âm hôm sau; Thần số và Bát tự giữ ngày này.
          </p>
        )}
      </fieldset>

      <div className="rounded-xl border border-line/70">
        <button type="button" onClick={() => setMoThem(!moThem)} aria-expanded={moThem}
          className="flex min-h-11 w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm text-fg-muted transition-colors hover:text-fg">
          <span>{tieuDeThem}</span>
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", moThem && "rotate-180")} aria-hidden />
        </button>
        {moThem && (
          <div className="grid gap-4 border-t border-line/70 p-4 sm:grid-cols-2">
            {can !== "day_du" && can !== "gioi_tinh" && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ten-khac">Tên thường gọi / cách viết khác</Label>
                <Input id="ten-khac" value={tenKhac} maxLength={80} onChange={(e) => setTenKhac(e.target.value)}
                  placeholder="Không dấu, tên ở nhà…" />
              </div>
            )}
            {can !== "gioi_tinh" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="gio-sinh">Giờ sinh</Label>
                  <Input id="gio-sinh" type="time" value={gio} onChange={(e) => setGio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="do-tin-gio">Giờ sinh này</Label>
                  <Select id="do-tin-gio" value={doTin} onChange={(e) => setDoTin(e.target.value)} disabled={!gio}>
                    <option value="exact">Chính xác (giấy tờ, sổ ghi)</option>
                    <option value="approx">Áng chừng (nghe kể lại)</option>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="gioi-tinh">Giới tính</Label>
              <Select id="gioi-tinh" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value)}>
                <option value="">— Chọn —</option>
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </Select>
            </div>
            {can !== "gioi_tinh" && (
              <div className="space-y-2">
                <Label htmlFor="noi-sinh">Nơi sinh</Label>
                <Select id="noi-sinh" value={noiSinh} onChange={(e) => setNoiSinh(e.target.value)} disabled={!tinh && !loiTinh}>
                  <option value="">{tinh ? "— Chọn tỉnh/thành —" : "Đang tải…"}</option>
                  <option value={NUOC_NGOAI}>Sinh ở nước ngoài</option>
                  {tinh?.map((t) => <option key={t.ma} value={t.ma}>{t.ten}</option>)}
                </Select>
                {loiTinh && <button type="button" onClick={taiLaiTinh} className="text-xs text-cinnabar underline">{loiTinh} Thử lại</button>}
              </div>
            )}
            {noiSinh === NUOC_NGOAI && (
              <label className="flex items-start gap-2 text-sm text-fg-muted sm:col-span-2">
                <input type="checkbox" checked={gioMuaHe} onChange={(e) => setGioMuaHe(e.target.checked)} className="mt-0.5 size-4 accent-[rgb(var(--gold))]" />
                <span>Lúc sinh, nơi đó đang dùng <b className="text-fg">giờ mùa hè</b> (vd Mỹ, châu Âu, Úc thường từ tháng 3–4 đến 10–11). Không chắc thì để trống.</span>
              </label>
            )}
            {canVung && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="vung">Quảng Trị trước 13/6/1975: sinh ở bờ nào sông Bến Hải?</Label>
                <Select id="vung" value={vung} onChange={(e) => setVung(e.target.value)}>
                  <option value="">— Chọn —</option>
                  <option value="north">Bờ Bắc (Vĩnh Linh)</option>
                  <option value="south">Bờ Nam (Gio Linh, Đông Hà, Quảng Trị…)</option>
                </Select>
              </div>
            )}
            <p className="text-xs text-fg-faint sm:col-span-2">
              {can === "day_du"
                ? "Tử vi và Bát tự lập theo giờ sinh; nơi sinh quyết định múi giờ lúc đó (hai miền khác nhau trước 1975, nước ngoài dùng giờ địa phương)."
                : "Giờ sinh, giới tính, nơi sinh chỉ cần cho Tử vi, Bát tự, Phong thuỷ. Thần số chỉ dùng tên và ngày sinh."}
            </p>
          </div>
        )}
      </div>

      {loi && <p role="alert" className="rounded-xl bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">{loi}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={dang}>
        {nutGui} <ArrowRight aria-hidden />
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Lưu trên máy của bạn · không cần tài khoản
      </p>
    </form>
  );
}
