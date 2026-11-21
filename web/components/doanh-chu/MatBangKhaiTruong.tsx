"use client";
// Kiểm tra Mặt bằng & Khai trương — web CHỈ gửi số (độ hướng mặt tiền, năm xây nếu biết, ngày sinh chủ cơ sở) và vẽ kết quả
// engine trả (Huyền Không khi biết năm xây · Bát trạch theo mệnh chủ · sao năm · Hoàng lịch + giờ Kỳ Môn). Không tự tính.
// Đo hướng dùng lại la bàn điện thoại + ảnh vệ tinh của /phong-thuy (DoHuongDienThoai, không ghi đè hồ sơ nhà ở).
// "Hồ sơ cửa hàng" (loại hình, độ hướng, năm xây) chỉ lưu trên máy — lib/mat-bang.
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Building2, CalendarCheck, CheckCircle2, ChevronDown, Clock, Compass, Shield, Sparkles,
} from "lucide-react";
import Link from "@/components/khung/Lien";
import { DoHuongDienThoai } from "@/components/huyen-hoc/DoHuongDienThoai";
import { ghi } from "@/lib/do-luong";
import { useHoSo } from "@/lib/hoso";
import { docMatBang, luuMatBang, type CachNamXay, type LoaiHinh } from "@/lib/mat-bang";
import { cn } from "@/lib/utils";

type Muc = "thuan" | "can_bang" | "can_chu_y";

interface KhuVuc {
  ma: string;
  ten: string;
  phuong_goi_y: string;
  phuong_ma?: string;
  muc?: Muc;
  can_cu: string;
  thuan_loi: string;
  nen_chu_y: string;
}

interface GioKyMon { khung: string; chi: string; phuong: string; hop_menh?: boolean }

interface NgayKhaiTruong {
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
  gio_ky_mon?: GioKyMon[];
}

