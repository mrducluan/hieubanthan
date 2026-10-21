"use client";
// TV-V2 + HN-2N — "Xem lá số 2 người" (tên mã cũ: hợp tham): can năm sinh người kia "phi hoá" vào lá số của bạn (và
// chiều ngược lại khi người kia đủ giờ + giới tính + nơi sinh), kèm ĐIỂM THAM KHẢO hợp – khắc 0–100 theo 5 tiêu chí
// (chủ dự án chốt 2026-10-21, chỉ cho phần Tử vi 2 người). Engine tính hết, web chỉ hiển thị.
// Ngày sinh người kia chỉ gửi đi để tính, không lưu (không localStorage, không tài khoản).
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, HeartHandshake, ListChecks, Lock, MessageCircleQuestion, Send } from "lucide-react";
import { QUAN_HE_HOP_THAM, type ChartInputVao, type HoaVaoT, type HopThamOutputT } from "@/app/api/tuvi/schema";
import { DiemHaiNguoi } from "@/components/huyen-hoc/DiemHaiNguoi";
import { NhanLop } from "@/components/huyen-hoc/KhoiMoLuoi";
import { HopNoiBat, KiemChungBai } from "@/components/luan-giai/HopNoiBat";
import { MAU_HOA_DIU } from "@/components/huyen-hoc/PhiHoa";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDanhSachTinh } from "@/lib/dia-ly";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { ngayHopLe, NUOC_NGOAI } from "@/lib/hoso";
import { cn } from "@/lib/utils";

