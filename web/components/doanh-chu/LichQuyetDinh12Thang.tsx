"use client";
// Lịch Quyết Định 12 Tháng cho Chủ DN / Quản lý — Bát Tự Lưu Nguyệt + Thần Số + Hoàng Lịch (Zero-PII).
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Compass, Shield, Sparkles } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { gioHienThi, useHoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";

type CapQuanLy = "chu_dn" | "giam_doc" | "truong_nhom";
type MucTieu = "tang_truong" | "ky_ket" | "giu_tien" | "ra_mat";
type NhipThang = "day_manh" | "can_bang" | "phong_thu";
type LoaiLop = "thuan" | "can_bang" | "trung";

interface NgayDep {
  ngay: string;
  am: string;
  can_chi: string;
  truc: string;
  dep: boolean;
  hoang_dao: boolean;
  diem_cong?: string[];
  quan_he_tuoi?: string | null;
  ky_dan_gian?: string[];
  luu_y_ngay?: string[];
}

interface LopThang {
  ma: string;
  nhan: string;
  tieu?: string;
  loi?: string;
  loai: LoaiLop;
}

interface ThangQuyetDinh {
  thang: number;
  nam: number;
  nhan_thang: string;
  can_chi_thang: string;
  hanh_thang: string;
  thang_ca_nhan: number;
  chu_de_thang: string;
  nhip_thang: NhipThang;
  nhan_nhip: string;
  nen_lam: string;
  nen_chu_y: string;
  tom_lai?: string;
  lop?: LopThang[];
  can_cu?: string[];
  ngay_dep: NgayDep[];
}

interface KetQuaLich12 {
  tu_thang: string;
  nam_xem: number;
  muc_tieu: { ma: string; ten: string; mo_ta: string };
  ho_so_nguoi_xem: {
    duong_doi: number;
    nam_ca_nhan: number;
    co_gio: boolean;
    thieu_gio: string | null;
    nhat_chu_hanh?: string;
    dung_than_hai_cach?: { cach_1: string[]; cach_2: string[] };
  };
  tong_quan_nam: {
    thang_day_manh: string[];
    thang_phong_thu: string[];
    nhan_dinh_nam: string;
    canh_bao_chung: string;
  };
  muoi_hai_thang: ThangQuyetDinh[];
  ranh_gioi_phap_ly: string;
}

/** Chấm màu từng lớp: thuận = lục, cân bằng = hổ phách, trung tính = xám (không dùng đỏ). */
const CHAM_LOP: Record<LoaiLop, string> = {
  thuan: "bg-jade",
  can_bang: "bg-[#f0b35c]",
  trung: "bg-fg-faint",
};

/** Nhãn quan hệ chi ngày ↔ tuổi do engine trả (mã) → chữ ngắn; mã lạ thì không hiện. */
const HOP_TUOI: Record<string, string> = {
  tam_hop: "Tam hợp tuổi",
  luc_hop: "Lục hợp tuổi",
};
const CHU_Y_TUOI: Record<string, string> = {
  hai: "Hại tuổi",
  xung: "Xung tuổi",
};

const MUC_TIEU_OPT: { ma: MucTieu; ten: string }[] = [
  { ma: "tang_truong", ten: "Mở rộng & Tăng trưởng" },
  { ma: "ky_ket", ten: "Ký kết & Hợp tác" },
  { ma: "giu_tien", ten: "Giữ dòng tiền & Tối ưu" },
  { ma: "ra_mat", ten: "Ra mắt sản phẩm / Chi nhánh" },
];

const CAP_OPT: { ma: CapQuanLy; ten: string }[] = [
  { ma: "chu_dn", ten: "Chủ doanh nghiệp" },
  { ma: "giam_doc", ten: "Giám đốc bộ phận" },
  { ma: "truong_nhom", ten: "Trưởng nhóm" },
];

function formatNgayVN(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}`;
}

export function LichQuyetDinh12Thang() {
  const hoSo = useHoSo();
  const namSau = Math.min(2050, Math.max(2020, new Date().getFullYear() + 1));
  const [ngay, setNgay] = useState("15");
  const [thang, setThang] = useState("8");
  const [nam, setNam] = useState("1986");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  // "toi" = 12 tháng kể từ tháng này (engine tự chọn mốc); "nam_sau" = từ tháng 1 năm sau.
  const [khung, setKhung] = useState<"toi" | "nam_sau">("toi");
  const [capQL, setCapQL] = useState<CapQuanLy>("chu_dn");
  const [mucTieu, setMucTieu] = useState<MucTieu>("tang_truong");
  const [loc, setLoc] = useState<"tat_ca" | NhipThang>("tat_ca");
  const [dangTinh, setDangTinh] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaLich12 | null>(null);

  useEffect(() => {
    if (!hoSo) return;
    setNgay(String(hoSo.ngay));
    setThang(String(hoSo.thang));
    setNam(String(hoSo.nam));
    if (hoSo.gioi_tinh === "nam" || hoSo.gioi_tinh === "nu") {
      setGioiTinh(hoSo.gioi_tinh);
    }
  }, [hoSo]);

  // Giờ sinh chỉ lấy từ hồ sơ khi người dùng thật sự biết giờ (không gửi giờ đại diện 12:00 của "Không biết giờ").
  // Ngày sinh trong form phải trùng hồ sơ thì mới kèm giờ (người dùng gõ ngày khác = xem cho người khác).
  const gioHoSo = gioHienThi(hoSo);
  const cungNguoi = !!hoSo && String(hoSo.ngay) === ngay && String(hoSo.thang) === thang && String(hoSo.nam) === nam;
  const gio = cungNguoi && gioHoSo && /^([01]\d|2[0-3]):[0-5]\d$/.test(gioHoSo) ? gioHoSo : undefined;

  async function xemLich(e: React.FormEvent) {
    e.preventDefault();
    setDangTinh(true);
    setLoi(null);
    try {
      const r = await fetch("/api/doanh-chu/lich-12-thang", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ngay: Number(ngay),
          thang: Number(thang),
          nam: Number(nam),
          gioi_tinh: gioiTinh,
          ...(gio ? { gio } : {}),
          ...(khung === "nam_sau" ? { nam_xem: namSau } : {}),
          cap_quan_ly: capQL,
          muc_tieu: mucTieu,
        }),
      });
      const data = (await r.json().catch(() => null)) as KetQuaLich12 & { error?: string } | null;
      if (!r.ok || !data || !Array.isArray(data.muoi_hai_thang)) {
        setLoi(data?.error ?? "Chưa tính được Lịch 12 tháng lúc này. Vui lòng kiểm tra lại ngày sinh.");
        return;
      }
      setKq(data);
      ghi("chart_interacted", { mo_dun: "doanh_chu", kind: "lich_12_xem", co_gio: !!data.ho_so_nguoi_xem?.co_gio, muc_tieu: mucTieu });
    } catch {
      setLoi("Không kết nối được máy tính toán. Vui lòng thử lại sau giây lát.");
    } finally {
      setDangTinh(false);
    }
  }

  const dsLoc = kq ? kq.muoi_hai_thang.filter((t) => loc === "tat_ca" || t.nhip_thang === loc) : [];
  const hs = kq?.ho_so_nguoi_xem;

  return (
    <div className="space-y-8" data-testid="lich-quyet-dinh-12-thang">
      <section className="glass rounded-2xl border border-line/80 p-5 sm:p-6">
        <p className="eyebrow flex items-center gap-1.5 text-gold">
          <CalendarDays className="size-3.5" aria-hidden /> Lịch Quyết Định 12 Tháng
        </p>
        <h2 className="mt-1 font-serif text-2xl text-fg sm:text-3xl">
          Nhìn trước 12 tháng: tháng nào nên đẩy mạnh, tháng nào nên giữ tiền
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
          Gộp tháng cá nhân thần số, con giáp tháng, sao tháng phong thuỷ, ngày đẹp hoàng lịch — và Bát tự khi có giờ sinh —
          để lên nhịp kinh doanh 12 tháng, chọn sẵn vài ngày thuận lợi ký kết hoặc ra mắt mỗi tháng.
          Ngày sinh chỉ dùng để tính, không lưu lại.
        </p>

        <form onSubmit={(e) => void xemLich(e)} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="l12-ngay">Ngày sinh người điều hành</label>
              <div className="grid grid-cols-3 gap-1.5">
                <input id="l12-ngay" inputMode="numeric" value={ngay} onChange={(e) => setNgay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="Ngày" className="rounded-lg border border-line bg-bg/70 px-2.5 py-2 text-center text-sm text-fg" />
                <input aria-label="Tháng sinh" inputMode="numeric" value={thang} onChange={(e) => setThang(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="Tháng" className="rounded-lg border border-line bg-bg/70 px-2.5 py-2 text-center text-sm text-fg" />
                <input aria-label="Năm sinh" inputMode="numeric" value={nam} onChange={(e) => setNam(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Năm" className="rounded-lg border border-line bg-bg/70 px-2.5 py-2 text-center text-sm text-fg" />
              </div>
              <p className="mt-1 text-[11px] text-fg-faint">
                {gio ? `Giờ sinh từ hồ sơ: ${gio} (đọc thêm Bát tự)` : "Chưa có giờ sinh trong hồ sơ: lịch chưa đọc lớp Bát tự"}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="l12-gt">Giới tính &amp; Khoảng xem</label>
              <div className="grid grid-cols-2 gap-1.5">
                <select id="l12-gt" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value as "nam" | "nu")}
                  className="rounded-lg border border-line bg-bg/70 px-2.5 py-2 text-sm text-fg">
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                </select>
                <select aria-label="Khoảng xem" value={khung} onChange={(e) => setKhung(e.target.value as "toi" | "nam_sau")}
                  className="rounded-lg border border-line bg-bg/70 px-2.5 py-2 text-sm text-fg">
                  <option value="toi">12 tháng tới</option>
                  <option value="nam_sau">Xem trước năm {namSau}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="l12-cap">Vai trò quản lý</label>
              <select id="l12-cap" value={capQL} onChange={(e) => setCapQL(e.target.value as CapQuanLy)}
                className="w-full rounded-lg border border-line bg-bg/70 px-3 py-2 text-sm text-fg">
                {CAP_OPT.map((c) => <option key={c.ma} value={c.ma}>{c.ten}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="l12-mt">Trọng tâm</label>
              <select id="l12-mt" value={mucTieu} onChange={(e) => setMucTieu(e.target.value as MucTieu)}
                className="w-full rounded-lg border border-line bg-bg/70 px-3 py-2 text-sm text-fg">
                {MUC_TIEU_OPT.map((m) => <option key={m.ma} value={m.ma}>{m.ten}</option>)}
              </select>
            </div>
          </div>

          {loi && <p role="alert" className="rounded-xl bg-cinnabar/10 px-4 py-2.5 text-sm text-cinnabar">{loi}</p>}

          <button type="submit" disabled={dangTinh} data-testid="nut-xem-lich-12-thang"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-60">
            <Sparkles className="size-4" aria-hidden />
            {dangTinh ? "Đang lập lịch 12 tháng…" : khung === "nam_sau" ? `Lập Lịch Quyết Định năm ${namSau}` : "Lập Lịch Quyết Định 12 tháng tới"}
          </button>
        </form>
      </section>

      {kq && hs && (
        <div className="space-y-6" data-testid="ket-qua-lich-12-thang">
          <p className="text-sm text-fg-muted">
            12 tháng kể từ <b className="text-fg">{kq.tu_thang}</b> · trọng tâm {kq.muc_tieu.ten.toLowerCase()}
          </p>

          {hs.thieu_gio && (
            <p data-testid="thieu-gio-lich-12" className="flex items-start gap-2 rounded-xl border border-[#f0b35c]/35 bg-[#f0b35c]/[0.06] px-4 py-3 text-xs leading-relaxed text-fg">
              <Clock className="mt-0.5 size-3.5 shrink-0 text-[#f0b35c]" aria-hidden />
              <span>{hs.thieu_gio}</span>
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-jade/35 bg-jade/[0.06] p-4">
              <p className="text-xs font-medium text-jade">Tháng thuận lợi đẩy mạnh</p>
              <p className="mt-1 font-serif text-xl text-fg">
                {kq.tong_quan_nam.thang_day_manh.length > 0 ? kq.tong_quan_nam.thang_day_manh.join(" · ") : "Nhịp đều cả 12 tháng"}
              </p>
            </div>
            <div className="rounded-2xl border border-[#f0b35c]/35 bg-[#f0b35c]/[0.06] p-4">
              <p className="text-xs font-medium text-[#f0b35c]">Tháng nên giữ nhịp &amp; giữ tiền</p>
              <p className="mt-1 font-serif text-xl text-fg">
                {kq.tong_quan_nam.thang_phong_thu.length > 0 ? kq.tong_quan_nam.thang_phong_thu.join(" · ") : "Không có tháng nhiều cách cùng nhắc chậm"}
              </p>
            </div>
            <div className="rounded-2xl border border-gold/35 bg-gold/[0.06] p-4">
              <p className="text-xs font-medium text-gold">Trục cá nhân</p>
              <p className="mt-1 font-serif text-xl text-fg">
                Đường đời {hs.duong_doi} · Năm cá nhân {hs.nam_ca_nhan}
              </p>
              {hs.nhat_chu_hanh && <p className="mt-1 text-xs text-fg-muted">Nhật chủ hành {hs.nhat_chu_hanh}</p>}
            </div>
          </div>

          {hs.dung_than_hai_cach && (
            <div className="rounded-2xl border border-line/80 bg-surface/50 p-4 text-xs leading-relaxed text-fg" data-testid="hai-cach-lich-12">
              <p className="font-medium text-fg">Hành nên bổ sung — Bát tự đọc theo hai cách</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                <li className="rounded-xl border border-line/60 bg-bg/40 px-3 py-2">
                  <span className="text-fg-muted">Cách 1 (cân sức mạnh – yếu):</span>{" "}
                  <b>{hs.dung_than_hai_cach.cach_1.join(", ") || "—"}</b>
                </li>
                <li className="rounded-xl border border-line/60 bg-bg/40 px-3 py-2">
                  <span className="text-fg-muted">Cách 2 (theo tháng sinh):</span>{" "}
                  <b>{hs.dung_than_hai_cach.cach_2.join(", ") || "—"}</b>
                </li>
              </ul>
              <p className="mt-2 text-fg-faint">Hai cách có thể khác nhau; hệ thống không chọn thay bạn.</p>
            </div>
          )}

          <div className="rounded-2xl border border-line/80 bg-surface/50 p-4 text-sm leading-relaxed text-fg">
            <p>{kq.tong_quan_nam.nhan_dinh_nam}</p>
            <p className="mt-2 text-xs text-fg-muted">{kq.tong_quan_nam.canh_bao_chung}</p>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc nhịp tháng">
            {([
              ["tat_ca", "Tất cả 12 tháng"],
              ["day_manh", "Đẩy mạnh"],
              ["can_bang", "Cân bằng"],
              ["phong_thu", "Giữ nhịp"],
            ] as const).map(([ma, ten]) => (
              <button key={ma} type="button" onClick={() => setLoc(ma)} aria-pressed={loc === ma}
                className={cn("rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                  loc === ma ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg")}>
                {ten}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dsLoc.map((t) => {
              const badgeCls =
                t.nhip_thang === "day_manh"
                  ? "border-jade/40 bg-jade/15 text-jade"
                  : t.nhip_thang === "phong_thu"
                    ? "border-[#f0b35c]/40 bg-[#f0b35c]/15 text-[#f0b35c]"
                    : "border-moon/40 bg-moon/15 text-moon";
              return (
                <article key={t.nhan_thang} data-testid="thang-lich-12" className="flex flex-col justify-between rounded-2xl border border-line/80 bg-surface/40 p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-serif text-lg text-fg">Tháng {t.thang}/{t.nam}</p>
                        <p className="text-xs text-fg-faint">{t.can_chi_thang} ({t.hanh_thang}) · Tháng cá nhân {t.thang_ca_nhan}</p>
                      </div>
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-medium", badgeCls)}>
                        {t.nhan_nhip}
                      </span>
                    </div>

                    {t.tom_lai && <p className="mt-3 text-sm leading-relaxed text-fg">{t.tom_lai}</p>}

                    <div className="mt-3 space-y-2.5 text-xs leading-relaxed">
                      <p className="flex items-start gap-1.5 text-fg">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-jade" aria-hidden />
                        <span>{t.nen_lam}</span>
                      </p>
                      <p className="flex items-start gap-1.5 text-fg-muted">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[#f0b35c]" aria-hidden />
                        <span><b className="text-[#f0b35c]">Nên chú ý:</b> {t.nen_chu_y}</span>
                      </p>
                    </div>

                    {t.lop && t.lop.length > 0 && (
                      <ul className="mt-3 space-y-1.5 border-t border-line/60 pt-3 text-xs leading-relaxed" aria-label="Các cách xem tháng">
                        {t.lop.map((l) => (
                          <li key={l.ma} className="flex items-start gap-2">
                            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", CHAM_LOP[l.loai] ?? CHAM_LOP.trung)} aria-hidden />
                            <span>
                              <b className="text-fg">{l.nhan}:</b>{" "}
                              <span className="text-fg-muted">{[l.tieu, l.loi].filter(Boolean).join(". ")}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {t.can_cu && t.can_cu.length > 0 && (
                      <details className="mt-3 text-xs">
                        <summary className="cursor-pointer text-fg-faint hover:text-fg">Vì sao nói vậy</summary>
                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-fg-muted">
                          {t.can_cu.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>

                  {t.ngay_dep.length > 0 && (
                    <div className="mt-4 border-t border-line/60 pt-3">
                      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-gold">
                        <Compass className="size-3" aria-hidden /> Ngày tham khảo
                      </p>
                      <ul className="mt-1.5 space-y-2 text-xs text-fg-muted">
                        {t.ngay_dep.map((nd) => {
                          const hop = nd.quan_he_tuoi ? HOP_TUOI[nd.quan_he_tuoi] : undefined;
                          const chuYTuoi = nd.quan_he_tuoi ? CHU_Y_TUOI[nd.quan_he_tuoi] : undefined;
                          const chuY = [...(nd.ky_dan_gian ?? []), ...(nd.luu_y_ngay ?? []), ...(chuYTuoi ? [chuYTuoi] : [])];
                          return (
                            <li key={nd.ngay}>
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <span className="font-medium text-fg">{formatNgayVN(nd.ngay)} <span className="font-normal text-fg-faint">(Âm {nd.am})</span></span>
                                <span className="text-[11px]">{nd.can_chi} · Trực {nd.truc}</span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {nd.dep && <span className="rounded-full border border-jade/40 bg-jade/10 px-2 py-0.5 text-[10px] text-jade">Ngày đẹp</span>}
                                {nd.hoang_dao && <span className="rounded-full border border-jade/40 bg-jade/10 px-2 py-0.5 text-[10px] text-jade">Hoàng đạo</span>}
                                {hop && <span className="rounded-full border border-jade/40 bg-jade/10 px-2 py-0.5 text-[10px] text-jade">{hop}</span>}
                                {(nd.diem_cong ?? []).map((d) => (
                                  <span key={d} className="rounded-full border border-line px-2 py-0.5 text-[10px] text-fg-muted">{d}</span>
                                ))}
                                {chuY.map((c) => (
                                  <span key={c} className="rounded-full border border-[#f0b35c]/40 bg-[#f0b35c]/10 px-2 py-0.5 text-[10px] text-[#f0b35c]">Lưu ý: {c}</span>
                                ))}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <p className="flex items-start gap-2 rounded-xl border border-line/70 bg-surface/30 px-4 py-3 text-xs leading-relaxed text-fg-faint">
            <Shield className="mt-0.5 size-3.5 shrink-0 text-fg-muted" aria-hidden />
            <span>{kq.ranh_gioi_phap_ly}</span>
          </p>
        </div>
      )}
    </div>
  );
}
