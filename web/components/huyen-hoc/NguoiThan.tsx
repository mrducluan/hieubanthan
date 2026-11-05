"use client";
// NT-1 "Lá số người thân" (lib/nguoi-than.ts) — giao diện: ô chọn "Đang xem: Bạn ▾" trên /tu-vi, form thêm người (lưu trên
// máy, ô đồng ý không tích sẵn), lời mời lưu sau "Xem lá số 2 người", ô chọn điền sẵn form 2 người.
// Khi đang xem lá số người thân, `XemNguoiThanCtx` = true → các nút ghi về CHÍNH người xem bị ẩn ở mọi khối con:
// "Đúng với mình / Chưa đúng" (KiemChung — phiếu nói về lá số của người bấm), "Lưu" câu trả lời (luan_giai_luu), và trang
// Tử vi ẩn Luận giải toàn bộ (trả Sao), Định giờ sinh, Xem lá số 2 người. Đo lường chỉ MÃ (nguoi_than_luu/xem/xoa),
// không tên, không ngày sinh.
import { useId, useState } from "react";
import { ChevronDown, Lock, Trash2, UserPlus, Users } from "lucide-react";
import { useChuChung } from "@/components/cms/ChuChung";
import { QUAN_HE_HOP_THAM } from "@/app/api/tuvi/schema";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDanhSachTinh } from "@/lib/dia-ly";
import { ghi } from "@/lib/do-luong";
import { GIO_DAI_DIEN_KHONG_BIET, NUOC_NGOAI } from "@/lib/hoso";
import {
  CAM_KET_NGUOI_THAN, TEN_QUAN_HE, TOI_DA_NGUOI_THAN, duLaSo, luuNguoiThan, tenHien, timNguoiThan, useNguoiThan, xoaNguoiThan,
  xoaTatCaNguoiThan, type KetQuaLuu, type MaQuanHe, type NguoiThan, type NguoiThanVao,
} from "@/lib/nguoi-than";
import { cn } from "@/lib/utils";

export { XemNguoiThanCtx, useXemNguoiThan } from "@/components/huyen-hoc/XemNguoiThan";

const p2 = (v: string) => v.padStart(2, "0");
const chiSo = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

function useBaoLuu() {
  const c = useChuChung();
  return (kq: KetQuaLuu) => kq.ok ? c("nguoi_than.da_luu")
    : kq.ly_do === "chua_dong_y" ? c("nguoi_than.chua_dong_y")
      : kq.ly_do === "day" ? c("nguoi_than.day") : "Ngày sinh chưa đúng — kiểm tra lại.";
}

/** Ô đồng ý (KHÔNG tích sẵn) + nút "Lưu trên máy này" + câu cam kết — dùng chung form thêm và lời mời sau 2 người. */
function KhoiDongY({ dongY, setDongY, onLuu, loi, ok, testId }: {
  dongY: boolean; setDongY: (v: boolean) => void; onLuu: () => void; loi: string | null; ok: string | null; testId: string;
}) {
  const c = useChuChung();
  const id = useId();
  return (
    <div className="space-y-2" data-testid={testId}>
      <label htmlFor={id} className="flex items-start gap-2 text-sm text-fg">
        <input id={id} type="checkbox" checked={dongY} onChange={(e) => setDongY(e.target.checked)} data-testid="nguoi-than-dong-y"
          className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" />
        <span>{c("nguoi_than.dong_y")}</span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onLuu} data-testid="nguoi-than-luu">{c("nguoi_than.luu")}</Button>
        <span className="inline-flex items-center gap-1.5 text-xs text-fg-faint"><Lock className="size-3.5" aria-hidden />{CAM_KET_NGUOI_THAN}</span>
      </div>
      {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
      {ok && <p role="status" className="text-sm text-jade">{ok}</p>}
    </div>
  );
}

