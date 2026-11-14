"use client";
// TV-V2 + HN-2N — "Xem lá số 2 người" (tên mã cũ: hợp tham): can năm sinh người kia "phi hoá" vào lá số của bạn (và
// chiều ngược lại khi người kia đủ giờ + giới tính + nơi sinh), kèm ĐIỂM THAM KHẢO hợp – khắc 0–100 theo 5 tiêu chí
// (chủ dự án chốt 2026-10-21, chỉ cho phần Tử vi 2 người). Engine tính hết, web chỉ hiển thị.
// Ngày sinh người kia chỉ gửi đi để tính, KHÔNG lưu — trừ khi người dùng tự bấm "Lưu người này trên máy" và tự tích ô
// đồng ý (NT-1, chủ dự án duyệt 2026-11-04): khi đó chỉ lưu trong localStorage của máy này (lib/nguoi-than.ts, ≤ 5 người),
// không bao giờ lên tài khoản. "Chọn từ người thân đã lưu" chỉ điền sẵn form, không tự gửi.
import Link from "@/components/khung/Lien";
import { useState } from "react";
import { ChevronDown, HeartHandshake, ListChecks, Lock, MessageCircleQuestion, Send } from "lucide-react";
import { QUAN_HE_HOP_THAM, type ChartInputVao, type HoaVaoT, type HopThamOutputT } from "@/app/api/tuvi/schema";
import { DiemHaiNguoi } from "@/components/huyen-hoc/DiemHaiNguoi";
import { NutChiaSeHai } from "@/components/chia-se/NutChiaSeHai";
import { NhanLop } from "@/components/huyen-hoc/KhoiMoLuoi";
import { HopNoiBat, KiemChungBai } from "@/components/luan-giai/HopNoiBat";
import { ChonTuNguoiThan, LuuSauHopTham } from "@/components/huyen-hoc/NguoiThan";
import { ChonNuocThanhPho } from "@/components/hoso/ChonNuocThanhPho";
import { MAU_HOA_DIU } from "@/components/huyen-hoc/PhiHoa";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDanhSachTinh } from "@/lib/dia-ly";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { ngayHopLe, NUOC_NGOAI } from "@/lib/hoso";
import { TEN_QUAN_HE, type NguoiThan, type NguoiThanVao } from "@/lib/nguoi-than";
import { useTyLe } from "@/lib/ty-le-kiem-chung";
import { cn } from "@/lib/utils";
import { useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";
import { TenHienProvider } from "@/components/khung/TenHien";

type MaQuanHe = (typeof QUAN_HE_HOP_THAM)[number];

const p2 = (v: string) => v.padStart(2, "0");
const chiSo = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

export function HopThamTuVi({ laSo, onHoi }: { laSo: ChartInputVao; onHoi: (cau: string) => void }) {
  const [quanHe, setQuanHe] = useState<MaQuanHe>("nguoi_yeu");
  const [lich, setLich] = useState<"duong" | "am">("duong");
  const [ngay, setNgay] = useState("");
  const [thang, setThang] = useState("");
  const [nam, setNam] = useState("");
  const [nhuan, setNhuan] = useState(false);
  const [gio, setGio] = useState("");
  const [gioiTinh, setGioiTinh] = useState("");
  const [noiSinh, setNoiSinh] = useState("");
  const [muiGio, setMuiGio] = useState("");
  const [vung, setVung] = useState("");
  const [kq, setKq] = useState<HopThamOutputT | null>(null);
  // TCS-1: giữ đúng yêu cầu vừa xem (chỉ trong bộ nhớ trang) để máy chủ chấm lại khi tạo thẻ điểm chia sẻ.
  const [yeuCau, setYeuCau] = useState<Record<string, unknown> | null>(null);
  // NT-1: đúng dữ liệu vừa xem (chỉ trong bộ nhớ trang) — để mời "Lưu người này trên máy" sau kết quả.
  const [vaoNT, setVaoNT] = useState<NguoiThanVao | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const { tinh, loi: loiTinh, thuLai: taiLaiTinh } = useDanhSachTinh();
  const { c, en } = useChuTuVi();

  const d = Number(ngay), m = Number(thang), y = Number(nam);
  const iso = `${nam}-${p2(thang)}-${p2(ngay)}`;
  const tinhChon = tinh?.find((t) => t.ma === noiSinh);
  // Quảng Trị trước 13/6/1975 vắt ngang vĩ tuyến 17 → hỏi bờ sông (như hồ sơ). Chỉ so chuỗi ngày, không tính lịch.
  const canVung = Boolean(noiSinh) && tinhChon?.vung === null && nam.length === 4 && iso < "1975-06-13";
  const duLa = Boolean(gio && gioiTinh && noiSinh);

  async function xem(e: React.FormEvent) {
    e.preventDefault();
    const hopLe = nam.length === 4 && y >= 1900 && m >= 1 && m <= 12 && (lich === "am" ? d >= 1 && d <= 30 : ngayHopLe(d, m, y));
    if (!hopLe) return setLoi(c("ht.loi_ngay", { lich: c(lich === "am" ? "ht.lich_am" : "ht.lich_duong") }));
    if (lich === "duong" && Date.UTC(y, m - 1, d) > Date.now()) return setLoi(c("ht.chua_toi"));
    setLoi(null); setDang(true);
    try {
      const than = {
        la_so: laSo, quan_he: quanHe,
        nguoi_kia: {
          birth_date: iso,
          ...(lich === "am" ? { calendar_type: "am", ...(nhuan ? { am_nhuan: true } : {}) } : {}),
          ...(gio ? { birth_time: gio } : {}),
          ...(gioiTinh === "nam" || gioiTinh === "nu" ? { gender: gioiTinh } : {}),
          ...(noiSinh ? { noi_sinh: noiSinh } : {}),
          ...(noiSinh === NUOC_NGOAI && muiGio ? { mui_gio: muiGio } : {}),
          ...(canVung && (vung === "north" || vung === "south") ? { vung } : {}),
        },
      };
      const r = await postJson<HopThamOutputT>("/api/tuvi/hop-tham", than);
      setKq(r);
      setYeuCau(than);
      setVaoNT({
        quan_he: quanHe, lich_nhap: lich, ngay: d, thang: m, nam: y, ...(lich === "am" && nhuan ? { am_nhuan: true } : {}),
        ...(gio ? { gio, do_tin_gio: "exact" as const } : {}),
        ...(gioiTinh === "nam" || gioiTinh === "nu" ? { gioi_tinh: gioiTinh } : {}),
        ...(noiSinh ? { noi_sinh: noiSinh } : {}),
        ...(noiSinh === NUOC_NGOAI && muiGio ? { mui_gio: muiGio } : {}),
        ...(canVung && (vung === "north" || vung === "south") ? { vung } : {}),
      });
      // Đo: chỉ mã (quan hệ, mức điểm) — không ngày sinh, không điểm số cá nhân.
      ghi("chart_interacted", { mo_dun: "tuvi", kind: "hop_tham_xem", quan_he: quanHe, ...(r.diem ? { muc: r.diem.muc } : {}) });
    } catch (e2) {
      setLoi(e2 instanceof Error ? e2.message : c("ht.loi"));
    } finally {
      setDang(false);
    }
  }

  // NT-1: điền sẵn từ người thân đã lưu (người dùng vẫn tự bấm "Xem độ hợp").
  const dienTu = (nt: NguoiThan) => {
    setQuanHe(nt.quan_he); setLich(nt.lich_nhap);
    setNgay(String(nt.ngay)); setThang(String(nt.thang)); setNam(String(nt.nam)); setNhuan(Boolean(nt.am_nhuan));
    setGio(nt.do_tin_gio === "unknown" ? "" : nt.gio ?? ""); setGioiTinh(nt.gioi_tinh ?? ""); setNoiSinh(nt.noi_sinh ?? ""); setVung(nt.vung ?? ""); setMuiGio(nt.mui_gio ?? "");
    setLoi(null);
  };

  if (kq) return <TenHienProvider ten={[(kq as { ten_hien?: Record<string, Record<string, string>> }).ten_hien]}><KetQuaHopTham kq={kq} yeuCau={yeuCau} vaoNT={vaoNT} onHoi={onHoi} onLai={() => setKq(null)} /></TenHienProvider>;

  return (
    <form onSubmit={xem} className="space-y-5" noValidate data-testid="hop-tham-form">
      <p className="rounded-xl bg-surface-2/50 px-3 py-2 text-sm text-fg-muted">
        {c("ht.gioi_thieu_1")}<b className="text-fg">{c("ht.gioi_thieu_2")}</b>{c("ht.gioi_thieu_3")}
        {/* Trục 2 UX: trang Hợp đôi (thần số) nói "không chấm điểm" → giải thích ngắn vì sao riêng mảng này có điểm. */}
        <span className="mt-1.5 block text-xs" data-testid="hop-tham-vi-sao-diem">
          {c("ht.vi_sao_diem_1")}{!en && <><Link href="/hop-doi" className="text-gold underline">{c("ht.vi_sao_diem_link")}</Link>{c("ht.vi_sao_diem_2")}</>}
        </span>
      </p>
      <ChonTuNguoiThan onChon={dienTu} />
      <fieldset>
        <legend className="text-sm font-medium text-fg-muted">{c("ht.nguoi_ay_la")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUAN_HE_HOP_THAM.map((q) => (
            <button key={q} type="button" onClick={() => setQuanHe(q)} aria-pressed={quanHe === q} data-testid={`hop-tham-quan-he-${q}`}
              className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                quanHe === q ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg")}>
              {en ? c(`qh.${q}`) : TEN_QUAN_HE[q]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-medium text-fg-muted">{c("ht.ngay_sinh")}</legend>
          <div role="radiogroup" aria-label={c("ht.loai_lich")} className="flex rounded-full border border-line p-0.5 text-xs">
            {(["duong", "am"] as const).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lich === l} onClick={() => setLich(l)}
                className={cn("vung-cham rounded-full px-3 py-1.5 transition-colors", lich === l ? "bg-gold text-bg" : "text-fg-muted hover:text-fg")}>
                {l === "duong" ? c("f.duong_lich") : c("f.am_lich")}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
          <Input aria-label={c("ht.o_ngay")} inputMode="numeric" placeholder={c("f.ngay")} value={ngay} className="text-center" onChange={(e) => setNgay(chiSo(e.target.value, 2))} />
          <Input aria-label={c("ht.o_thang")} inputMode="numeric" placeholder={c("f.thang")} value={thang} className="text-center" onChange={(e) => setThang(chiSo(e.target.value, 2))} />
          <Input aria-label={c("ht.o_nam")} inputMode="numeric" placeholder={c("f.nam")} value={nam} className="text-center" onChange={(e) => setNam(chiSo(e.target.value, 4))} />
        </div>
        {lich === "am" && (
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input type="checkbox" checked={nhuan} onChange={(e) => setNhuan(e.target.checked)} className="size-4 accent-[rgb(var(--gold))]" /> {c("f.thang_nhuan")}
          </label>
        )}
      </fieldset>

      <fieldset className="rounded-xl border border-line/70 p-4">
        <legend className="px-1 text-sm text-fg-muted">{c("ht.khong_bat_buoc_1")}<b className="text-fg">{c("ht.khong_bat_buoc_2")}</b></legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ht-gio">{c("f.gio_sinh")}</Label>
            <Input id="ht-gio" type="time" value={gio} onChange={(e) => setGio(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ht-gioi-tinh">{c("f.gioi_tinh")}</Label>
            <Select id="ht-gioi-tinh" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value)}>
              <option value="">{c("f.chon")}</option>
              <option value="nam">{c("f.nam_gioi")}</option>
              <option value="nu">{c("f.nu_gioi")}</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ht-noi-sinh">{c("f.noi_sinh")}</Label>
            <Select id="ht-noi-sinh" value={noiSinh} onChange={(e) => setNoiSinh(e.target.value)} disabled={!tinh && !loiTinh}>
              <option value="">{tinh ? c("f.chon_tinh") : c("f.dang_tai")}</option>
              <option value={NUOC_NGOAI}>{c("f.nuoc_ngoai")}</option>
              {tinh?.map((t) => <option key={t.ma} value={t.ma}>{t.ten}</option>)}
            </Select>
            {loiTinh && <button type="button" onClick={taiLaiTinh} className="text-xs text-cinnabar underline">{loiTinh} {c("f.thu_lai")}</button>}
          </div>
          {noiSinh === NUOC_NGOAI && <div className="sm:col-span-3"><ChonNuocThanhPho id="ht" giaTri={muiGio} doi={setMuiGio} /></div>}
          {canVung && (
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="ht-vung">{c("f.vung")}</Label>
              <Select id="ht-vung" value={vung} onChange={(e) => setVung(e.target.value)}>
                <option value="">{c("f.chon")}</option>
                <option value="north">{c("f.bo_bac")}</option>
                <option value="south">{c("f.bo_nam")}</option>
              </Select>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-fg-faint">
          {duLa ? c("ht.du_la") : gioiTinh ? c("ht.co_gioi") : c("ht.chi_ngay")}
        </p>
      </fieldset>

      {loi && <p role="alert" className="rounded-xl bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">{loi}</p>}
      <Button type="submit" className="w-full sm:w-auto" disabled={dang}>
        <HeartHandshake aria-hidden /> {dang ? c("ht.dang_xem") : c("ht.xem")}
      </Button>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-faint">
        <span className="inline-flex items-center gap-1.5"><Lock className="size-3.5" aria-hidden /> {c("ht.rieng_tu")}</span>
        {/* EN-ALL: Hợp đôi chưa có bản Anh → bỏ lối mời (bản Việt giữ nguyên). */}
        {!en && <Link href="/hop-doi" className="inline-flex items-center gap-1 text-gold underline"><Send className="size-3.5" aria-hidden />{c("ht.gui_link")}</Link>}
      </p>
    </form>
  );
}

function DanhSachHoa({ ds, tieuDe, moTa, testId }: { ds: HoaVaoT[]; tieuDe: string; moTa: string; testId: string }) {
  const { c, ten, hoa } = useChuTuVi();
  return (
    <div data-testid={testId}>
      <h3 className="font-serif text-lg text-fg">{tieuDe}</h3>
      <p className="text-xs text-fg-faint">{moTa}</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {ds.map((h) => (
          <li key={h.hoa + h.sao} className="rounded-xl border border-line/60 p-3 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", MAU_HOA_DIU[h.hoa] ?? "bg-surface-2")}>{c("ht.hoa", { hoa: hoa(h.hoa) })}</span>
              <span className="text-fg">{ten("sao", h.sao)} → <b>{h.den_cung ? ten("cung", h.den_cung) : "—"}</b></span>
              {h.xung_cung && <span className="text-xs text-fg-faint">{c("ht.chieu", { cung: ten("cung", h.xung_cung) })}</span>}
            </p>
            {h.nghia && <p className="mt-1.5 leading-relaxed text-fg-muted">{h.nghia}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KetQuaHopTham({ kq, yeuCau, vaoNT, onHoi, onLai }: {
  kq: HopThamOutputT; yeuCau: Record<string, unknown> | null; vaoNT: NguoiThanVao | null; onHoi: (cau: string) => void; onLai: () => void;
}) {
  // Khung hỏi đáp chỉ biết lá số của bạn → câu hỏi thêm hướng về cung của chính bạn mà người ấy chạm vào.
  const { c, ten, en } = useChuTuVi();
  const cungHoi = (kq.nguoi_kia_vao_ban.find((h) => h.hoa === "Kỵ") ?? kq.nguoi_kia_vao_ban[0])?.den_cung;
  const d = kq.diem;
  const hop = d ? [...d.diem_manh, ...d.can_dung_hoa] : [];
  // "x% trong N người thấy đúng" (≥ 30 phiếu) — một lời gọi cho mọi mã hộp; số engine gắn sẵn (`ty_le_dung`) ưu tiên.
  const cachDoc = kq.cach_doc_them ?? [];
  const tyLe = useTyLe([...hop.map((h) => h.ma_mau), ...cachDoc.map((h) => h.ma_mau)].filter((m): m is string => Boolean(m)));
  return (
    <div className="space-y-5" data-testid="hop-tham-ket-qua">
      <p className="text-sm text-fg-muted">
        {c("ht.quan_he", { qh: kq.nhan_quan_he })}<b className="text-fg">{ten("can", kq.can_nam_nguoi_kia)}</b>.
      </p>
      {d && <DiemHaiNguoi diem={d} />}

      {hop.length > 0 && d && (
        // Kiểm chứng loại "hai_nguoi" (migration 0021): mã hn.* do engine dựng, phái = phiên bản luật chấm (hai_nguoi_1).
        // Chưa chạy 0021 → máy chủ không lưu, PostHog vẫn đo (người dùng không thấy lỗi).
        <KiemChungBai.Provider value={{ tyLe, phai: d.phien_ban, loai: "hai_nguoi" }}>
          <div className="grid gap-3 sm:grid-cols-2" data-testid="hai-nguoi-hop">
            {hop.map((h) => <HopNoiBat key={h.ma_mau ?? h.tieu_de} hop={h} />)}
          </div>
        </KiemChungBai.Provider>
      )}

      {cachDoc.length > 0 && (
        // TV-YBS đợt 4: ý Tử vi bổ sung về Phu Thê / Mệnh hai lá — lời diễn giải, KHÔNG tính vào điểm. Kiểm chứng loại
        // "doi_song" (mã ds.hai.*, migration 0017), phái = trường phái engine ghi trong từng hộp.
        <section aria-labelledby="hai-nguoi-cach-doc" data-testid="hai-nguoi-cach-doc">
          <h3 id="hai-nguoi-cach-doc" className="font-sans text-[1.02rem] font-semibold text-fg">{c("ht.cach_doc")}</h3>
          <p className="mt-0.5 text-xs text-fg-faint">{c("ht.cach_doc_mo_ta")}</p>
          <KiemChungBai.Provider value={{ tyLe, phai: cachDoc[0]?.phai ?? "nam_phai_viet", loai: "doi_song" }}>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {cachDoc.map((h) => <HopNoiBat key={h.ma_mau} hop={h} />)}
            </div>
          </KiemChungBai.Provider>
        </section>
      )}

      {d && d.goi_y.length > 0 && (
        <section className="rounded-2xl border border-line/70 p-4" aria-labelledby="hai-nguoi-goi-y" data-testid="hai-nguoi-goi-y">
          <h3 id="hai-nguoi-goi-y" className="flex items-center gap-2 font-sans text-[1.02rem] font-semibold text-fg">
            <ListChecks className="size-4 text-gold" aria-hidden /> {c("ht.ba_viec")}
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.95rem] text-fg-muted">{d.goi_y.map((g) => <li key={g}>{g}</li>)}</ol>
        </section>
      )}

      <details className="group rounded-xl border border-line/70 px-3 py-2 text-sm" data-testid="hop-tham-chi-tiet">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-fg-muted hover:text-fg">
          <span>{c("ht.chi_tiet")}</span>
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-3 space-y-5">
          <p><NhanLop lop="tinh" /></p>
          <DanhSachHoa ds={kq.nguoi_kia_vao_ban} testId="hop-tham-kia-vao-ban" tieuDe={c("ht.kia_vao_ban")}
            moTa={c("ht.kia_vao_ban_mo_ta", { can: ten("can", kq.can_nam_nguoi_kia) })} />
          {kq.ban_vao_nguoi_kia && kq.ban_vao_nguoi_kia.length > 0 && (
            <DanhSachHoa ds={kq.ban_vao_nguoi_kia} testId="hop-tham-ban-vao-kia" tieuDe={c("ht.ban_vao_kia")} moTa={c("ht.ban_vao_kia_mo_ta")} />
          )}
          {kq.menh_nguoi_kia_vao_ban && kq.menh_nguoi_kia_vao_ban.length > 0 && (
            <DanhSachHoa ds={kq.menh_nguoi_kia_vao_ban} testId="hop-tham-menh-kia" tieuDe={c("ht.menh_kia")} moTa={c("ht.menh_kia_mo_ta")} />
          )}
          {kq.tom_tat.length > 0 && (
            <div>
              <NhanLop lop="giai" />
              <ul className="mt-1 space-y-1 text-sm text-fg">{kq.tom_tat.map((t) => <li key={t}>· {t}</li>)}</ul>
            </div>
          )}
        </div>
      </details>
      {!kq.ban_vao_nguoi_kia && <p className="text-xs text-fg-faint">{c("ht.them_gio")}</p>}
      {kq.luu_y.length > 0 && <p className="text-xs text-fg-faint">{kq.luu_y.join(" ")}</p>}
      <div className="flex flex-wrap gap-2">
        {cungHoi && (
          <Button size="sm" variant="ghost" onClick={() => onHoi(c("ct.cau_cung", { cung: ten("cung", cungHoi) }))}>
            <MessageCircleQuestion aria-hidden /> {c("ht.hoi_cung", { cung: ten("cung", cungHoi) })}
          </Button>
        )}
        {/* EN-ALL: thẻ chia sẻ (ảnh chữ Việt — GĐ 9) và Hợp đôi chưa có bản Anh → bản Anh không hiện hai lối này. */}
        {d && yeuCau && !en && <NutChiaSeHai yeuCau={yeuCau} />}
        <Button size="sm" variant="secondary" onClick={onLai}>{c("ht.xem_khac")}</Button>
        {!en && <Button asChild size="sm" variant="ghost">
          <Link href="/hop-doi"><Send aria-hidden /> {c("ht.gui_tu_xem")}</Link>
        </Button>}
        {vaoNT && <LuuSauHopTham vao={vaoNT} />}
      </div>
    </div>
  );
}