interface KetQuaMatBang {
  loai_hinh: { ma: string; ten: string };
  mat_bang: {
    do_huong: number;
    phuong_huong: string;
    son_toa?: string;
    son_huong?: string;
    canh_bao_ma?: "khong_vong" | "kiem_huong" | null;
    canh_bao_kiem_huong?: string | null;
    co_phi_tinh?: boolean;
    khong_ro_nam_xay?: string | null;
    nam_xay: number | null;
    van: number | null;
    cuc_ma: string | null;
    cuc_ten: string | null;
    menh_quai: string;
    nhom_menh: string;
    huong_tot?: string[];
    nam_xem?: number;
  };
  tong_quan: string;
  danh_sach_khu_vuc: KhuVuc[];
  ngay_khai_truong: NgayKhaiTruong[];
  ngay_cach_chon?: string;
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

/** Khoảng năm → một năm đại diện của Vận ấy: sao của nhà chỉ phụ thuộc Vận (20 năm), không phụ thuộc năm cụ thể. */
const KHOANG_NAM: { ten: string; nam: number }[] = [
  { ten: "1964–1983 (Vận 6)", nam: 1975 },
  { ten: "1984–2003 (Vận 7)", nam: 1990 },
  { ten: "2004–2023 (Vận 8)", nam: 2010 },
  { ten: "Từ 2024 (Vận 9)", nam: 2025 },
];

const NHAN_MUC: Record<Muc, string> = { thuan: "Thuận lợi", can_bang: "Cân bằng", can_chu_y: "Cần lưu ý" };
const MAU_MUC: Record<Muc, string> = {
  thuan: "border-jade/40 bg-jade/10 text-jade",
  can_bang: "border-moon/40 bg-moon/10 text-moon",
  can_chu_y: "border-[#f0b35c]/45 bg-[#f0b35c]/10 text-[#f0b35c]",
};
const THU = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const QUAN_HE_TUOI: Record<string, string> = { tam_hop: "tam hợp", luc_hop: "lục hợp" };

function ngayVN(iso: string): string {
  const p = iso.split("-").map(Number);
  if (p.length !== 3 || p.some((x) => !Number.isFinite(x))) return iso;
  const [y, m, d] = p as [number, number, number];
  const thu = THU[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? "";
  return `${thu}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

export function MatBangKhaiTruong() {
  const hoSo = useHoSo();
  const [loaiHinh, setLoaiHinh] = useState<LoaiHinh>("cua_hang");
  const [doHuong, setDoHuong] = useState("180");
  const [cachNam, setCachNam] = useState<CachNamXay>("chinh_xac");
  const [namXay, setNamXay] = useState("");
  const [khoang, setKhoang] = useState<number>(KHOANG_NAM[2]!.nam);
  const [ngay, setNgay] = useState("15");
  const [thang, setThang] = useState("8");
  const [nam, setNam] = useState("1986");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [moDoHuong, setMoDoHuong] = useState(false);
  const [dangTinh, setDangTinh] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaMatBang | null>(null);
  const daNap = useRef(false);

  useEffect(() => {
    if (!hoSo) return;
    setNgay(String(hoSo.ngay));
    setThang(String(hoSo.thang));
    setNam(String(hoSo.nam));
    if (hoSo.gioi_tinh === "nam" || hoSo.gioi_tinh === "nu") setGioiTinh(hoSo.gioi_tinh);
  }, [hoSo]);

  // Hồ sơ cửa hàng đã lưu trên máy → điền lại một lần khi mở tab.
  useEffect(() => {
    if (daNap.current) return;
    daNap.current = true;
    const h = docMatBang();
    if (!h) return;
    setLoaiHinh(h.loai_hinh);
    setDoHuong(String(h.do_huong));
    setCachNam(h.cach_nam);
    if (h.cach_nam === "chinh_xac" && h.nam_xay) setNamXay(String(h.nam_xay));
    if (h.cach_nam === "khoang" && h.nam_xay && KHOANG_NAM.some((k) => k.nam === h.nam_xay)) setKhoang(h.nam_xay);
  }, []);

  /** Năm gửi engine: đúng năm, năm đại diện của khoảng, hoặc không gửi (không rõ — KHÔNG bao giờ gửi năm giả). */
  function namGui(): number | null | "loi" {
    if (cachNam === "khong_ro") return null;
    if (cachNam === "khoang") return khoang;
    const n = Number(namXay);
    if (!(namXay.length === 4 && n >= 1864 && n <= 2043)) return "loi";
    return n;
  }

  const ngaySinhIso = (() => {
    const d = Number(ngay), m = Number(thang), y = Number(nam);
    if (!(d >= 1 && m >= 1 && m <= 12 && y >= 1930)) return null;
    const t = new Date(Date.UTC(y, m - 1, d));
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  })();

  async function xemMatBang() {
    const doSo = Number(doHuong.replace(",", "."));
    if (!(doHuong.trim() !== "" && doSo >= 0 && doSo < 360)) {
      setLoi("Độ hướng mặt tiền cần là số từ 0 đến 359.");
      return;
    }
    const nx = namGui();
    if (nx === "loi") {
      setLoi("Năm xây cần đủ 4 chữ số (1864–2043). Nếu không nhớ, hãy chọn khoảng năm hoặc tích \"Không rõ năm xây\".");
      return;
    }
    setDangTinh(true);
    setLoi(null);
    try {
      const r = await fetch("/api/doanh-chu/mat-bang", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          do_huong: doSo,
          ...(nx != null ? { nam_xay: nx } : {}),
          ngay_sinh: Number(ngay),
          thang_sinh: Number(thang),
          nam_sinh: Number(nam),
          gioi_tinh: gioiTinh,
          loai_hinh: loaiHinh,
        }),
      });
      const data = (await r.json().catch(() => null)) as (KetQuaMatBang & { error?: string }) | null;
      if (!r.ok || !data || !Array.isArray(data.danh_sach_khu_vuc)) {
        setLoi(data?.error ?? "Chưa kiểm tra được mặt bằng lúc này. Vui lòng xem lại độ hướng và ngày sinh.");
        return;
      }
      setKq(data);
      luuMatBang({ v: 1, loai_hinh: loaiHinh, do_huong: doSo, cach_nam: cachNam, ...(nx != null ? { nam_xay: nx } : {}) });
      ghi("chart_interacted", {
        mo_dun: "doanh_chu", kind: "mat_bang_xem", loai: loaiHinh,
        co_phi_tinh: data.mat_bang.co_phi_tinh === true, canh_bao: data.mat_bang.canh_bao_ma ?? "khong",
      });
    } catch {
      setLoi("Không kết nối được máy tính toán. Vui lòng thử lại sau giây lát.");
    } finally {
      setDangTinh(false);
    }
  }

  const mb = kq?.mat_bang;

  return (
    <div className="space-y-8" data-testid="mat-bang-khai-truong">
      <section className="glass rounded-2xl border border-line/80 p-5 sm:p-6">
        <p className="eyebrow flex items-center gap-1.5 text-gold">
          <Building2 className="size-3.5" aria-hidden /> Mặt bằng &amp; Khai trương
        </p>
        <h2 className="mt-1 font-serif text-2xl text-fg sm:text-3xl">
          Đặt quầy, bàn chủ ở đâu và chọn ngày khai trương
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
          Nhập hướng mặt tiền, năm xây và ngày sinh của chủ cơ sở. Hệ thống gợi ý chỗ đặt quầy thu ngân, bàn của chủ,
          khu đón khách, góc nên giữ yên trong năm nay và 5 ngày khai trương trong 60 ngày tới.
        </p>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="mb-loai">Loại hình kinh doanh</label>
              <select id="mb-loai" value={loaiHinh} onChange={(e) => setLoaiHinh(e.target.value as LoaiHinh)}
                className="w-full rounded-lg border border-line bg-bg/70 px-3 py-2 text-sm text-fg">
                {LOAI_HINH_OPT.map((o) => <option key={o.ma} value={o.ma}>{o.ten}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="mb-do">Hướng mặt tiền / cửa chính (0°–359°)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input id="mb-do" inputMode="decimal" value={doHuong}
                  onChange={(e) => setDoHuong(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))}
                  placeholder="180" className="rounded-lg border border-line bg-bg/70 px-2.5 py-2 text-center text-sm text-fg" />
                <select aria-label="Chọn nhanh 8 hướng" value={HUONG_NHANH.find((h) => String(h.do) === doHuong)?.do ?? ""}
                  onChange={(e) => { if (e.target.value !== "") setDoHuong(e.target.value); }}
                  className="rounded-lg border border-line bg-bg/70 px-2 py-2 text-xs text-fg">
                  <option value="">Chọn hướng</option>
                  {HUONG_NHANH.map((h) => <option key={h.do} value={h.do}>{h.ten}</option>)}
                </select>
              </div>
              <button type="button" aria-expanded={moDoHuong} data-testid="mo-do-huong-mat-bang"
                onClick={() => {
                  if (!moDoHuong) ghi("chart_interacted", { mo_dun: "doanh_chu", kind: "mat_bang_do_huong" });
                  setMoDoHuong((v) => !v);
                }}
                className="mt-1.5 inline-flex min-h-8 items-center gap-1 text-xs text-gold underline-offset-4 hover:underline">
                <Compass className="size-3.5" aria-hidden /> {moDoHuong ? "Đóng la bàn" : "Đo bằng la bàn điện thoại hoặc ảnh vệ tinh"}
              </button>
            </div>

            <fieldset className="sm:col-span-2">
              <legend className="mb-1 block text-xs font-medium text-fg-muted">Năm xây / sửa lớn gần nhất của mặt bằng</legend>
              <div className="flex flex-wrap items-center gap-2">
                <input id="mb-nam-xay" aria-label="Năm xây" inputMode="numeric" value={cachNam === "chinh_xac" ? namXay : ""}
                  disabled={cachNam !== "chinh_xac"}
                  onChange={(e) => setNamXay(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Ví dụ 2012" className="w-32 rounded-lg border border-line bg-bg/70 px-3 py-2 text-sm text-fg disabled:opacity-50" />
                <select aria-label="Chỉ nhớ khoảng năm" data-testid="chon-khoang-nam-xay"
                  value={cachNam === "khoang" ? String(khoang) : ""}
                  onChange={(e) => {
                    if (e.target.value === "") { setCachNam("chinh_xac"); return; }
                    setKhoang(Number(e.target.value)); setCachNam("khoang");
                  }}
                  className="rounded-lg border border-line bg-bg/70 px-2 py-2 text-xs text-fg">
                  <option value="">Chỉ nhớ khoảng năm…</option>
                  {KHOANG_NAM.map((k) => <option key={k.nam} value={k.nam}>{k.ten}</option>)}
                </select>
                <label className="flex min-h-8 cursor-pointer items-center gap-1.5 text-xs text-fg-muted">
                  <input type="checkbox" checked={cachNam === "khong_ro"} data-testid="checkbox-khong-ro-nam-xay"
                    onChange={(e) => setCachNam(e.target.checked ? "khong_ro" : "chinh_xac")}
                    className="size-3.5 accent-gold" />
                  <span>Không rõ năm xây</span>
                </label>
              </div>
              <p className="mt-1 text-[11px] text-fg-faint">
                Sao của nhà chỉ đổi theo từng 20 năm (một Vận), nên nhớ khoảng năm là đủ. Không rõ thì hệ thống chỉ dựa vào mệnh chủ cơ sở và sao của năm.
              </p>
            </fieldset>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-fg-muted" htmlFor="mb-ngay">Ngày sinh chủ cơ sở</label>
              <div className="grid max-w-sm grid-cols-4 gap-1">
                <input id="mb-ngay" inputMode="numeric" value={ngay} onChange={(e) => setNgay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="Ngày" className="rounded-lg border border-line bg-bg/70 px-1.5 py-2 text-center text-xs text-fg" />
                <input aria-label="Tháng sinh" inputMode="numeric" value={thang} onChange={(e) => setThang(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="Tháng" className="rounded-lg border border-line bg-bg/70 px-1.5 py-2 text-center text-xs text-fg" />
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

          {loi && <p role="alert" className="rounded-xl bg-[#f0b35c]/10 px-4 py-2.5 text-sm text-[#f0b35c]">{loi}</p>}

          <button type="button" onClick={() => void xemMatBang()} disabled={dangTinh} data-testid="nut-kiem-tra-mat-bang"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-60">
            <Sparkles className="size-4" aria-hidden />
            {dangTinh ? "Đang xem mặt bằng…" : "Kiểm tra mặt bằng & ngày khai trương"}
          </button>
        </div>
      </section>

      {moDoHuong && (
        <div data-testid="do-huong-mat-bang">
          <p className="mb-2 text-xs text-fg-muted">
            Đứng ở cửa chính, quay mặt ra ngoài đường để đo. Bấm Chốt xong, số độ mặt tiền tự điền vào ô phía trên (không đổi hồ sơ nhà ở của bạn).
          </p>
          <DoHuongDienThoai
            sinh={ngaySinhIso ? { birth_date: ngaySinhIso, gender: gioiTinh } : null}
            luuNha={false}
            onChot={(r) => { setDoHuong(String(r.do_huong)); setLoi(null); }}
          />
        </div>
      )}

      {kq && mb && (
        <div className="space-y-6" data-testid="ket-qua-mat-bang">
          <p className="rounded-2xl border border-line/80 bg-surface/50 p-4 text-sm leading-relaxed text-fg">{kq.tong_quan}</p>

          {mb.canh_bao_kiem_huong && (
            <div data-testid="canh-bao-kiem-huong" className="flex items-start gap-2.5 rounded-2xl border border-[#f0b35c]/45 bg-[#f0b35c]/10 p-4 text-sm leading-relaxed text-fg">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#f0b35c]" aria-hidden />
              <div>
                <p className="font-semibold text-[#f0b35c]">
                  {mb.canh_bao_ma === "khong_vong" ? "Hướng nằm sát ranh giới — nên đo lại" : "Hướng lệch khỏi chính giữa (kiêm hướng)"}
                </p>
                <p className="mt-0.5 text-fg-muted">{mb.canh_bao_kiem_huong}</p>
              </div>
            </div>
          )}

          {!mb.co_phi_tinh && mb.khong_ro_nam_xay && (
            <p data-testid="khong-ro-nam-xay" className="rounded-xl border border-line/70 bg-surface/40 px-4 py-3 text-sm text-fg-muted">
              {mb.khong_ro_nam_xay}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gold/35 bg-gold/[0.06] p-4">
              <p className="text-xs font-medium text-gold">Hướng mặt tiền</p>
              <p className="mt-1 font-serif text-xl text-fg">
                {mb.phuong_huong} ({mb.do_huong}°){mb.co_phi_tinh && mb.van ? ` · Vận ${mb.van}` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-jade/35 bg-jade/[0.06] p-4">
              <p className="text-xs font-medium text-jade">Thế của mặt bằng</p>
              <p className="mt-1 font-serif text-xl text-fg">{mb.co_phi_tinh && mb.cuc_ten ? mb.cuc_ten : "Chưa lập (thiếu năm xây)"}</p>
            </div>
            <div className="rounded-2xl border border-moon/35 bg-moon/[0.06] p-4">
              <p className="text-xs font-medium text-moon">Mệnh chủ cơ sở</p>
              <p className="mt-1 font-serif text-xl text-fg">{mb.menh_quai} · {mb.nhom_menh}</p>
            </div>
          </div>

          {mb.huong_tot && mb.huong_tot.length > 0 && (
            <div>
              <p className="text-xs font-medium text-fg-muted">Các phía hợp với chủ cơ sở (tốt nhất đứng trước)</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5" data-testid="huong-tot-chu">
                {mb.huong_tot.map((h) => (
                  <span key={h} className="rounded-full border border-jade/40 bg-jade/10 px-3 py-1 text-xs text-jade">{h}</span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-serif text-xl text-fg">
              <Compass className="size-5 text-gold" aria-hidden /> Năm khu vực nên đặt đúng chỗ
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {kq.danh_sach_khu_vuc.map((kv) => (
                <article key={kv.ma} className="rounded-2xl border border-line/80 bg-surface/40 p-4" data-testid={`khu-${kv.ma}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="font-serif text-lg text-fg">{kv.ten}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {kv.muc && (
                        <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium", MAU_MUC[kv.muc])}>
                          {NHAN_MUC[kv.muc]}
                        </span>
                      )}
                      <span className="shrink-0 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-xs font-medium text-gold">
                        {kv.phuong_goi_y}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm leading-relaxed">
                    <p className="flex items-start gap-1.5 text-fg">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-jade" aria-hidden />
                      <span>{kv.thuan_loi}</span>
                    </p>
                    <p className="flex items-start gap-1.5 text-fg-muted">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#f0b35c]" aria-hidden />
                      <span><b className="text-[#f0b35c]">Nên chú ý:</b> {kv.nen_chu_y}</span>
                    </p>
                  </div>
                  <details className="group mt-3 text-xs"
                    onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) ghi("chart_interacted", { mo_dun: "doanh_chu", kind: "mat_bang_mo_vi_sao", muc: kv.ma }); }}>
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-fg-faint hover:text-fg">
                      <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden /> Vì sao nói vậy
                    </summary>
                    <p className="mt-1.5 text-fg-faint">{kv.can_cu}</p>
                  </details>
                </article>
              ))}
            </div>
          </div>

          {kq.ngay_khai_truong.length > 0 && (
            <section className="rounded-2xl border border-jade/30 bg-jade/[0.04] p-5" data-testid="ngay-khai-truong">
              <h3 className="flex items-center gap-2 font-serif text-xl text-fg">
                <CalendarCheck className="size-5 text-jade" aria-hidden /> 5 ngày khai trương tham khảo trong 60 ngày tới
              </h3>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {kq.ngay_khai_truong.map((nd) => {
                  const hop = nd.quan_he_tuoi ? QUAN_HE_TUOI[nd.quan_he_tuoi] : undefined;
                  const diem = (nd.diem_cong ?? []).filter((d) => !hop || d !== hop);
                  const luuY = [...(nd.ky_dan_gian ?? []), ...(nd.luu_y_ngay ?? [])];
                  return (
                    <div key={nd.ngay} className="rounded-xl border border-line/70 bg-bg/60 p-3 text-sm">
                      <p className="font-semibold text-fg">{ngayVN(nd.ngay)}</p>
                      <p className="mt-0.5 text-xs text-fg-muted">Âm lịch {nd.am} · {nd.can_chi} · trực {nd.truc}</p>
                      {(diem.length > 0 || hop) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {hop && <span className="rounded-full border border-jade/40 bg-jade/10 px-2 py-0.5 text-[11px] text-jade">hợp tuổi ({hop})</span>}
                          {diem.map((d) => (
                            <span key={d} className="rounded-full border border-line/70 px-2 py-0.5 text-[11px] text-fg-muted">{d}</span>
                          ))}
                        </div>
                      )}
                      {luuY.length > 0 && (
                        <p className="mt-2 text-[11px] text-[#f0b35c]">Lưu ý: {luuY.join("; ")}</p>
                      )}
                      {nd.gio_ky_mon && nd.gio_ky_mon.length > 0 && (
                        <div className="mt-2 text-xs">
                          <p className="flex items-center gap-1 font-medium text-fg-muted"><Clock className="size-3.5" aria-hidden /> Giờ thuận (Kỳ Môn)</p>
                          <ul className="mt-0.5 space-y-0.5 text-fg">
                            {nd.gio_ky_mon.map((g) => <li key={g.khung}>{g.chi} {g.khung} · hướng {g.phuong}{g.hop_menh && <span className="text-jade"> · hợp mệnh bạn</span>}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {kq.ngay_cach_chon && <p className="mt-3 text-xs leading-relaxed text-fg-faint">{kq.ngay_cach_chon}</p>}
              <p className="mt-2 text-xs text-fg-muted">
                Xem kỹ hơn từng ngày ở <Link href="/xem-ngay-tot" className="text-gold underline-offset-4 hover:underline">Xem ngày tốt</Link>
                {" "}và giờ, hướng theo từng việc ở <Link href="/ky-mon" className="text-gold underline-offset-4 hover:underline">Kỳ Môn Độn Giáp</Link>.
              </p>
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