type MaQuanHe = (typeof QUAN_HE_HOP_THAM)[number];
const TEN_QUAN_HE: Record<MaQuanHe, string> = {
  nguoi_yeu: "Người yêu", vo_chong: "Vợ / chồng", ban_be: "Bạn bè", dong_nghiep: "Đồng nghiệp",
  doi_tac: "Đối tác", sep: "Sếp", cha_me_con: "Cha mẹ – con", gia_dinh: "Gia đình",
};

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
  const [vung, setVung] = useState("");
  const [kq, setKq] = useState<HopThamOutputT | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const { tinh, loi: loiTinh, thuLai: taiLaiTinh } = useDanhSachTinh();

  const d = Number(ngay), m = Number(thang), y = Number(nam);
  const iso = `${nam}-${p2(thang)}-${p2(ngay)}`;
  const tinhChon = tinh?.find((t) => t.ma === noiSinh);
  // Quảng Trị trước 13/6/1975 vắt ngang vĩ tuyến 17 → hỏi bờ sông (như hồ sơ). Chỉ so chuỗi ngày, không tính lịch.
  const canVung = Boolean(noiSinh) && tinhChon?.vung === null && nam.length === 4 && iso < "1975-06-13";
  const duLa = Boolean(gio && gioiTinh && noiSinh);

  async function xem(e: React.FormEvent) {
    e.preventDefault();
    const hopLe = nam.length === 4 && y >= 1900 && m >= 1 && m <= 12 && (lich === "am" ? d >= 1 && d <= 30 : ngayHopLe(d, m, y));
    if (!hopLe) return setLoi(`Ngày sinh người ấy chưa đúng (${lich === "am" ? "âm" : "dương"} lịch).`);
    if (lich === "duong" && Date.UTC(y, m - 1, d) > Date.now()) return setLoi("Ngày sinh người ấy chưa tới.");
    setLoi(null); setDang(true);
    try {
      const r = await postJson<HopThamOutputT>("/api/tuvi/hop-tham", {
        la_so: laSo, quan_he: quanHe,
        nguoi_kia: {
          birth_date: iso,
          ...(lich === "am" ? { calendar_type: "am", ...(nhuan ? { am_nhuan: true } : {}) } : {}),
          ...(gio ? { birth_time: gio } : {}),
          ...(gioiTinh === "nam" || gioiTinh === "nu" ? { gender: gioiTinh } : {}),
          ...(noiSinh ? { noi_sinh: noiSinh } : {}),
          ...(canVung && (vung === "north" || vung === "south") ? { vung } : {}),
        },
      });
      setKq(r);
      // Đo: chỉ mã (quan hệ, mức điểm) — không ngày sinh, không điểm số cá nhân.
      ghi("chart_interacted", { mo_dun: "tuvi", kind: "hop_tham_xem", quan_he: quanHe, ...(r.diem ? { muc: r.diem.muc } : {}) });
    } catch (e2) {
      setLoi(e2 instanceof Error ? e2.message : "Chưa tính được lúc này.");
    } finally {
      setDang(false);
    }
  }

  if (kq) return <KetQuaHopTham kq={kq} onHoi={onHoi} onLai={() => setKq(null)} />;

  return (
    <form onSubmit={xem} className="space-y-5" noValidate data-testid="hop-tham-form">
      <p className="rounded-xl bg-surface-2/50 px-3 py-2 text-sm text-fg-muted">
        Chấm <b className="text-fg">điểm tham khảo 0–100</b> theo năm mặt: bản mệnh năm sinh, cách nghĩ, con giáp, chỗ ở (cung phi) và
        lá số Tử vi chạm nhau — kèm cách dung hoà theo đúng quan hệ bạn chọn. Điểm theo luật dân gian và sách cổ; mối quan hệ do cách
        hai người cư xử.
      </p>
      <fieldset>
        <legend className="text-sm font-medium text-fg-muted">Người ấy là</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUAN_HE_HOP_THAM.map((q) => (
            <button key={q} type="button" onClick={() => setQuanHe(q)} aria-pressed={quanHe === q} data-testid={`hop-tham-quan-he-${q}`}
              className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                quanHe === q ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg")}>
              {TEN_QUAN_HE[q]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-medium text-fg-muted">Ngày sinh người ấy</legend>
          <div role="radiogroup" aria-label="Loại lịch (người ấy)" className="flex rounded-full border border-line p-0.5 text-xs">
            {(["duong", "am"] as const).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lich === l} onClick={() => setLich(l)}
                className={cn("vung-cham rounded-full px-3 py-1.5 transition-colors", lich === l ? "bg-gold text-bg" : "text-fg-muted hover:text-fg")}>
                {l === "duong" ? "Dương lịch" : "Âm lịch"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
          <Input aria-label="Ngày sinh người ấy" inputMode="numeric" placeholder="Ngày" value={ngay} className="text-center" onChange={(e) => setNgay(chiSo(e.target.value, 2))} />
          <Input aria-label="Tháng sinh người ấy" inputMode="numeric" placeholder="Tháng" value={thang} className="text-center" onChange={(e) => setThang(chiSo(e.target.value, 2))} />
          <Input aria-label="Năm sinh người ấy" inputMode="numeric" placeholder="Năm" value={nam} className="text-center" onChange={(e) => setNam(chiSo(e.target.value, 4))} />
        </div>
        {lich === "am" && (
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input type="checkbox" checked={nhuan} onChange={(e) => setNhuan(e.target.checked)} className="size-4 accent-[rgb(var(--gold))]" /> Tháng nhuận
          </label>
        )}
      </fieldset>

      <fieldset className="rounded-xl border border-line/70 p-4">
        <legend className="px-1 text-sm text-fg-muted">Không bắt buộc — <b className="text-fg">có giới tính thì tính thêm cung phi; đủ giờ, giới tính và nơi sinh thì xem được hai chiều</b></legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ht-gio">Giờ sinh</Label>
            <Input id="ht-gio" type="time" value={gio} onChange={(e) => setGio(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ht-gioi-tinh">Giới tính</Label>
            <Select id="ht-gioi-tinh" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value)}>
              <option value="">— Chọn —</option>
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ht-noi-sinh">Nơi sinh</Label>
            <Select id="ht-noi-sinh" value={noiSinh} onChange={(e) => setNoiSinh(e.target.value)} disabled={!tinh && !loiTinh}>
              <option value="">{tinh ? "— Chọn tỉnh/thành —" : "Đang tải…"}</option>
              <option value={NUOC_NGOAI}>Sinh ở nước ngoài</option>
              {tinh?.map((t) => <option key={t.ma} value={t.ma}>{t.ten}</option>)}
            </Select>
            {loiTinh && <button type="button" onClick={taiLaiTinh} className="text-xs text-cinnabar underline">{loiTinh} Thử lại</button>}
          </div>
          {canVung && (
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="ht-vung">Quảng Trị trước 13/6/1975: sinh ở bờ nào sông Bến Hải?</Label>
              <Select id="ht-vung" value={vung} onChange={(e) => setVung(e.target.value)}>
                <option value="">— Chọn —</option>
                <option value="north">Bờ Bắc (Vĩnh Linh)</option>
                <option value="south">Bờ Nam</option>
              </Select>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-fg-faint">
          {duLa ? "Đủ để chấm năm mặt và xem cả chiều bạn tác động lên người ấy."
            : gioiTinh ? "Có giới tính: chấm đủ năm mặt. Thêm giờ và nơi sinh để xem cả chiều bạn tác động lên người ấy."
              : "Chỉ có ngày sinh: chấm bốn mặt (chưa có cung phi) và xem chiều người ấy tác động lên lá số của bạn."}
        </p>
      </fieldset>

      {loi && <p role="alert" className="rounded-xl bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">{loi}</p>}
      <Button type="submit" className="w-full sm:w-auto" disabled={dang}>
        <HeartHandshake aria-hidden /> {dang ? "Đang xem…" : "Xem độ hợp"}
      </Button>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-faint">
        <span className="inline-flex items-center gap-1.5"><Lock className="size-3.5" aria-hidden /> Dữ liệu người ấy chỉ dùng để tính, không lưu lại.</span>
        <Link href="/hop-doi" className="inline-flex items-center gap-1 text-gold underline"><Send className="size-3.5" aria-hidden />Không biết ngày sinh? Gửi link để người ấy tự nhập</Link>
      </p>
    </form>
  );
}

function DanhSachHoa({ ds, tieuDe, moTa, testId }: { ds: HoaVaoT[]; tieuDe: string; moTa: string; testId: string }) {
  return (
    <div data-testid={testId}>
      <h3 className="font-serif text-lg text-fg">{tieuDe}</h3>
      <p className="text-xs text-fg-faint">{moTa}</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {ds.map((h) => (
          <li key={h.hoa + h.sao} className="rounded-xl border border-line/60 p-3 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", MAU_HOA_DIU[h.hoa] ?? "bg-surface-2")}>Hoá {h.hoa}</span>
              <span className="text-fg">{h.sao} → <b>{h.den_cung ?? "—"}</b></span>
              {h.xung_cung && <span className="text-xs text-fg-faint">chiếu {h.xung_cung}</span>}
            </p>
            {h.nghia && <p className="mt-1.5 leading-relaxed text-fg-muted">{h.nghia}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KetQuaHopTham({ kq, onHoi, onLai }: { kq: HopThamOutputT; onHoi: (cau: string) => void; onLai: () => void }) {
  // Khung hỏi đáp chỉ biết lá số của bạn → câu hỏi thêm hướng về cung của chính bạn mà người ấy chạm vào.
  const cungHoi = (kq.nguoi_kia_vao_ban.find((h) => h.hoa === "Kỵ") ?? kq.nguoi_kia_vao_ban[0])?.den_cung;
  const d = kq.diem;
  const hop = d ? [...d.diem_manh, ...d.can_dung_hoa] : [];
  return (
    <div className="space-y-5" data-testid="hop-tham-ket-qua">
      <p className="text-sm text-fg-muted">
        {kq.nhan_quan_he} · người ấy sinh năm can <b className="text-fg">{kq.can_nam_nguoi_kia}</b>.
      </p>
      {d && <DiemHaiNguoi diem={d} />}

      {hop.length > 0 && (
        // Mã hn.* chưa có loại kiểm chứng riêng ở máy chủ → tắt nút "Đúng với mình" trong khối này.
        <KiemChungBai.Provider value={{ tyLe: {}, phai: "nam_phai_viet", tat: true }}>
          <div className="grid gap-3 sm:grid-cols-2" data-testid="hai-nguoi-hop">
            {hop.map((h) => <HopNoiBat key={h.ma_mau ?? h.tieu_de} hop={h} />)}
          </div>
        </KiemChungBai.Provider>
      )}

      {d && d.goi_y.length > 0 && (
        <section className="rounded-2xl border border-line/70 p-4" aria-labelledby="hai-nguoi-goi-y" data-testid="hai-nguoi-goi-y">
          <h3 id="hai-nguoi-goi-y" className="flex items-center gap-2 font-sans text-[1.02rem] font-semibold text-fg">
            <ListChecks className="size-4 text-gold" aria-hidden /> Ba việc nên làm cùng nhau
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.95rem] text-fg-muted">{d.goi_y.map((g) => <li key={g}>{g}</li>)}</ol>
        </section>
      )}

      <details className="group rounded-xl border border-line/70 px-3 py-2 text-sm" data-testid="hop-tham-chi-tiet">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-fg-muted hover:text-fg">
          <span>Đường bay tứ hoá chi tiết (cho người rành Tử vi)</span>
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-3 space-y-5">
          <p><NhanLop lop="tinh" /></p>
          <DanhSachHoa ds={kq.nguoi_kia_vao_ban} testId="hop-tham-kia-vao-ban" tieuDe="Người ấy chạm vào lá số của bạn"
            moTa={`Can năm ${kq.can_nam_nguoi_kia} làm bốn sao hoá — chúng nằm ở các cung này trên lá số của bạn.`} />
          {kq.ban_vao_nguoi_kia && kq.ban_vao_nguoi_kia.length > 0 && (
            <DanhSachHoa ds={kq.ban_vao_nguoi_kia} testId="hop-tham-ban-vao-kia" tieuDe="Bạn chạm vào lá số của người ấy" moTa="Can năm sinh của bạn trên lá số người ấy." />
          )}
          {kq.menh_nguoi_kia_vao_ban && kq.menh_nguoi_kia_vao_ban.length > 0 && (
            <DanhSachHoa ds={kq.menh_nguoi_kia_vao_ban} testId="hop-tham-menh-kia" tieuDe="Cung Mệnh người ấy chạm vào lá số của bạn" moTa="Theo can cung Mệnh của người ấy." />
          )}
          {kq.tom_tat.length > 0 && (
            <div>
              <NhanLop lop="giai" />
              <ul className="mt-1 space-y-1 text-sm text-fg">{kq.tom_tat.map((t) => <li key={t}>· {t}</li>)}</ul>
            </div>
          )}
        </div>
      </details>
      {!kq.ban_vao_nguoi_kia && <p className="text-xs text-fg-faint">Thêm giờ sinh, giới tính và nơi sinh của người ấy để xem chiều ngược lại.</p>}
      {kq.luu_y.length > 0 && <p className="text-xs text-fg-faint">{kq.luu_y.join(" ")}</p>}
      <div className="flex flex-wrap gap-2">
        {cungHoi && (
          <Button size="sm" variant="ghost" onClick={() => onHoi(`Cung ${cungHoi} của tôi nói gì?`)}>
            <MessageCircleQuestion aria-hidden /> Hỏi thêm về cung {cungHoi}
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={onLai}>Xem với người khác</Button>
        <Button asChild size="sm" variant="ghost">
          <Link href="/hop-doi"><Send aria-hidden /> Gửi link để người ấy tự xem</Link>
        </Button>
      </div>
    </div>
  );
}
