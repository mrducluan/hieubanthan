"use client";
// Kiểm tra Mặt Bằng & Khai Trương Kinh Doanh — Huyền Không Phi Tinh + Mệnh Quái + 5 Ngày Khai Trương (Zero-PII).
import { useEffect, useState } from "react";
import { AlertTriangle, Building2, CalendarCheck, CheckCircle2, Compass, Shield, Sparkles } from "lucide-react";
import { useHoSo } from "@/lib/hoso";

type LoaiHinh = "van_phong" | "cua_hang" | "quan_ca_phe" | "xuong_kho";

interface KhuVuc {
  ma: string;
  ten: string;
  phuong_goi_y: string;
  can_cu: string;
  thuan_loi: string;
  nen_chu_y: string;
}

interface NgayKhaiTruong {
  ngay: string;
  am: string;
  can_chi: string;
  truc: string;
  dep: boolean;
  hoang_dao: boolean;
  luu_y_ngay?: string[];
}

interface KetQuaMatBang {
  loai_hinh: { ma: string; ten: string };
  mat_bang: {
    do_huong: number;
    phuong_huong: string;
    son_toa?: string;
    son_huong?: string;
    canh_bao_kiem_huong?: string | null;
    nam_xay: number;
    van: number;
    cuc_ma: string;
    cuc_ten: string;
    menh_quai: string;
    nhom_menh: string;
  };
  tong_quan: string;
  danh_sach_khu_vuc: KhuVuc[];
  ngay_khai_truong: NgayKhaiTruong[];
  ranh_gioi_phap_ly: string;
}

const LOAI_HINH_OPT: { ma: LoaiHinh; ten: string }[] = [
  { ma: "van_phong", ten: "Văn phòng / Công ty" },
  { ma: "cua_hang", ten: "Cửa hàng / Bán lẻ" },
  { ma: "quan_ca_phe", ten: "Quán cà phê / F&B" },
  { ma: "xuong_kho", ten: "Xưởng sản xuất / Kho" },
];

const HUONG_NHANH: { ten: string; do: number }[] = [
  { ten: "Bắc (0°)", do: 0 },
  { ten: "Đông Bắc (45°)", do: 45 },
  { ten: "Đông (90°)", do: 90 },
  { ten: "Đông Nam (135°)", do: 135 },
  { ten: "Nam (180°)", do: 180 },
  { ten: "Tây Nam (225°)", do: 225 },
  { ten: "Tây (270°)", do: 270 },
  { ten: "Tây Bắc (315°)", do: 315 },
];

