"use client";
import { useRef, useState } from "react";
import { ArrowRight, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { luuHoSo, ngayHopLe, type HoSo } from "@/lib/hoso";
import { ghi, layMaMoi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

interface Props {
  macDinh?: HoSo | null;
  nutGui?: string;
  /** Mảng cần thêm: "day_du" = giờ sinh + giới tính (Tử vi, Bát tự) · "gioi_tinh" (Phong thuỷ). */
  can?: "day_du" | "gioi_tinh";
  onXong: (h: HoSo) => void;
  className?: string;
}

// Nhập MỘT LẦN, dùng mọi mảng (docs/THIET-KE-UI.md §4.3). Chỉ 2 trường bắt buộc; phần còn lại hỏi dần.
export function NhapHoSo({ macDinh, nutGui = "Xem con số của tôi", can, onXong, className }: Props) {
  const [ten, setTen] = useState(macDinh?.ho_ten ?? "");
  const [ngay, setNgay] = useState(macDinh ? String(macDinh.ngay) : "");
  const [thang, setThang] = useState(macDinh ? String(macDinh.thang) : "");
  const [nam, setNam] = useState(macDinh ? String(macDinh.nam) : "");
  const [moThem, setMoThem] = useState(Boolean(can) || Boolean(macDinh?.gio || macDinh?.ten_khac));
  const [tenKhac, setTenKhac] = useState(macDinh?.ten_khac ?? "");
  const [gio, setGio] = useState(macDinh?.gio ?? "");
  const [gioiTinh, setGioiTinh] = useState<string>(macDinh?.gioi_tinh ?? "");
  const [vung, setVung] = useState<string>(macDinh?.vung ?? "");
  const [loi, setLoi] = useState<string | null>(null);
  const thangRef = useRef<HTMLInputElement>(null);
  const namRef = useRef<HTMLInputElement>(null);

  const d = Number(ngay), m = Number(thang), y = Number(nam);
  const truoc1975 = nam.length === 4 && (y < 1975 || (y === 1975 && (m < 6 || (m === 6 && d < 13))));

  function gui(e: React.FormEvent) {
    e.preventDefault();
    if (ten.trim().length < 2 || !/\p{L}/u.test(ten)) return setLoi("Nhập họ tên đầy đủ (như trên giấy khai sinh).");
    if (!(d && m && nam.length === 4) || !ngayHopLe(d, m, y) || y < 1900 || Date.UTC(y, m - 1, d) > Date.now())
      return setLoi("Ngày sinh chưa đúng — kiểm tra lại ngày, tháng, năm (dương lịch).");
    if (can === "day_du" && (!gio || !gioiTinh)) return setLoi("Mảng này cần giờ sinh và giới tính.");
    if (can === "gioi_tinh" && !gioiTinh) return setLoi("Mảng này cần giới tính.");
    if (can === "day_du" && truoc1975 && !vung) return setLoi("Sinh trước 13/6/1975: chọn nơi sinh (miền Bắc/Nam).");
    setLoi(null);
    const h = luuHoSo({
      ho_ten: ten.trim(),
      ngay: d, thang: m, nam: y,
      ...(tenKhac.trim() ? { ten_khac: tenKhac.trim() } : {}),
      ...(gio ? { gio } : {}),
      ...(gioiTinh === "nam" || gioiTinh === "nu" ? { gioi_tinh: gioiTinh } : {}),
      ...(truoc1975 && (vung === "north" || vung === "south") ? { vung } : {}),
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

  return (
    <form onSubmit={gui} className={cn("space-y-5", className)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="ho-ten">Họ và tên đầy đủ</Label>
        <Input id="ho-ten" name="ho-ten" autoComplete="name" value={ten} maxLength={80}
          onChange={(e) => setTen(e.target.value)} placeholder="Nguyễn Văn An" />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg-muted">Ngày sinh (dương lịch)</legend>
        <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
          <Input aria-label="Ngày" inputMode="numeric" placeholder="Ngày" value={ngay} className="text-center"
            onChange={(e) => { const v = chiSo(e.target.value, 2); setNgay(v); if (v.length === 2) thangRef.current?.focus(); }} />
          <Input ref={thangRef} aria-label="Tháng" inputMode="numeric" placeholder="Tháng" value={thang} className="text-center"
            onChange={(e) => { const v = chiSo(e.target.value, 2); setThang(v); if (v.length === 2) namRef.current?.focus(); }} />
          <Input ref={namRef} aria-label="Năm" inputMode="numeric" placeholder="Năm" value={nam} className="text-center"
            onChange={(e) => setNam(chiSo(e.target.value, 4))} />
        </div>
      </fieldset>

      <div className="rounded-xl border border-line/70">
        <button type="button" onClick={() => setMoThem(!moThem)} aria-expanded={moThem}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-fg-muted hover:text-fg">
          <span>{can === "day_du" ? "Giờ sinh & giới tính (cần cho mảng này)" : can === "gioi_tinh" ? "Giới tính (cần cho mảng này)" : "Thêm tên thường gọi, giờ sinh (không bắt buộc)"}</span>
          <ChevronDown className={cn("size-4 transition-transform", moThem && "rotate-180")} aria-hidden />
        </button>
        {moThem && (
          <div className="grid gap-4 border-t border-line/70 p-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ten-khac">Tên thường gọi / cách viết khác</Label>
              <Input id="ten-khac" value={tenKhac} maxLength={80} onChange={(e) => setTenKhac(e.target.value)}
                placeholder="Không dấu, tên ở nhà…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gio-sinh">Giờ sinh</Label>
              <Input id="gio-sinh" type="time" value={gio} onChange={(e) => setGio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gioi-tinh">Giới tính</Label>
              <Select id="gioi-tinh" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value)}>
                <option value="">— Chọn —</option>
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </Select>
            </div>
            {truoc1975 && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="vung">Nơi sinh (trước 13/6/1975 hai miền khác múi giờ)</Label>
                <Select id="vung" value={vung} onChange={(e) => setVung(e.target.value)}>
                  <option value="">— Chọn —</option>
                  <option value="north">Miền Bắc</option>
                  <option value="south">Miền Nam</option>
                </Select>
              </div>
            )}
            <p className="text-xs text-fg-faint sm:col-span-2">
              Giờ sinh và giới tính chỉ cần cho Tử vi, Bát tự, Phong thuỷ. Thần số chỉ dùng tên và ngày sinh.
            </p>
          </div>
        )}
      </div>

      {loi && <p role="alert" className="rounded-xl bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">{loi}</p>}

      <Button type="submit" size="lg" className="w-full">
        {nutGui} <ArrowRight aria-hidden />
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Lưu trên máy của bạn · không cần tài khoản
      </p>
    </form>
  );
}
