"use client";
// Lịch Quyết Định 12 Tháng cho Chủ DN / Quản lý — Bát Tự Lưu Nguyệt + Thần Số + Hoàng Lịch (Zero-PII).
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Compass, Shield, Sparkles } from "lucide-react";
import { useHoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";

type CapQuanLy = "chu_dn" | "giam_doc" | "truong_nhom";
type MucTieu = "tang_truong" | "ky_ket" | "giu_tien" | "ra_mat";
type NhipThang = "day_manh" | "can_bang" | "phong_thu";

interface NgayDep {
  ngay: string;
  am: string;
  can_chi: string;
  truc: string;
  dep: boolean;
  hoang_dao: boolean;
  luu_y_ngay?: string[];
}

interface ThangQuyetDinh {
  thang: number;
  can_chi_thang: string;
  hanh_thang: string;
  thang_ca_nhan: number;
  chu_de_thang: string;
  nhip_thang: NhipThang;
  nhan_nhip: string;
  nen_lam: string;
  nen_chu_y: string;
  ngay_dep: NgayDep[];
}

interface KetQuaLich12 {
  nam_xem: number;
  muc_tieu: { ma: string; ten: string; mo_ta: string };
  ho_so_nguoi_xem: { nhat_chu_hanh: string; hanh_can_bu: string[]; duong_doi: number; nam_ca_nhan: number };
  tong_quan_nam: {
    thang_day_manh: number[];
    thang_phong_thu: number[];
    nhan_dinh_nam: string;
    canh_bao_chung: string;
  };
  muoi_hai_thang: ThangQuyetDinh[];
  ranh_gioi_phap_ly: string;
}

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
  const namMacDinh = Math.min(2050, Math.max(2020, new Date().getFullYear()));
  const [ngay, setNgay] = useState("15");
  const [thang, setThang] = useState("8");
  const [nam, setNam] = useState("1986");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [namXem, setNamXem] = useState(namMacDinh);
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
          nam_xem: namXem,
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
    } catch {
      setLoi("Không kết nối được máy tính toán. Vui lòng thử lại sau giây lát.");
    } finally {
      setDangTinh(false);
    }
  }

  const dsLoc = kq ? kq.muoi_hai_thang.filter((t) => loc === "tat_ca" || t.nhip_thang === loc) : [];

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
          Gộp Lưu Nguyệt Bát Tự, Tháng cá nhân và ngày đẹp Hoàng Lịch để lên nhịp kinh doanh cả năm,
          chọn sẵn 3 khung ngày thuận lợi ký kết hoặc ra mắt mỗi tháng. Ngày sinh chỉ dùng để tính, không lưu lại.
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
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="l12-gt">Giới tính &amp; Năm xem</label>
              <div className="grid grid-cols-2 gap-1.5">
                <select id="l12-gt" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value as "nam" | "nu")}
                  className="rounded-lg border border-line bg-bg/70 px-2.5 py-2 text-sm text-fg">
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                </select>
                <select aria-label="Năm xem" value={namXem} onChange={(e) => setNamXem(Number(e.target.value))}
                  className="rounded-lg border border-line bg-bg/70 px-2.5 py-2 text-sm text-fg">
                  {[namMacDinh, namMacDinh + 1, namMacDinh + 2].map((y) => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
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
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="l12-mt">Trọng tâm năm</label>
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
            {dangTinh ? "Đang lập lịch 12 tháng…" : `Lập Lịch Quyết Định năm ${namXem}`}
          </button>
        </form>
      </section>

      {kq && (
        <div className="space-y-6" data-testid="ket-qua-lich-12-thang">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-jade/35 bg-jade/[0.06] p-4">
              <p className="text-xs font-medium text-jade">Tháng thuận lợi đẩy mạnh</p>
              <p className="mt-1 font-serif text-xl text-fg">
                {kq.tong_quan_nam.thang_day_manh.length > 0
                  ? kq.tong_quan_nam.thang_day_manh.map((m) => `T${m}`).join(" · ")
                  : "Nhịp đều cả năm"}
              </p>
            </div>
            <div className="rounded-2xl border border-[#f0b35c]/35 bg-[#f0b35c]/[0.06] p-4">
              <p className="text-xs font-medium text-[#f0b35c]">Tháng nên phòng thủ &amp; giữ tiền</p>
              <p className="mt-1 font-serif text-xl text-fg">
                {kq.tong_quan_nam.thang_phong_thu.length > 0
                  ? kq.tong_quan_nam.thang_phong_thu.map((m) => `T${m}`).join(" · ")
                  : "Không có tháng xung mạnh"}
              </p>
            </div>
            <div className="rounded-2xl border border-gold/35 bg-gold/[0.06] p-4">
              <p className="text-xs font-medium text-gold">Trục cá nhân năm {kq.nam_xem}</p>
              <p className="mt-1 font-serif text-xl text-fg">
                Nhật chủ {kq.ho_so_nguoi_xem.nhat_chu_hanh} · Năm số {kq.ho_so_nguoi_xem.nam_ca_nhan}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-line/80 bg-surface/50 p-4 text-sm leading-relaxed text-fg">
            <p>{kq.tong_quan_nam.nhan_dinh_nam}</p>
            <p className="mt-2 text-xs text-fg-muted">{kq.tong_quan_nam.canh_bao_chung}</p>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc nhịp tháng">
            {([
              ["tat_ca", "Tất cả 12 tháng"],
              ["day_manh", "Đẩy mạnh"],
              ["can_bang", "Cân bằng"],
              ["phong_thu", "Phòng thủ"],
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
                <article key={t.thang} className="flex flex-col justify-between rounded-2xl border border-line/80 bg-surface/40 p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-serif text-lg text-fg">Tháng {t.thang}/{kq.nam_xem}</p>
                        <p className="text-xs text-fg-faint">{t.can_chi_thang} ({t.hanh_thang}) · Tháng cá nhân {t.thang_ca_nhan}</p>
                      </div>
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-medium", badgeCls)}>
                        {t.nhan_nhip}
                      </span>
                    </div>

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
                  </div>

                  {t.ngay_dep.length > 0 && (
                    <div className="mt-4 border-t border-line/60 pt-3">
                      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-gold">
                        <Compass className="size-3" aria-hidden /> Ngày đẹp tham khảo
                      </p>
                      <ul className="mt-1.5 space-y-1 text-xs text-fg-muted">
                        {t.ngay_dep.map((nd) => (
                          <li key={nd.ngay} className="flex flex-wrap items-center justify-between gap-1">
                            <span className="font-medium text-fg">{formatNgayVN(nd.ngay)} <span className="font-normal text-fg-faint">(Âm {nd.am})</span></span>
                            <span className="truncate text-[11px]">
                              {nd.can_chi} · Trực {nd.truc}
                              {nd.luu_y_ngay && nd.luu_y_ngay.length > 0 ? ` · Lưu ý: ${nd.luu_y_ngay.join(", ")}` : ""}
                            </span>
                          </li>
                        ))}
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