function formatNgayVN(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function MatBangKhaiTruong() {
  const hoSo = useHoSo();
  const [loaiHinh, setLoaiHinh] = useState<LoaiHinh>("cua_hang");
  const [doHuong, setDoHuong] = useState("180");
  const [namXay, setNamXay] = useState("2024");
  const [khongRoNamXay, setKhongRoNamXay] = useState(false);
  const [ngay, setNgay] = useState("15");
  const [thang, setThang] = useState("8");
  const [nam, setNam] = useState("1986");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [dangTinh, setDangTinh] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaMatBang | null>(null);

  useEffect(() => {
    if (!hoSo) return;
    setNgay(String(hoSo.ngay));
    setThang(String(hoSo.thang));
    setNam(String(hoSo.nam));
    if (hoSo.gioi_tinh === "nam" || hoSo.gioi_tinh === "nu") {
      setGioiTinh(hoSo.gioi_tinh);
    }
  }, [hoSo]);

  async function xemMatBang(e: React.FormEvent) {
    e.preventDefault();
    setDangTinh(true);
    setLoi(null);
    try {
      const r = await fetch("/api/doanh-chu/mat-bang", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          do_huong: Number(doHuong) % 360,
          nam_xay: Number(namXay),
          ngay_sinh: Number(ngay),
          thang_sinh: Number(thang),
          nam_sinh: Number(nam),
          gioi_tinh: gioiTinh,
          loai_hinh: loaiHinh,
        }),
      });
      const data = (await r.json().catch(() => null)) as KetQuaMatBang & { error?: string } | null;
      if (!r.ok || !data || !Array.isArray(data.danh_sach_khu_vuc)) {
        setLoi(data?.error ?? "Chưa kiểm tra được mặt bằng lúc này. Vui lòng xem lại độ hướng và năm xây.");
        return;
      }
      setKq(data);
    } catch {
      setLoi("Không kết nối được máy tính toán. Vui lòng thử lại sau giây lát.");
    } finally {
      setDangTinh(false);
    }
  }

  return (
    <div className="space-y-8" data-testid="mat-bang-khai-truong">
      <section className="glass rounded-2xl border border-line/80 p-5 sm:p-6">
        <p className="eyebrow flex items-center gap-1.5 text-gold">
          <Building2 className="size-3.5" aria-hidden /> Mặt bằng &amp; Khai trương
        </p>
        <h2 className="mt-1 font-serif text-2xl text-fg sm:text-3xl">
          Kiểm tra bố trí mặt bằng &amp; chọn 5 ngày khai trương thuận lợi
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
          Gộp Huyền Không Phi Tinh, Mệnh Quái chủ cơ sở và Hoàng Lịch để gợi ý vị trí quầy thu ngân, bàn giám đốc,
          khu đón khách, góc cần giữ tĩnh trong năm nay và 5 ngày khai trương đẹp trong 60 ngày tới.
        </p>

        <form onSubmit={(e) => void xemMatBang(e)} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="mb-loai">Loại hình kinh doanh</label>
              <select id="mb-loai" value={loaiHinh} onChange={(e) => setLoaiHinh(e.target.value as LoaiHinh)}
                className="w-full rounded-lg border border-line bg-bg/70 px-3 py-2 text-sm text-fg">
                {LOAI_HINH_OPT.map((o) => <option key={o.ma} value={o.ma}>{o.ten}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="mb-do">Hướng cửa chính (0°–359°)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input id="mb-do" inputMode="decimal" value={doHuong} onChange={(e) => setDoHuong(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))}
                  placeholder="180" className="rounded-lg border border-line bg-bg/70 px-2.5 py-2 text-center text-sm text-fg" />
                <select aria-label="Chọn nhanh 8 hướng" value={HUONG_NHANH.find((h) => String(h.do) === doHuong)?.do ?? ""}
                  onChange={(e) => { if (e.target.value !== "") setDoHuong(e.target.value); }}
                  className="rounded-lg border border-line bg-bg/70 px-2 py-2 text-xs text-fg">
                  <option value="">Chọn hướng</option>
                  {HUONG_NHANH.map((h) => <option key={h.do} value={h.do}>{h.ten}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="mb-nam-xay">Năm xây / sửa lớn</label>
              <input id="mb-nam-xay" inputMode="numeric" value={khongRoNamXay ? "2024" : namXay}
                disabled={khongRoNamXay}
                onChange={(e) => setNamXay(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="2024" className="w-full rounded-lg border border-line bg-bg/70 px-3 py-2 text-sm text-fg disabled:opacity-60" />
              <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-[11px] text-fg-faint">
                <input type="checkbox" checked={khongRoNamXay} data-testid="checkbox-khong-ro-nam-xay"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setKhongRoNamXay(checked);
                    if (checked) setNamXay("2024");
                  }}
                  className="size-3.5 accent-gold" />
                <span>Không rõ năm xây (tạm tính Vận 9 hiện tại)</span>
              </label>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="mb-ngay">Ngày sinh chủ cơ sở</label>
              <div className="grid grid-cols-4 gap-1">
                <input id="mb-ngay" inputMode="numeric" value={ngay} onChange={(e) => setNgay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="Ng" className="rounded-lg border border-line bg-bg/70 px-1.5 py-2 text-center text-xs text-fg" />
                <input aria-label="Tháng sinh" inputMode="numeric" value={thang} onChange={(e) => setThang(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="Th" className="rounded-lg border border-line bg-bg/70 px-1.5 py-2 text-center text-xs text-fg" />
                <input aria-label="Năm sinh" inputMode="numeric" value={nam} onChange={(e) => setNam(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Năm" className="rounded-lg border border-line bg-bg/70 px-1.5 py-2 text-center text-xs text-fg" />
                <select aria-label="Giới tính" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value as "nam" | "nu")}
                  className="rounded-lg border border-line bg-bg/70 px-1 py-2 text-xs text-fg">
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                </select>
              </div>
            </div>
          </div>

          {loi && <p role="alert" className="rounded-xl bg-cinnabar/10 px-4 py-2.5 text-sm text-cinnabar">{loi}</p>}

          <button type="submit" disabled={dangTinh} data-testid="nut-kiem-tra-mat-bang"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-60">
            <Sparkles className="size-4" aria-hidden />
            {dangTinh ? "Đang lập bản đồ mặt bằng…" : "Kiểm tra Mặt bằng & Ngày Khai trương"}
          </button>
        </form>
      </section>

      {kq && (
        <div className="space-y-6" data-testid="ket-qua-mat-bang">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gold/35 bg-gold/[0.06] p-4">
              <p className="text-xs font-medium text-gold">Hướng &amp; Vận mặt bằng</p>
              <p className="mt-1 font-serif text-xl text-fg">{kq.mat_bang.phuong_huong} ({kq.mat_bang.do_huong}°) · Vận {kq.mat_bang.van}</p>
            </div>
            <div className="rounded-2xl border border-jade/35 bg-jade/[0.06] p-4">
              <p className="text-xs font-medium text-jade">Cục thế Huyền Không</p>
              <p className="mt-1 font-serif text-xl text-fg">{kq.mat_bang.cuc_ten}</p>
            </div>
            <div className="rounded-2xl border border-moon/35 bg-moon/[0.06] p-4">
              <p className="text-xs font-medium text-moon">Mệnh quái chủ cơ sở</p>
              <p className="mt-1 font-serif text-xl text-fg">{kq.mat_bang.menh_quai} · {kq.mat_bang.nhom_menh}</p>
            </div>
          </div>

          {kq.mat_bang.canh_bao_kiem_huong && (
            <div data-testid="canh-bao-kiem-huong" className="flex items-start gap-2.5 rounded-2xl border border-[#f0b35c]/45 bg-[#f0b35c]/10 p-4 text-xs leading-relaxed text-fg">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#f0b35c]" aria-hidden />
              <div>
                <p className="font-semibold text-[#f0b35c]">Lưu ý góc đo giáp ranh (Kiêm hướng)</p>
                <p className="mt-0.5 text-fg-muted">{kq.mat_bang.canh_bao_kiem_huong}</p>
              </div>
            </div>
          )}

          {khongRoNamXay && (
            <p className="rounded-xl border border-line/70 bg-surface/40 px-3.5 py-2 text-xs text-fg-muted">
              Đang tạm tính theo <b>Vận 9 hiện tại (2024–2043)</b> vì chưa rõ năm xây hoặc năm sửa lớn gần nhất của mặt bằng thuê.
            </p>
          )}

          <p className="rounded-2xl border border-line/80 bg-surface/50 p-4 text-sm leading-relaxed text-fg">{kq.tong_quan}</p>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-serif text-xl text-fg">
              <Compass className="size-5 text-gold" aria-hidden /> Bố trí 5 khu vực trọng điểm
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {kq.danh_sach_khu_vuc.map((kv) => (
                <article key={kv.ma} className="rounded-2xl border border-line/80 bg-surface/40 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-lg text-fg">{kv.ten}</h4>
                    <span className="shrink-0 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-xs font-medium text-gold">
                      {kv.phuong_goi_y}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-fg-faint">{kv.can_cu}</p>
                  <div className="mt-3 space-y-2 text-xs leading-relaxed">
                    <p className="flex items-start gap-1.5 text-fg">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-jade" aria-hidden />
                      <span>{kv.thuan_loi}</span>
                    </p>
                    <p className="flex items-start gap-1.5 text-fg-muted">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[#f0b35c]" aria-hidden />
                      <span><b className="text-[#f0b35c]">Nên chú ý:</b> {kv.nen_chu_y}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {kq.ngay_khai_truong.length > 0 && (
            <section className="rounded-2xl border border-jade/30 bg-jade/[0.04] p-5">
              <h3 className="flex items-center gap-2 font-serif text-xl text-fg">
                <CalendarCheck className="size-5 text-jade" aria-hidden /> 5 ngày Khai trương tham khảo trong 60 ngày tới
              </h3>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {kq.ngay_khai_truong.map((nd) => (
                  <div key={nd.ngay} className="rounded-xl border border-line/70 bg-bg/60 p-3 text-xs">
                    <p className="font-semibold text-fg">{formatNgayVN(nd.ngay)} <span className="font-normal text-fg-faint">(Âm {nd.am})</span></p>
                    <p className="mt-1 text-fg-muted">{nd.can_chi} · Trực {nd.truc}{nd.hoang_dao ? " · Hoàng đạo" : ""}</p>
                    {nd.luu_y_ngay && nd.luu_y_ngay.length > 0 && (
                      <p className="mt-1 text-[11px] text-[#f0b35c]">Lưu ý tập quán: {nd.luu_y_ngay.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="flex items-start gap-2 rounded-xl border border-line/70 bg-surface/30 px-4 py-3 text-xs leading-relaxed text-fg-faint">
            <Shield className="mt-0.5 size-3.5 shrink-0 text-fg-muted" aria-hidden />
            <span>{kq.ranh_gioi_phap_ly}</span>
          </p>
        </div>
      )}
    </div>
  );
}