/** Form thêm người thân — chỉ trường lá số cần. Lưu xong gọi `onXong(nt)`. */
export function FormNguoiThan({ onXong }: { onXong: (nt: NguoiThan) => void }) {
  const c = useChuChung();
  const baoLuu = useBaoLuu();
  const [ten, setTen] = useState("");
  const [quanHe, setQuanHe] = useState<MaQuanHe>("gia_dinh");
  const [lich, setLich] = useState<"duong" | "am">("duong");
  const [ngay, setNgay] = useState(""); const [thang, setThang] = useState(""); const [nam, setNam] = useState("");
  const [nhuan, setNhuan] = useState(false);
  const [gio, setGio] = useState(""); const [khongBietGio, setKhongBietGio] = useState(false);
  const [gioiTinh, setGioiTinh] = useState(""); const [noiSinh, setNoiSinh] = useState(""); const [vung, setVung] = useState("");
  const [dongY, setDongY] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const { tinh, loi: loiTinh, thuLai } = useDanhSachTinh();
  const tinhChon = tinh?.find((t) => t.ma === noiSinh);
  const canVung = Boolean(noiSinh) && tinhChon?.vung === null && nam.length === 4 && `${nam}-${p2(thang)}-${p2(ngay)}` < "1975-06-13";

  function luu() {
    if (!dongY) return setLoi(c("nguoi_than.chua_dong_y"));
    if (!khongBietGio && !gio) return setLoi("Nhập giờ sinh, hoặc tích “Không biết giờ”.");
    if (!gioiTinh || !noiSinh) return setLoi("Chọn giới tính và nơi sinh để an được lá số.");
    const vao: NguoiThanVao = {
      ten_goi: ten, quan_he: quanHe, lich_nhap: lich, ngay: Number(ngay), thang: Number(thang), nam: Number(nam),
      ...(lich === "am" && nhuan ? { am_nhuan: true } : {}),
      ...(khongBietGio ? { gio: GIO_DAI_DIEN_KHONG_BIET, do_tin_gio: "unknown" as const } : { gio, do_tin_gio: "exact" as const }),
      gioi_tinh: gioiTinh as "nam" | "nu", noi_sinh: noiSinh,
      ...(canVung && (vung === "north" || vung === "south") ? { vung } : {}),
    };
    const kq = luuNguoiThan(vao, dongY);
    if (!kq.ok) return setLoi(baoLuu(kq));
    ghi("chart_interacted", { mo_dun: "tuvi", kind: "nguoi_than_luu", nguon: "form" });
    onXong(kq.nt);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-line/70 p-4" data-testid="nguoi-than-form">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nt-ten">{c("nguoi_than.ten_goi")}</Label>
          <Input id="nt-ten" maxLength={40} value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Mẹ, Bố, Bé Na…" autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nt-quan-he">Quan hệ</Label>
          <Select id="nt-quan-he" value={quanHe} onChange={(e) => setQuanHe(e.target.value as MaQuanHe)}>
            {QUAN_HE_HOP_THAM.map((q) => <option key={q} value={q}>{TEN_QUAN_HE[q]}</option>)}
          </Select>
        </div>
      </div>
      <fieldset className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-medium text-fg-muted">Ngày sinh</legend>
          <div role="radiogroup" aria-label="Loại lịch (người thân)" className="flex rounded-full border border-line p-0.5 text-xs">
            {(["duong", "am"] as const).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lich === l} onClick={() => setLich(l)}
                className={cn("vung-cham rounded-full px-3 py-1.5 transition-colors", lich === l ? "bg-gold text-bg" : "text-fg-muted hover:text-fg")}>
                {l === "duong" ? "Dương lịch" : "Âm lịch"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
          <Input aria-label="Ngày sinh người thân" inputMode="numeric" placeholder="Ngày" value={ngay} className="text-center" onChange={(e) => setNgay(chiSo(e.target.value, 2))} />
          <Input aria-label="Tháng sinh người thân" inputMode="numeric" placeholder="Tháng" value={thang} className="text-center" onChange={(e) => setThang(chiSo(e.target.value, 2))} />
          <Input aria-label="Năm sinh người thân" inputMode="numeric" placeholder="Năm" value={nam} className="text-center" onChange={(e) => setNam(chiSo(e.target.value, 4))} />
        </div>
        {lich === "am" && (
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input type="checkbox" checked={nhuan} onChange={(e) => setNhuan(e.target.checked)} className="size-4 accent-[rgb(var(--gold))]" /> Tháng nhuận
          </label>
        )}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="nt-gio">Giờ sinh</Label>
          <Input id="nt-gio" type="time" value={khongBietGio ? "" : gio} disabled={khongBietGio} onChange={(e) => setGio(e.target.value)} />
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            <input type="checkbox" checked={khongBietGio} onChange={(e) => setKhongBietGio(e.target.checked)} className="size-4 accent-[rgb(var(--gold))]" /> Không biết giờ
          </label>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nt-gioi-tinh">Giới tính</Label>
          <Select id="nt-gioi-tinh" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value)}>
            <option value="">— Chọn —</option><option value="nam">Nam</option><option value="nu">Nữ</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nt-noi-sinh">Nơi sinh</Label>
          <Select id="nt-noi-sinh" value={noiSinh} onChange={(e) => setNoiSinh(e.target.value)} disabled={!tinh && !loiTinh}>
            <option value="">{tinh ? "— Chọn tỉnh/thành —" : "Đang tải…"}</option>
            <option value={NUOC_NGOAI}>Sinh ở nước ngoài</option>
            {tinh?.map((t) => <option key={t.ma} value={t.ma}>{t.ten}</option>)}
          </Select>
          {loiTinh && <button type="button" onClick={thuLai} className="text-xs text-cinnabar underline">{loiTinh} Thử lại</button>}
        </div>
        {canVung && (
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="nt-vung">Quảng Trị trước 13/6/1975: sinh ở bờ nào sông Bến Hải?</Label>
            <Select id="nt-vung" value={vung} onChange={(e) => setVung(e.target.value)}>
              <option value="">— Chọn —</option><option value="north">Bờ Bắc (Vĩnh Linh)</option><option value="south">Bờ Nam</option>
            </Select>
          </div>
        )}
      </div>
      <KhoiDongY dongY={dongY} setDongY={setDongY} onLuu={luu} loi={loi} ok={null} testId="nguoi-than-form-luu" />
    </div>
  );
}

