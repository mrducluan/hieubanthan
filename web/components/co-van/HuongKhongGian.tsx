"use client";
// CV-2 — "Thêm hướng" cho Cố vấn: chỉ hiện khi ENGINE nói câu hỏi cần một hướng (`can_bo_sung`). Thứ tự ưu tiên:
//   1) lấy sẵn từ hồ sơ đã có trên máy (hồ sơ cửa hàng của /quan-ly-nhan-su, hồ sơ nhà của /phong-thuy) — một chạm;
//   2) đo bằng la bàn điện thoại / ảnh vệ tinh — dùng lại đúng công cụ của /phong-thuy (không ghi đè hồ sơ nhà khi đo cửa hàng);
//   3) chọn nhanh một trong 8 hướng hoặc gõ số độ.
// Web không tự tính hướng: số độ do la bàn / người dùng đưa, engine đổi ra hướng và chấm.
import { useState } from "react";
import { ArrowUpRight, Compass, Home, Store } from "lucide-react";
import Link from "@/components/khung/Lien";
import { DoHuongDienThoai } from "@/components/huyen-hoc/DoHuongDienThoai";
import { ghi } from "@/lib/do-luong";
import { HUONG_NHANH, type HuongChon } from "@/lib/huong-co-van";

export type NguonHuong = "ho_so_cua_hang" | "ho_so_nha" | "cung_nha" | "la_ban" | "nhap_tay";
export const TEN_NGUON_HUONG: Record<NguonHuong, string> = {
  ho_so_cua_hang: "hồ sơ cửa hàng", ho_so_nha: "hồ sơ nhà", cung_nha: "hồ sơ nhà (cửa hàng ở chính căn nhà này)",
  la_ban: "đo bằng la bàn", nhap_tay: "bạn nhập",
};
export type { HuongChon };

const moTa = (h: HuongChon) => `${h.do_huong}°${h.nam_xay ? `, xây ${h.nam_xay}` : ""}`;

