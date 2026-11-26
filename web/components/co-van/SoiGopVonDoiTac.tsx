"use client";
// Chặng 2 — Soi Bù Khuyết Co-founder & Phân Vai Góp Vốn (2–4 người sáng lập, bắt buộc đồng ý PDPA, không lưu máy chủ).
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FileCheck2, Plus, Trash2, Users } from "lucide-react";
import type { DoiTacBanCo } from "@/lib/ma-hoa-ban-co";

export interface ThanhVienSangLapForm {
  ten: string;
  ngay: number;
  thang: number;
  nam: number;
  gioi_tinh: "nam" | "nu";
  gio: string;
  ty_le_du_kien: string;
  dong_y_tu_nguyen: boolean;
}

interface KetQuaGopVon {
  tong_quan_hoi_dong: {
    trang_thai_bu_khuyet: "can_doi" | "thien_lech";
    nhan: string;
    tom_tat: string;
    hanh_manh: string[];
    hanh_khuyet: string[];
  };
  phan_vai_sang_lap: {
    ten: string;
    nhat_chu: string;
    co_gio: boolean;
    menh_quai: string;
    nam_ca_nhan: number;
    lane_chinh: string;
    vai_tro_tu_nhien: string;
    diem_manh_gop_von: string;
    diem_mu_can_rao: string;
  }[];
  lo_hong_hoi_dong: string[];
  dieu_le_rao_chan: { tieu_de: string; nguyen_tac: string }[];
}

const MAU_3_COFOUNDER: ThanhVienSangLapForm[] = [
  { ten: "Minh (Sáng lập)", ngay: 15, thang: 5, nam: 1990, gioi_tinh: "nam", gio: "08:30", ty_le_du_kien: "40", dong_y_tu_nguyen: true },
  { ten: "Lan (Tài chính)", ngay: 20, thang: 9, nam: 1992, gioi_tinh: "nu", gio: "", ty_le_du_kien: "35", dong_y_tu_nguyen: true },
  { ten: "Hùng (Vận hành)", ngay: 11, thang: 11, nam: 1988, gioi_tinh: "nam", gio: "", ty_le_du_kien: "25", dong_y_tu_nguyen: true },
];

