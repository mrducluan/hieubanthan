"use client";
// Chặng 2 — Cẩm nang Chiến lược Kinh doanh 5 Trụ:
// (1) Mở rộng thị trường, (2) Chọn & So sánh 1–3 địa điểm mặt bằng + Thành Môn Quyết + Loan đầu,
// (3) Phối hợp nhân sự cốt cán hợp với chủ, (4) Bố trí văn phòng chủ, (5) Bài trí cửa hàng buôn bán & quầy thu ngân.
import { useEffect, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, Compass, LayoutGrid, Plus, Store, Trash2, TrendingUp, Users } from "lucide-react";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import type { MatBangBanCo } from "@/lib/ma-hoa-ban-co";
import { cn } from "@/lib/utils";

interface MatBangForm {
  ten_diem: string;
  loai_hinh: "van_phong" | "cua_hang" | "quan_ca_phe" | "xuong_kho";
  do_huong: string;
  nam_xay: string;
}

interface KetQuaCamNang {
  bac_phan_tich: 1 | 2 | 3;
  mo_rong_thi_truong: {
    ma_mui_nhon: string;
    ten_mui_nhon: string;
    chien_luoc_cot_loi: string;
    rui_ro_can_giu: string;
    phuong_vi_uu_tien: string;
    nganh_nghe_bo_tro_van_9: string;
    goc_nhin_thien_di: string;
  };
  chon_dia_diem_cua_hang: {
    menh_quai_chu: string;
    huong_hop_menh_chu: string[];
    so_sanh_mat_bang: {
      thu_tu_uu_tien: number;
      ten_diem: string;
      loai_hinh: { ma: string; ten: string };
      do_huong: number;
      phuong_huong: string;
      nam_xay: number | null;
      cuc_ten: string | null;
      canh_bao_kiem_huong: string | null;
      tong_quan: string;
      thanh_mon_quyet: { co_thanh_mon: boolean; phuong_thanh_mon: string | null; luan_giai: string };
      danh_sach_khu_vuc: { ma: string; ten: string; phuong_goi_y: string; muc: string; thuan_loi: string; nen_chu_y: string; can_cu: string }[];
      ngay_khai_truong: { ngay: string; am: string; can_chi: string; gio_ky_mon: { khung: string; chi: string; phuong: string }[] }[];
    }[];
    checklist_loan_dau_6_diem: string[];
  };
  phoi_hop_nhan_su: {
    manh_ghep_vai_tro_can_bu: string[];
    cach_giao_quyen_theo_no_boc: string;
    ranh_gioi_phap_ly: string;
  };
  bo_tri_van_phong_chu: {
    nhat_chu: string;
    co_gio: boolean;
    hanh_bo_tro_khong_gian: string;
    nguyen_tac_4_diem: string[];
  };
  bo_tri_cua_hang_buon_ban: {
    nguyen_tac_quay_thu_ngan_va_cua: string[];
    chien_luoc_mat_bang_dien_trach: string;
  };
}

const MAU_2_MAT_BANG: MatBangForm[] = [
  { ten_diem: "Điểm A (Mặt phố Đông Nam)", loai_hinh: "cua_hang", do_huong: "135", nam_xay: "2024" },
  { ten_diem: "Điểm B (Góc phố Chính Tây)", loai_hinh: "cua_hang", do_huong: "270", nam_xay: "2024" },
];