export function HuongKhongGian({ loai, nhan, lyDo, nhaHoSo, cuaHangHoSo, ngaySinh, gioiTinh, onChon }: {
  loai: "mat_bang" | "nha_o";
  nhan: string;
  lyDo: string;
  nhaHoSo: HuongChon | null;
  cuaHangHoSo: HuongChon | null;
  ngaySinh: string;
  gioiTinh: "nam" | "nu";
  onChon: (h: HuongChon, nguon: NguonHuong) => void;
}) {
  const [moLaBan, setMoLaBan] = useState(false);
  const [doTay, setDoTay] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  const chon = (h: HuongChon, nguon: NguonHuong) => {
    ghi("chart_interacted", { mo_dun: "tam_tai", kind: "co_van_huong", loai, nguon });   // chỉ mã, không số độ
    onChon(h, nguon);
  };
  const nhapTay = () => {
    const n = Number(doTay);
    if (doTay.trim() === "" || !Number.isFinite(n) || n < 0 || n >= 360) { setLoi("Nhập số độ từ 0 đến 359, hoặc bấm một trong tám hướng."); return; }
    setLoi(null);
    chon({ do_huong: n }, "nhap_tay");
  };
  const nutLay = "inline-flex min-h-11 items-center gap-2 rounded-xl border border-gold/45 bg-gold/10 px-3.5 py-2 text-left text-sm text-fg transition-colors hover:bg-gold/20";

  return (
    <section className="rounded-2xl border border-gold/45 bg-gold/[0.06] p-4 sm:p-5" data-testid="co-van-nang-huong" data-loai={loai}>
      <h3 className="flex items-center gap-2 font-serif text-lg text-fg">
        {loai === "mat_bang" ? <Store className="size-4 text-gold" aria-hidden /> : <Home className="size-4 text-gold" aria-hidden />}
        {nhan}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{lyDo}</p>

      {(cuaHangHoSo || nhaHoSo) && (
        <div className="mt-3 flex flex-wrap gap-2" data-testid="co-van-huong-ho-so">
          {loai === "mat_bang" && cuaHangHoSo && (
            <button type="button" className={nutLay} onClick={() => chon(cuaHangHoSo, "ho_so_cua_hang")} data-testid="co-van-huong-lay-cua-hang">
              <Store className="size-4 shrink-0 text-gold" aria-hidden />
              <span>Dùng hồ sơ cửa hàng <span className="text-fg-muted">({moTa(cuaHangHoSo)})</span></span>
            </button>
          )}
          {loai === "mat_bang" && nhaHoSo && (
            <button type="button" className={nutLay} onClick={() => chon(nhaHoSo, "cung_nha")} data-testid="co-van-huong-cung-nha">
              <Home className="size-4 shrink-0 text-gold" aria-hidden />
              <span>Cửa hàng ở chính căn nhà này <span className="text-fg-muted">({moTa(nhaHoSo)})</span></span>
            </button>
          )}
          {loai === "nha_o" && nhaHoSo && (
            <button type="button" className={nutLay} onClick={() => chon(nhaHoSo, "ho_so_nha")} data-testid="co-van-huong-lay-nha">
              <Home className="size-4 shrink-0 text-gold" aria-hidden />
              <span>Dùng hồ sơ nhà trên máy <span className="text-fg-muted">({moTa(nhaHoSo)})</span></span>
            </button>
          )}
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-medium text-fg-muted">{cuaHangHoSo || nhaHoSo ? "Hoặc đo / chọn hướng khác" : "Đo hoặc chọn hướng"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setMoLaBan((v) => !v)} aria-expanded={moLaBan} data-testid="co-van-huong-mo-la-ban"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">
            <Compass className="size-3.5" aria-hidden /> {moLaBan ? "Đóng la bàn" : "Đo bằng la bàn điện thoại / ảnh vệ tinh"}
          </button>
          {HUONG_NHANH.map((h) => (
            <button key={h.ten} type="button" onClick={() => chon({ do_huong: h.do }, "nhap_tay")} data-testid={`co-van-huong-${h.do}`}
              className="min-h-10 rounded-full border border-line/70 bg-bg/50 px-3 text-xs text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">
              {h.ten}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input type="number" inputMode="decimal" min={0} max={359.9} step="0.1" placeholder="Hoặc gõ số độ (0–359)" value={doTay}
            onChange={(e) => setDoTay(e.target.value)} aria-label="Số độ hướng" data-testid="co-van-huong-do"
            className="min-h-10 w-48 rounded-lg border border-line bg-bg px-3 text-sm text-fg" />
          <button type="button" onClick={nhapTay} data-testid="co-van-huong-nhap"
            className="min-h-10 rounded-full bg-gold px-4 text-xs font-semibold text-bg hover:opacity-95">Dùng số này</button>
        </div>
        {loi && <p role="alert" className="mt-1.5 text-xs text-amber-300">{loi}</p>}
      </div>

      {moLaBan && (
        <div className="mt-4" data-testid="co-van-huong-la-ban">
          <p className="mb-2 text-xs text-fg-muted">
            {loai === "mat_bang"
              ? "Đứng ở cửa chính của cửa hàng, quay mặt ra ngoài đường để đo. Bấm Chốt xong, hướng được dùng ngay (không đổi hồ sơ nhà của bạn)."
              : "Đứng ở cửa chính của căn nhà, quay mặt ra ngoài để đo. Bấm Chốt xong, hướng được dùng ngay."}
          </p>
          <DoHuongDienThoai
            sinh={ngaySinh ? { birth_date: ngaySinh, gender: gioiTinh } : null}
            luuNha={loai === "nha_o"}
            onChot={(r) => chon({ do_huong: r.do_huong }, "la_ban")}
          />
        </div>
      )}

      <p className="mt-4 text-xs text-fg-faint">
        Muốn đo kỹ hơn (ảnh vệ tinh, bản đồ)?{" "}
        <Link href={loai === "mat_bang" ? "/quan-ly-nhan-su#mat-bang" : "/phong-thuy"} className="inline-flex items-center gap-0.5 text-gold hover:underline">
          {loai === "mat_bang" ? "Mặt bằng & Khai trương" : "Phong thuỷ"} <ArrowUpRight className="size-3" aria-hidden />
        </Link>{" "}
        — hướng đã lưu ở đó sẽ tự có mặt ở đây lần sau.
      </p>
    </section>
  );
}
