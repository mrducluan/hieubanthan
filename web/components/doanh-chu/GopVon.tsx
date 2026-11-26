"use client";
// GV-1 — "Khi góp vốn với người khác" (tách từ PR #375, làm lại sau review 2026-11-26). Web CHỈ gửi ngày sinh + đồng ý
// và vẽ kết quả engine trả (vai trò từng người theo đúng bảng của Bản đồ đội ngũ, khâu còn trống, điều lệ gợi ý).
// Không chấm điểm, không khuyên hợp tác hay không với ai, không lưu; mọi ô đồng ý KHÔNG tích sẵn.
import { useState } from "react";
import { AlertTriangle, Handshake, Plus, Scale, Trash2 } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { useHoSo } from "@/lib/hoso";
import type { DoiTacBanCo } from "@/lib/ma-hoa-ban-co";
import { cn } from "@/lib/utils";

interface Nguoi { ten: string; ngaySinh: string; gioiTinh: "nam" | "nu"; tyLe: string; dongY: boolean }
interface PhanVai {
  ten: string; hanh_manh: string; vai_tro: string; gia_tri: string; ten_lam: string; ten_lam_phu?: string; nen_de_y: string;
}
interface KetQua {
  tong_quan: { nhan: string; tom_tat: string };
  phan_vai: PhanVai[];
  khau_con_trong: { ma: string; ten: string; loi: string }[];
  dieu_le_goi_y: { ma: string; tieu_de: string; noi_dung: string }[];
  ranh_gioi_phap_ly: string;
}

const TRONG: Nguoi = { ten: "", ngaySinh: "", gioiTinh: "nam", tyLe: "", dongY: false };

function tuoiTron(iso: string): number | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const h = new Date();
  return h.getFullYear() - y - ((h.getMonth() + 1 < m || (h.getMonth() + 1 === m && h.getDate() < d)) ? 1 : 0);
}

const so2 = (n: number) => String(n).padStart(2, "0");

/** `tuSoNhap`: danh sách đưa sang từ "Sổ nháp đối tác" (/co-van-kinh-doanh) — điền sẵn tên, ngày sinh, tỉ lệ; ô đồng ý vẫn
 *  để TRỐNG, người dùng phải tự tích cho từng người. */