export function CamNangKinhDoanh({ matBangTuBanCo }: { matBangTuBanCo?: MatBangBanCo[] | null }) {
  const hs = useHoSo();
  const [ngaySinh, setNgaySinh] = useState("1990-05-15");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [gioSinh, setGioSinh] = useState("");
  const [nganh, setNganh] = useState<"dich_vu" | "thuong_mai" | "cong_nghe" | "san_xuat">("dich_vu");
  const [dsMb, setDsMb] = useState<MatBangForm[]>([MAU_2_MAT_BANG[0]!]);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaCamNang | null>(null);

  useEffect(() => {
    if (!hs) return;
    setNgaySinh(ngaySinhIso(hs));
    if (hs.gioi_tinh === "nam" || hs.gioi_tinh === "nu") setGioiTinh(hs.gioi_tinh);
    if (hs.gio && hs.do_tin_gio !== "unknown") setGioSinh(hs.gio);
  }, [hs]);

  useEffect(() => {
    if (!matBangTuBanCo || !matBangTuBanCo.length) return;
    setDsMb(matBangTuBanCo.slice(0, 3).map((m) => ({
      ten_diem: m.ten_diem,
      loai_hinh: m.loai_hinh,
      do_huong: String(m.do_huong),
      nam_xay: m.nam_xay ? String(m.nam_xay) : "",
    })));
  }, [matBangTuBanCo]);

  async function lapCamNang() {
    if (dang || !ngaySinh) return;
    setDang(true);
    setLoi(null);
    try {
      const mbHopLe = dsMb
        .filter((m) => m.do_huong.trim() !== "" && !Number.isNaN(Number(m.do_huong)))
        .map((m) => ({
          ten_diem: m.ten_diem.trim(),
          loai_hinh: m.loai_hinh,
          do_huong: Number(m.do_huong),
          ...(m.nam_xay.trim() !== "" ? { nam_xay: Number(m.nam_xay) } : {}),
        }));
      const res = await fetch("/api/doanh-chu/cam-nang-kinh-doanh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ngay_sinh: ngaySinh,
          gioi_tinh: gioiTinh,
          gio_sinh: /^([01]\d|2[0-3]):[0-5]\d$/.test(gioSinh.trim()) ? gioSinh.trim() : null,
          nganh,
          mat_bang_ung_vien: mbHopLe,
        }),
      });
      const data = (await res.json().catch(() => null)) as (KetQuaCamNang & { error?: string }) | null;
      if (!res.ok || !data) {
        setLoi(data?.error ?? "Chưa lập được cẩm nang lúc này, bạn kiểm tra lại thông tin nhé.");
        return;
      }
      setKq(data);
    } catch {
      setLoi("Kết nối tạm gián đoạn, bạn thử lại sau nhé.");
    } finally {
      setDang(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="cam-nang-kinh-doanh">
      <div className="rounded-2xl border border-line/80 bg-surface/40 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-xl text-fg">Cẩm nang Mở rộng Thị trường, Chọn Mặt bằng &amp; Bài trí Không gian</h3>
            <p className="mt-1 text-xs text-fg-muted">
              Kết hợp Bát tự · Tử vi (Thiên Di, Nô Bộc, Điền Trạch) · Bát trạch · Huyền Không Vận 9 &amp; Thành Môn Quyết.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDsMb(MAU_2_MAT_BANG)}
            data-testid="cam-nang-nap-2-mat-bang"
            className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20"
          >
            So sánh mẫu 2 Mặt bằng Vận 9
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="cn-ngay-sinh" className="block text-xs text-fg-muted">Ngày sinh Chủ cơ sở</label>
            <input id="cn-ngay-sinh" type="date" value={ngaySinh} onChange={(e) => setNgaySinh(e.target.value)}
              data-testid="cam-nang-ngay-sinh"
              className="mt-1 min-h-10 w-full rounded-xl border border-line bg-bg px-3 text-xs text-fg" />
          </div>
          <div>
            <label htmlFor="cn-gt" className="block text-xs text-fg-muted">Giới tính</label>
            <select id="cn-gt" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value as "nam" | "nu")}
              className="mt-1 min-h-10 w-full rounded-xl border border-line bg-bg px-3 text-xs text-fg">
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </select>
          </div>
          <div>
            <label htmlFor="cn-gio" className="block text-xs text-fg-muted">Giờ sinh (tuỳ chọn · mở Tử vi)</label>
            <input id="cn-gio" type="time" value={gioSinh} onChange={(e) => setGioSinh(e.target.value)}
              data-testid="cam-nang-gio-sinh"
              className="mt-1 min-h-10 w-full rounded-xl border border-line bg-bg px-3 text-xs text-fg" />
          </div>
          <div>
            <label htmlFor="cn-nganh" className="block text-xs text-fg-muted">Mô hình kinh doanh</label>
            <select id="cn-nganh" value={nganh} onChange={(e) => setNganh(e.target.value as typeof nganh)}
              className="mt-1 min-h-10 w-full rounded-xl border border-line bg-bg px-3 text-xs text-fg">
              <option value="dich_vu">Cửa hàng / F&amp;B / Dịch vụ</option>
              <option value="thuong_mai">Thương mại / Bán sỉ – lẻ</option>
              <option value="cong_nghe">Văn phòng / Công nghệ / Tư vấn</option>
              <option value="san_xuat">Xưởng / Kho vận</option>
            </select>
          </div>
        </div>

        {/* DANH SÁCH 1–3 MẶT BẰNG ỨNG VIÊN ĐỂ SO SÁNH */}
        <div className="mt-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-fg">Mặt bằng / Văn phòng đang cân nhắc (tối đa 3 điểm để đối chiếu trực tiếp, bỏ trống vẫn xem được 5 trụ)</p>
            {dsMb.length < 3 && (
              <button
                type="button"
                onClick={() => setDsMb((c) => [...c, { ten_diem: `Mặt bằng #${c.length + 1}`, loai_hinh: "cua_hang", do_huong: "180", nam_xay: "2024" }])}
                className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
              >
                <Plus className="size-3.5" aria-hidden /> Thêm mặt bằng so sánh
              </button>
            )}
          </div>
          {dsMb.map((mb, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-line/60 bg-bg/50 p-2.5 text-xs sm:grid-cols-5">
              <input type="text" placeholder="Tên điểm / địa chỉ gợi nhớ" value={mb.ten_diem}
                onChange={(e) => setDsMb((c) => c.map((x, k) => (k === i ? { ...x, ten_diem: e.target.value } : x)))}
                className="col-span-2 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-fg sm:col-span-2" />
              <select value={mb.loai_hinh}
                onChange={(e) => setDsMb((c) => c.map((x, k) => (k === i ? { ...x, loai_hinh: e.target.value as MatBangForm["loai_hinh"] } : x)))}
                className="rounded-lg border border-line bg-bg px-2 py-1.5 text-fg">
                <option value="cua_hang">Cửa hàng / Bán lẻ</option>
                <option value="quan_ca_phe">Quán cà phê / F&amp;B</option>
                <option value="van_phong">Văn phòng</option>
                <option value="xuong_kho">Xưởng / Kho</option>
              </select>
              <input type="number" min={0} max={359.9} step="0.1" placeholder="Độ hướng (0–359°)" value={mb.do_huong}
                onChange={(e) => setDsMb((c) => c.map((x, k) => (k === i ? { ...x, do_huong: e.target.value } : x)))}
                className="rounded-lg border border-line bg-bg px-2 py-1.5 text-fg" />
              <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                <input type="number" min={1864} max={2043} placeholder="Năm xây" value={mb.nam_xay}
                  onChange={(e) => setDsMb((c) => c.map((x, k) => (k === i ? { ...x, nam_xay: e.target.value } : x)))}
                  className="w-full rounded-lg border border-line bg-bg px-2 py-1.5 text-fg" />
                <button type="button" onClick={() => setDsMb((c) => c.filter((_, k) => k !== i))} aria-label="Xoá mặt bằng" className="text-fg-faint hover:text-amber-300">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void lapCamNang()}
          disabled={dang}
          data-testid="cam-nang-nut-lap"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-bg"
        >
          <Compass className="size-4" aria-hidden />
          {dang ? "Đang tổng hợp 5 trụ kinh doanh…" : "Lập Cẩm nang Chiến lược & Bài trí Kinh doanh"}
        </button>

        {loi && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="size-4 shrink-0" aria-hidden /> {loi}
          </p>
        )}
      </div>

      {kq && (
        <div className="space-y-5" data-testid="cam-nang-ket-qua">
          {/* TRỤ 1: MỞ RỘNG THỊ TRƯỜNG & MŨI NHỌN KINH DOANH */}
          <section className="rounded-2xl border border-gold/40 bg-surface/50 p-5" data-testid="cn-tru-1-thi-truong">
            <div className="flex items-center gap-2 text-gold">
              <TrendingUp className="size-4 shrink-0" aria-hidden />
              <h4 className="font-serif text-lg text-fg">1. Mở rộng Thị trường &amp; Mũi nhọn Kinh doanh</h4>
            </div>
            <p className="mt-2 text-sm font-semibold text-gold">{kq.mo_rong_thi_truong.ten_mui_nhon}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{kq.mo_rong_thi_truong.chien_luoc_cot_loi}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-line/60 bg-bg/60 p-3 text-xs">
                <p className="font-semibold text-fg">Hướng địa lý &amp; trục mở rộng</p>
                <p className="mt-1 text-fg-muted">{kq.mo_rong_thi_truong.phuong_vi_uu_tien}</p>
              </div>
              <div className="rounded-xl border border-line/60 bg-bg/60 p-3 text-xs">
                <p className="font-semibold text-fg">Lĩnh vực &amp; dịch vụ trợ lực Vận 9</p>
                <p className="mt-1 text-fg-muted">{kq.mo_rong_thi_truong.nganh_nghe_bo_tro_van_9}</p>
              </div>
              <div className="rounded-xl border border-line/60 bg-bg/60 p-3 text-xs">
                <p className="font-semibold text-fg">Ranh giới quản trị rủi ro</p>
                <p className="mt-1 text-fg-muted">{kq.mo_rong_thi_truong.rui_ro_can_giu}</p>
              </div>
            </div>
            <p className="mt-3 rounded-xl border border-jade/30 bg-jade/5 p-3 text-xs leading-relaxed text-fg-muted">
              <strong className="text-jade">Đánh xa hay giữ cứ điểm (Tử vi Thiên Di): </strong>
              {kq.mo_rong_thi_truong.goc_nhin_thien_di}
            </p>
          </section>

          {/* TRỤ 2: CHỌN & SO SÁNH ĐỊA ĐIỂM MỞ CỬA HÀNG + THÀNH MÔN QUYẾT + LOAN ĐẦU */}
          <section className="rounded-2xl border border-line/80 bg-surface/40 p-5" data-testid="cn-tru-2-dia-diem">
            <div className="flex items-center gap-2 text-gold">
              <Building2 className="size-4 shrink-0" aria-hidden />
              <h4 className="font-serif text-lg text-fg">
                2. Chọn Địa điểm Mặt bằng (Cung {kq.chon_dia_diem_cua_hang.menh_quai_chu} · Hợp hướng {kq.chon_dia_diem_cua_hang.huong_hop_menh_chu.join(", ")})
              </h4>
            </div>

            {kq.chon_dia_diem_cua_hang.so_sanh_mat_bang.length > 0 && (
              <div className="mt-3 space-y-3">
                {kq.chon_dia_diem_cua_hang.so_sanh_mat_bang.map((mb) => (
                  <div
                    key={`${mb.ten_diem}-${mb.do_huong}`}
                    className={cn(
                      "rounded-xl border p-4 text-xs",
                      mb.thu_tu_uu_tien === 1 ? "border-jade/50 bg-jade/5" : "border-line/70 bg-bg/60",
                    )}
                    data-testid={`cn-mat-bang-${mb.thu_tu_uu_tien}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-fg">
                        #{mb.thu_tu_uu_tien} · {mb.ten_diem} ({mb.do_huong}° · {mb.phuong_huong}{mb.cuc_ten ? ` · ${mb.cuc_ten}` : ""})
                      </p>
                      {mb.thu_tu_uu_tien === 1 && (
                        <span className="rounded-full border border-jade/40 bg-jade/15 px-2.5 py-0.5 text-[11px] font-semibold text-jade">
                          Ưu tiên khảo sát số 1
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 leading-relaxed text-fg-muted">{mb.tong_quan}</p>
                    {mb.canh_bao_kiem_huong && <p className="mt-1.5 text-amber-300">⚠ {mb.canh_bao_kiem_huong}</p>}
                    <p className="mt-2 rounded-lg border border-gold/30 bg-gold/5 p-2.5 leading-relaxed text-fg">
                      <strong className="text-gold">Thành Môn Quyết Vận 9: </strong>
                      {mb.thanh_mon_quyet.luan_giai}
                    </p>
                    <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {mb.danh_sach_khu_vuc.map((kv) => (
                        <div key={kv.ma} className="rounded-lg border border-line/60 bg-bg/70 p-2.5">
                          <p className="font-semibold text-fg">{kv.ten}: <span className="text-gold">{kv.phuong_goi_y}</span></p>
                          <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">{kv.thuan_loi}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-line/60 bg-bg/50 p-3.5 text-xs">
              <p className="font-semibold text-fg">6 điểm Loan đầu thực địa bắt buộc quan sát bằng mắt khi đi xem mặt bằng:</p>
              <ul className="mt-2 space-y-1.5 text-fg-muted">
                {kq.chon_dia_diem_cua_hang.checklist_loan_dau_6_diem.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-jade" aria-hidden />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* TRỤ 3: GHÉP VAI NHÂN SỰ CỐT CÁN HỢP VỚI CHỦ */}
          <section className="rounded-2xl border border-line/80 bg-surface/40 p-5" data-testid="cn-tru-3-nhan-su">
            <div className="flex items-center gap-2 text-gold">
              <Users className="size-4 shrink-0" aria-hidden />
              <h4 className="font-serif text-lg text-fg">3. Chọn mảnh ghép Nhân sự cốt cán &amp; Phong cách Giao quyền</h4>
            </div>
            <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-fg-muted">
              {kq.phoi_hop_nhan_su.manh_ghep_vai_tro_can_bu.map((v) => (
                <li key={v} className="rounded-xl border border-line/60 bg-bg/60 p-3">{v}</li>
              ))}
            </ul>
            <p className="mt-2.5 rounded-xl border border-gold/30 bg-gold/5 p-3 text-xs leading-relaxed text-fg">
              <strong className="text-gold">Cơ chế giao quyền &amp; kiểm soát (Tử vi Nô Bộc): </strong>
              {kq.phoi_hop_nhan_su.cach_giao_quyen_theo_no_boc}
            </p>
            <p className="mt-2 text-[11px] text-fg-faint">{kq.phoi_hop_nhan_su.ranh_gioi_phap_ly}</p>
          </section>

          {/* TRỤ 4 & TRỤ 5: BỐ TRÍ VĂN PHÒNG CHỦ & BÀI TRÍ CỬA HÀNG BUÔN BÁN */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-line/80 bg-surface/40 p-5" data-testid="cn-tru-4-van-phong">
              <div className="flex items-center gap-2 text-gold">
                <LayoutGrid className="size-4 shrink-0" aria-hidden />
                <h4 className="font-serif text-lg text-fg">4. Bố trí Bàn làm việc Chủ &amp; Văn phòng ({kq.bo_tri_van_phong_chu.nhat_chu})</h4>
              </div>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-fg-muted">
                {kq.bo_tri_van_phong_chu.nguyen_tac_4_diem.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </section>

            <section className="rounded-2xl border border-line/80 bg-surface/40 p-5" data-testid="cn-tru-5-cua-hang">
              <div className="flex items-center gap-2 text-gold">
                <Store className="size-4 shrink-0" aria-hidden />
                <h4 className="font-serif text-lg text-fg">5. Bài trí Không gian Buôn bán &amp; Quầy Thu ngân</h4>
              </div>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-fg-muted">
                {kq.bo_tri_cua_hang_buon_ban.nguyen_tac_quay_thu_ngan_va_cua.map((d) => <li key={d}>{d}</li>)}
              </ul>
              <p className="mt-3 border-t border-line/60 pt-2.5 text-xs leading-relaxed text-jade">
                <strong>Chiến lược thuê/mua mặt bằng (Điền Trạch): </strong>
                {kq.bo_tri_cua_hang_buon_ban.chien_luoc_mat_bang_dien_trach}
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