export function SoiGopVonDoiTac({ danhSachTuBanCo }: { danhSachTuBanCo?: DoiTacBanCo[] | null }) {
  const [ds, setDs] = useState<ThanhVienSangLapForm[]>(MAU_3_COFOUNDER.slice(0, 2).map((x) => ({ ...x, ty_le_du_kien: "50" })));
  const [nganh, setNganh] = useState<"dich_vu" | "thuong_mai" | "cong_nghe" | "san_xuat">("dich_vu");
  const [camKet, setCamKet] = useState(true);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaGopVon | null>(null);

  useEffect(() => {
    if (!danhSachTuBanCo || danhSachTuBanCo.length < 2) return;
    setDs(danhSachTuBanCo.slice(0, 4).map((p) => ({
      ten: p.ten,
      ngay: p.ngay,
      thang: p.thang,
      nam: p.nam,
      gioi_tinh: p.gioi_tinh,
      gio: p.gio ?? "",
      ty_le_du_kien: p.ty_le_du_kien !== undefined ? String(p.ty_le_du_kien) : "",
      dong_y_tu_nguyen: true,
    })));
  }, [danhSachTuBanCo]);

  function capNhat(idx: number, patch: Partial<ThanhVienSangLapForm>) {
    setDs((cu) => cu.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  }

  async function phanTich() {
    if (dang) return;
    if (!camKet || ds.some((x) => !x.dong_y_tu_nguyen)) {
      setLoi("Cần xác nhận sự đồng ý tự nguyện của từng thành viên sáng lập trước khi phân tích.");
      return;
    }
    setDang(true);
    setLoi(null);
    try {
      const payload = {
        sang_lap: ds.map((x) => ({
          ten: x.ten.trim(),
          ngay: Number(x.ngay),
          thang: Number(x.thang),
          nam: Number(x.nam),
          gioi_tinh: x.gioi_tinh,
          ...(x.gio.trim() ? { gio: x.gio.trim() } : {}),
          ...(x.ty_le_du_kien.trim() !== "" ? { ty_le_du_kien: Number(x.ty_le_du_kien) } : {}),
          dong_y_tu_nguyen: true as const,
        })),
        nganh,
        nam_xem: new Date().getFullYear(),
        cam_ket_thoa_thuan: true as const,
      };
      const res = await fetch("/api/doanh-chu/gop-von", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as (KetQuaGopVon & { error?: string }) | null;
      if (!res.ok || !data) {
        setLoi(data?.error ?? "Chưa phân tích được lúc này, bạn kiểm tra lại ngày sinh nhé.");
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
    <div className="space-y-6" data-testid="soi-gop-von-doi-tac">
      <div className="rounded-2xl border border-line/80 bg-surface/40 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-xl text-fg">Soi Bù Khuyết Co-founder &amp; Điều Lệ Góp Vốn (2–4 người)</h3>
            <p className="mt-1 text-xs text-fg-muted">
              Phân định rõ 3 làn Mở thị trường · Tài chính · Vận hành từ Tam Trụ / Tứ Trụ, không lưu ngày sinh trên máy chủ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setDs(MAU_3_COFOUNDER); setCamKet(true); }}
            data-testid="gop-von-nap-mau"
            className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20"
          >
            Nạp mẫu 3 Co-founder
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {ds.map((tv, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-line/70 bg-bg/50 p-3 sm:grid-cols-7" data-testid={`gop-von-tv-${i}`}>
              <input
                type="text"
                placeholder={`Co-founder #${i + 1}`}
                value={tv.ten}
                onChange={(e) => capNhat(i, { ten: e.target.value })}
                className="col-span-2 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-xs text-fg sm:col-span-2"
              />
              <input
                type="number"
                min={1}
                max={31}
                aria-label="Ngày sinh"
                value={tv.ngay}
                onChange={(e) => capNhat(i, { ngay: Number(e.target.value) })}
                className="rounded-lg border border-line bg-bg px-2 py-1.5 text-xs text-fg"
              />
              <input
                type="number"
                min={1}
                max={12}
                aria-label="Tháng sinh"
                value={tv.thang}
                onChange={(e) => capNhat(i, { thang: Number(e.target.value) })}
                className="rounded-lg border border-line bg-bg px-2 py-1.5 text-xs text-fg"
              />
              <input
                type="number"
                min={1930}
                max={2025}
                aria-label="Năm sinh"
                value={tv.nam}
                onChange={(e) => capNhat(i, { nam: Number(e.target.value) })}
                className="rounded-lg border border-line bg-bg px-2 py-1.5 text-xs text-fg"
              />
              <input
                type="number"
                min={0}
                max={100}
                placeholder="% vốn"
                value={tv.ty_le_du_kien}
                onChange={(e) => capNhat(i, { ty_le_du_kien: e.target.value })}
                className="rounded-lg border border-line bg-bg px-2 py-1.5 text-xs text-fg"
              />
              <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1">
                <label className="inline-flex items-center gap-1 text-[11px] text-fg-muted">
                  <input
                    type="checkbox"
                    checked={tv.dong_y_tu_nguyen}
                    onChange={(e) => capNhat(i, { dong_y_tu_nguyen: e.target.checked })}
                  />
                  <span>Đồng ý</span>
                </label>
                {ds.length > 2 && (
                  <button type="button" onClick={() => setDs((c) => c.filter((_, idx) => idx !== i))} aria-label="Xoá thành viên" className="text-fg-faint hover:text-amber-300">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {ds.length < 4 && (
              <button
                type="button"
                onClick={() => setDs((c) => [...c, { ten: "", ngay: 1, thang: 1, nam: 1990, gioi_tinh: "nam", gio: "", ty_le_du_kien: "", dong_y_tu_nguyen: true }])}
                className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
              >
                <Plus className="size-3.5" aria-hidden /> Thêm người sáng lập
              </button>
            )}
            <select
              value={nganh}
              onChange={(e) => setNganh(e.target.value as typeof nganh)}
              aria-label="Ngành kinh doanh"
              className="rounded-lg border border-line bg-bg px-3 py-1.5 text-xs text-fg"
            >
              <option value="dich_vu">Dịch vụ / F&amp;B / Bán lẻ</option>
              <option value="thuong_mai">Thương mại / Phân phối</option>
              <option value="cong_nghe">Công nghệ / Agencys / Tri thức</option>
              <option value="san_xuat">Sản xuất / Xưởng</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            <input type="checkbox" checked={camKet} onChange={(e) => setCamKet(e.target.checked)} />
            <span>Xác nhận các thành viên tự nguyện đồng ý đối chiếu cách phối hợp</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => void phanTich()}
          disabled={dang}
          data-testid="gop-von-nut-phan-tich"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-bg"
        >
          <Users className="size-4" aria-hidden />
          {dang ? "Đang đối chiếu hội đồng sáng lập…" : "Phân tích Phân vai & Điều lệ Rào chắn"}
        </button>

        {loi && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="size-4 shrink-0" aria-hidden /> {loi}
          </p>
        )}
      </div>

      {kq && (
        <div className="space-y-4" data-testid="gop-von-ket-qua">
          <div className="rounded-2xl border border-gold/40 bg-surface/50 p-5">
            <div className="flex items-center gap-2 text-gold">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              <h4 className="font-serif text-lg text-fg">{kq.tong_quan_hoi_dong.nhan}</h4>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{kq.tong_quan_hoi_dong.tom_tat}</p>
            {kq.lo_hong_hoi_dong.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                {kq.lo_hong_hoi_dong.map((lh) => <li key={lh}>• {lh}</li>)}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {kq.phan_vai_sang_lap.map((p) => (
              <div key={p.ten} className="rounded-2xl border border-line/80 bg-surface/40 p-4 text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-fg">{p.ten}</p>
                  <span className="text-gold">{p.nhat_chu} · Cung {p.menh_quai}</span>
                </div>
                <p className="mt-1 font-medium text-jade">{p.vai_tro_tu_nhien}</p>
                <p className="mt-2 leading-relaxed text-fg-muted"><strong className="text-fg">Sở trường:</strong> {p.diem_manh_gop_von}</p>
                <p className="mt-1 leading-relaxed text-fg-muted"><strong className="text-fg">Điểm mù cần rào:</strong> {p.diem_mu_can_rao}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-jade/35 bg-jade/5 p-5" data-testid="gop-von-dieu-le">
            <div className="flex items-center gap-2 text-jade">
              <FileCheck2 className="size-4 shrink-0" aria-hidden />
              <h4 className="font-serif text-lg text-fg">Các nguyên tắc cần đưa vào Thoả thuận Cổ đông / Góp vốn</h4>
            </div>
            <div className="mt-3 space-y-2.5">
              {kq.dieu_le_rao_chan.map((dl) => (
                <div key={dl.tieu_de} className="rounded-xl border border-line/60 bg-bg/60 p-3 text-xs">
                  <p className="font-semibold text-gold">{dl.tieu_de}</p>
                  <p className="mt-1 leading-relaxed text-fg-muted">{dl.nguyen_tac}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