export function GopVon({ tuSoNhap }: { tuSoNhap?: DoiTacBanCo[] | null } = {}) {
  const hoSo = useHoSo();
  const [ds, setDs] = useState<Nguoi[]>(() =>
    tuSoNhap && tuSoNhap.length >= 2
      ? tuSoNhap.slice(0, 4).map((d) => ({
          ten: d.ten.slice(0, 40), ngaySinh: `${d.nam}-${so2(d.thang)}-${so2(d.ngay)}`, gioiTinh: d.gioi_tinh,
          tyLe: d.ty_le_du_kien != null ? String(d.ty_le_du_kien) : "", dongY: false,
        }))
      : [{ ...TRONG, ten: "Bạn" }, { ...TRONG }]);
  const [camKet, setCamKet] = useState(false);
  const [kq, setKq] = useState<KetQua | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);

  const sua = (i: number, p: Partial<Nguoi>) => setDs((x) => x.map((n, k) => (k === i ? { ...n, ...p } : n)));
  const layHoSo = () => {
    if (!hoSo) return;
    sua(0, {
      ngaySinh: `${hoSo.nam}-${String(hoSo.thang).padStart(2, "0")}-${String(hoSo.ngay).padStart(2, "0")}`,
      ...(hoSo.gioi_tinh === "nam" || hoSo.gioi_tinh === "nu" ? { gioiTinh: hoSo.gioi_tinh } : {}),
    });
  };

  const xem = async () => {
    setLoi(null);
    if (ds.some((n) => !n.ngaySinh)) return setLoi("Cần nhập ngày sinh của từng người.");
    if (ds.some((n) => (tuoiTron(n.ngaySinh) ?? 0) < 16)) return setLoi("Mỗi người góp vốn cần đủ 16 tuổi.");
    if (ds.some((n) => !n.dongY) || !camKet) return setLoi("Cần đánh dấu đã có đồng ý của từng người.");
    const tong = ds.reduce((s, n) => s + (n.tyLe ? Number(n.tyLe) : 0), 0);
    if (tong > 100) return setLoi("Tổng tỉ lệ góp vốn đang vượt 100%.");
    setDang(true);
    try {
      const r = await fetch("/api/doanh-chu/gop-von", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cam_ket_thoa_thuan: camKet,
          sang_lap: ds.map((n) => {
            const [y, m, d] = n.ngaySinh.split("-").map(Number);
            return {
              ten: n.ten.trim(), ngay: d, thang: m, nam: y, gioi_tinh: n.gioiTinh, dong_y_tu_nguyen: n.dongY,
              ...(n.tyLe ? { ty_le_du_kien: Number(n.tyLe) } : {}),
            };
          }),
        }),
      });
      const b = await r.json().catch(() => null);
      if (!r.ok || !b) throw new Error((b as { error?: string } | null)?.error || "Chưa xem được, thử lại sau.");
      setKq(b as KetQua);
      ghi("chart_interacted", { mo_dun: "doanh_chu", kind: "gop_von_xem", so_nguoi: ds.length,
        khau_trong: (b as KetQua).khau_con_trong.length });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa xem được, thử lại sau.");
    } finally {
      setDang(false);
    }
  };

  return (
    <section aria-labelledby="gop-von-td" className="space-y-5" data-testid="gop-von">
      <div>
        <h2 id="gop-von-td" className="flex items-center gap-2 font-serif text-2xl text-fg">
          <Handshake className="size-5 text-gold" aria-hidden /> Khi góp vốn với người khác
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          Nhập 2–4 người định cùng góp vốn. Kết quả cho thấy mỗi người nghiêng về khâu nào, khâu nào chưa ai giữ và vài
          điều nên ghi vào thoả thuận từ đầu. Không chấm điểm hợp – khắc, không thay việc tìm hiểu nhau qua công việc thật.
        </p>
      </div>

      <div className="space-y-3">
        {ds.map((n, i) => (
          <fieldset key={i} className="rounded-2xl border border-line/70 bg-surface/30 p-3.5" data-testid="gop-von-nguoi">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Người {i + 1}</legend>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
              <label className="text-xs text-fg-muted">Tên gọi (tuỳ chọn)
                <input value={n.ten} maxLength={40} onChange={(e) => sua(i, { ten: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm text-fg" />
              </label>
              <label className="text-xs text-fg-muted">Ngày sinh
                <input type="date" value={n.ngaySinh} onChange={(e) => sua(i, { ngaySinh: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm text-fg" />
              </label>
              <label className="text-xs text-fg-muted">Giới tính
                <select value={n.gioiTinh} onChange={(e) => sua(i, { gioiTinh: e.target.value as "nam" | "nu" })}
                  className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm text-fg">
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                </select>
              </label>
              <label className="text-xs text-fg-muted">Tỉ lệ góp dự kiến % (tuỳ chọn)
                <input inputMode="decimal" value={n.tyLe} onChange={(e) => sua(i, { tyLe: e.target.value.replace(/[^0-9.]/g, "") })}
                  className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm tabular-nums text-fg" />
              </label>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-start gap-2 text-xs text-fg-muted">
                <input type="checkbox" checked={n.dongY} onChange={(e) => sua(i, { dongY: e.target.checked })}
                  data-testid="gop-von-dong-y" className="mt-0.5" />
                <span>{i === 0 ? "Đây là ngày sinh của tôi / tôi đồng ý dùng để tính" : "Người này đã đồng ý cho dùng ngày sinh để tính"}</span>
              </label>
              <div className="flex gap-2">
                {i === 0 && hoSo && (
                  <button type="button" onClick={layHoSo} className="text-xs text-gold underline-offset-4 hover:underline">
                    Lấy từ hồ sơ của tôi
                  </button>
                )}
                {ds.length > 2 && (
                  <button type="button" onClick={() => setDs((x) => x.filter((_, k) => k !== i))}
                    aria-label={`Bỏ người ${i + 1}`} className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
                    <Trash2 className="size-3.5" aria-hidden /> Bỏ
                  </button>
                )}
              </div>
            </div>
          </fieldset>
        ))}
        {ds.length < 4 && (
          <button type="button" onClick={() => setDs((x) => [...x, { ...TRONG }])}
            className="inline-flex min-h-10 items-center gap-1.5 text-sm text-gold underline-offset-4 hover:underline">
            <Plus className="size-4" aria-hidden /> Thêm người
          </button>
        )}
      </div>

      <label className="flex items-start gap-2 rounded-xl border border-line/70 bg-surface/30 p-3 text-xs leading-relaxed text-fg-muted">
        <input type="checkbox" checked={camKet} onChange={(e) => setCamKet(e.target.checked)} data-testid="gop-von-cam-ket" className="mt-0.5" />
        <span>Tôi xác nhận đã được từng người đồng ý cho dùng ngày sinh. Dữ liệu chỉ dùng để tính trong lượt xem này, không lưu lại.</span>
      </label>

      {loi && <p role="alert" className="flex gap-2 text-sm text-amber-300"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{loi}</p>}
      <button type="button" onClick={xem} disabled={dang} data-testid="gop-von-xem"
        className={cn("inline-flex min-h-11 items-center rounded-full bg-gold px-5 py-2 text-sm font-semibold text-bg",
          dang && "opacity-60")}>
        {dang ? "Đang xem…" : "Xem cách chia vai"}
      </button>

      {kq && (
        <div className="space-y-4" data-testid="gop-von-ket-qua">
          <div className="rounded-2xl border border-gold/40 bg-surface-2/40 p-4">
            <p className="font-serif text-lg text-fg">{kq.tong_quan.nhan}</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{kq.tong_quan.tom_tat}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {kq.phan_vai.map((p, i) => (
              <div key={i} className="rounded-xl border border-line/70 bg-bg/60 p-3.5 text-sm">
                <p className="font-semibold text-fg">{p.ten || `Người ${i + 1}`} · <span className="text-gold">{p.ten_lam}</span></p>
                {p.ten_lam_phu && <p className="mt-0.5 text-xs text-fg-faint">Cũng nghiêng về: {p.ten_lam_phu}</p>}
                <p className="mt-1.5 text-xs text-fg-muted">{p.vai_tro} — {p.gia_tri}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-fg-muted"><span className="font-medium text-fg">Nên để ý: </span>{p.nen_de_y}</p>
              </div>
            ))}
          </div>
          {kq.khau_con_trong.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
              <p className="font-medium text-fg">Khâu chưa ai nghiêng hẳn</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-fg-muted">{kq.khau_con_trong.map((k) => <li key={k.ma}>{k.loi}</li>)}</ul>
            </div>
          )}
          <div className="rounded-2xl border border-line/70 bg-surface/30 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-fg"><Scale className="size-4 text-gold" aria-hidden /> Điều nên bàn và ghi vào thoả thuận</p>
            <ul className="mt-2 space-y-2">
              {kq.dieu_le_goi_y.map((d) => (
                <li key={d.ma}><span className="font-medium text-fg">{d.tieu_de}. </span><span className="text-fg-muted">{d.noi_dung}</span></li>
              ))}
            </ul>
          </div>
          <p role="note" className="text-xs leading-relaxed text-fg-faint" data-testid="gop-von-ranh-gioi">{kq.ranh_gioi_phap_ly}</p>
        </div>
      )}
    </section>
  );
}