/** /tu-vi — "Đang xem: Bạn ▾": đổi lá số sang người thân đã lưu (chỉ xem), thêm / xoá người. */
export function ChonNguoiXem({ dangXem, onChon, coBan }: {
  dangXem: NguoiThan | null; onChon: (nt: NguoiThan | null) => void; /** người xem có lá số của chính mình */ coBan: boolean;
}) {
  const c = useChuChung();
  const ds = useNguoiThan();
  const [mo, setMo] = useState(false);
  const [them, setThem] = useState(false);
  const idBang = useId();
  if (ds === undefined) return null;
  const chon = (nt: NguoiThan | null) => {
    onChon(nt); setMo(false); setThem(false);
    if (nt) ghi("chart_interacted", { mo_dun: "tuvi", kind: "nguoi_than_xem" });
  };
  const xoa = (nt: NguoiThan) => {
    if (dangXem?.id === nt.id) onChon(null);
    xoaNguoiThan(nt.id);
    ghi("chart_interacted", { mo_dun: "tuvi", kind: "nguoi_than_xoa" });
  };
  return (
    <div className="space-y-2" data-testid="nguoi-than">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-expanded={mo} aria-controls={mo ? idBang : undefined} onClick={() => setMo(!mo)} data-testid="nguoi-than-mo"
          className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
            dangXem ? "border-moon bg-moon/10 text-fg" : mo ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
          <Users className="size-4" aria-hidden />
          {c("nguoi_than.dang_xem")}: <b className="text-fg" data-testid="nguoi-than-dang-xem">{dangXem ? tenHien(dangXem) : c("nguoi_than.ban")}</b>
          <ChevronDown className={cn("size-4 transition-transform motion-reduce:transition-none", mo && "rotate-180")} aria-hidden />
        </button>
        {dangXem && coBan && (
          <Button type="button" size="sm" variant="ghost" onClick={() => chon(null)} data-testid="nguoi-than-ve-ban">{c("nguoi_than.ve_ban")}</Button>
        )}
      </div>
      {dangXem && (
        <p className="rounded-xl bg-moon/10 px-4 py-2.5 text-sm text-fg" data-testid="nguoi-than-chi-xem">
          {c("nguoi_than.chi_xem")}
          {dangXem.do_tin_gio === "unknown" && <> Chưa biết giờ sinh: lá số <b>an tạm theo giờ Ngọ (12:00)</b>.</>}
        </p>
      )}
      {mo && (
        <div id={idBang} className="space-y-3 rounded-2xl border border-line/70 bg-surface/40 p-3 sm:p-4" data-testid="nguoi-than-bang">
          <ul className="divide-y divide-line/60">
            {coBan && (
              <li className="flex items-center justify-between gap-2 py-2">
                <button type="button" aria-pressed={!dangXem} onClick={() => chon(null)} className="min-h-10 text-left text-sm text-fg hover:text-gold">
                  {c("nguoi_than.ban")} <span className="text-xs text-fg-faint">· lá số của bạn</span>
                </button>
              </li>
            )}
            {ds.map((nt) => {
              const du = duLaSo(nt);
              return (
                <li key={nt.id} className="flex items-center justify-between gap-2 py-2" data-testid="nguoi-than-dong">
                  <div className="min-w-0">
                    <button type="button" disabled={!du} aria-pressed={dangXem?.id === nt.id} onClick={() => chon(nt)} data-testid="nguoi-than-xem"
                      className="min-h-10 text-left text-sm text-fg hover:text-gold disabled:cursor-not-allowed disabled:text-fg-muted">
                      {tenHien(nt)} <span className="text-xs text-fg-faint">· {TEN_QUAN_HE[nt.quan_he]}</span>
                    </button>
                    {!du && <p className="text-xs text-fg-faint">{c("nguoi_than.thieu")}</p>}
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => xoa(nt)} aria-label={`${c("nguoi_than.xoa")} ${tenHien(nt)}`} data-testid="nguoi-than-xoa">
                    <Trash2 aria-hidden /> <span className="hidden sm:inline">{c("nguoi_than.xoa")}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            {ds.length < TOI_DA_NGUOI_THAN
              ? <Button type="button" size="sm" variant="secondary" aria-expanded={them} onClick={() => setThem(!them)} data-testid="nguoi-than-them"><UserPlus aria-hidden /> {c("nguoi_than.them")}</Button>
              : <p className="text-xs text-fg-faint">{c("nguoi_than.day")}</p>}
            {ds.length > 0 && (
              <Button type="button" size="sm" variant="ghost" data-testid="nguoi-than-xoa-tat-ca" onClick={() => {
                if (dangXem) onChon(null);
                xoaTatCaNguoiThan();
                ghi("chart_interacted", { mo_dun: "tuvi", kind: "nguoi_than_xoa", tat_ca: true });
              }}>{c("nguoi_than.xoa_tat_ca")}</Button>
            )}
          </div>
          {ds.length === 0 && !them && <p className="text-xs text-fg-faint">Lưu tối đa {TOI_DA_NGUOI_THAN} người (cha mẹ, con, bạn bè) để xem nhanh lá số của họ. {CAM_KET_NGUOI_THAN}</p>}
          {them && <FormNguoiThan onXong={(nt) => { setThem(false); if (duLaSo(nt)) chon(nt); }} />}
        </div>
      )}
    </div>
  );
}

/** "Xem lá số 2 người" — ô chọn người thân đã lưu để điền sẵn form (không tự gửi). */
export function ChonTuNguoiThan({ onChon }: { onChon: (nt: NguoiThan) => void }) {
  const c = useChuChung();
  const ds = useNguoiThan();
  const id = useId();
  if (!ds?.length) return null;
  return (
    <div className="space-y-1.5" data-testid="hop-tham-chon-nguoi-than">
      <Label htmlFor={id}>{c("nguoi_than.chon")}</Label>
      <Select id={id} value="" onChange={(e) => { const nt = ds.find((x) => x.id === e.target.value); if (nt) onChon(nt); }}>
        <option value="">— Chọn —</option>
        {ds.map((nt) => <option key={nt.id} value={nt.id}>{tenHien(nt)} · {TEN_QUAN_HE[nt.quan_he]}</option>)}
      </Select>
    </div>
  );
}

/** Sau khi xem 2 người: mời lưu người ấy trên máy (ô đồng ý không tích sẵn). Đã lưu đúng người này → không hiện. */
export function LuuSauHopTham({ vao }: { vao: NguoiThanVao }) {
  const c = useChuChung();
  const baoLuu = useBaoLuu();
  const ds = useNguoiThan();
  const [mo, setMo] = useState(false);
  const [ten, setTen] = useState("");
  const [dongY, setDongY] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  if (ds === undefined || (!ok && timNguoiThan(vao))) return null;
  if (!mo) {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setMo(true)} data-testid="hop-tham-luu-nguoi-than">
        <UserPlus aria-hidden /> {c("nguoi_than.luu_nguoi_nay")}
      </Button>
    );
  }
  return (
    <div className="w-full space-y-3 rounded-2xl border border-line/70 p-4" data-testid="hop-tham-luu-khung">
      <div className="space-y-1.5">
        <Label htmlFor="ht-nt-ten">{c("nguoi_than.ten_goi")}</Label>
        <Input id="ht-nt-ten" maxLength={40} value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Mẹ, Bố, Bé Na…" autoComplete="off" />
      </div>
      <KhoiDongY dongY={dongY} setDongY={setDongY} loi={loi} ok={ok} testId="hop-tham-luu-dong-y" onLuu={() => {
        const kq = luuNguoiThan({ ...vao, ten_goi: ten }, dongY);
        if (!kq.ok) { setLoi(baoLuu(kq)); setOk(null); return; }
        setLoi(null); setOk(baoLuu(kq));
        ghi("chart_interacted", { mo_dun: "tuvi", kind: "nguoi_than_luu", nguon: "hop_tham" });
      }} />
    </div>
  );
}
