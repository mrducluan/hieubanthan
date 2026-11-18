"use client";
// UI-HHT (chủ dự án 2026-11-18) — "Tra một chạm" đầu trang hướng hợp tuổi: chọn năm sinh + giới tính (+ "sinh trước Lập
// xuân") → la bàn của chính người đó ngay tại chỗ. Dữ liệu là bảng engine đã trả cho trang (GET /v1/phongthuy/cung-phi,
// 46 năm × nam / nữ, 4 hướng tốt đã xếp hạng) — không gọi engine, không tính gì ở trình duyệt; năm ngoài bảng → mời
// công cụ Phong thuỷ. Năm đã chọn chỉ nằm trong trang (không lưu, không gửi đo lường).
import { useMemo, useState } from "react";
import Link from "@/components/khung/Lien";
import { ArrowRight } from "lucide-react";
import { LaBanSong, type HuongSong } from "@/components/phong-thuy/LaBanSong";
import { KyMonHuongHop } from "@/components/ky-mon/KyMonTheoNgay";
import type { DongTuoiCung } from "@/lib/kien-thuc";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

const HUONG = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
// Thứ tự engine xếp 4 hướng tốt (`THU_TU_CAT` của engine) — chỉ là NHÃN của vị trí, không phải phép tính.
const DU_NIEN_TOT = ["Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị"];
const dm = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);
const GIOI = { nam: "Nam", nu: "Nữ" } as const;

export function TraHuongTuoi({ tuoi, duongCung }: { tuoi: DongTuoiCung[]; duongCung: Record<string, string> }) {
  const [nam, setNam] = useState<number | null>(null);
  const [gioi, setGioi] = useState<"nam" | "nu">("nam");
  const [truoc, setTruoc] = useState(false);
  const dong = nam ? tuoi.find((t) => t.nam === nam) : undefined;
  const namTinh = nam && truoc ? nam - 1 : nam;
  const dongTinh = namTinh ? tuoi.find((t) => t.nam === namTinh) : undefined;
  const g = dongTinh ? (gioi === "nam" ? dongTinh.nam_gioi : dongTinh.nu_gioi) : undefined;
  const huong = useMemo<HuongSong[]>(() => g ? HUONG.map((h) => {
    const i = g.tot.indexOf(h);
    return i >= 0 ? { huong: h, du_nien: DU_NIEN_TOT[i], cat: true, hang: i + 1 } : { huong: h, cat: false };
  }) : [], [g]);
  const chon = (n: number | null, gt = gioi, tr = truoc) => {
    setNam(n); setGioi(gt); setTruoc(tr);
    if (n) ghi("chart_interacted", { mo_dun: "phongthuy", kind: "tra_huong_tuoi", gioi: gt, truoc_lap_xuan: tr });
  };

  return (
    <section className="glass mt-6 rounded-2xl p-5 sm:p-6" aria-labelledby="tra-huong" data-testid="tra-huong-tuoi">
      <h2 id="tra-huong" className="text-xl sm:text-2xl">Tra nhanh: bạn sinh năm nào?</h2>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-fg-muted">
          Năm sinh
          <select value={nam ?? ""} onChange={(e) => chon(e.target.value ? Number(e.target.value) : null)}
            className="min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-fg" data-testid="tra-nam">
            <option value="">Chọn năm</option>
            {[...tuoi].reverse().map((t) => <option key={t.nam} value={t.nam}>{t.nam} ({t.can_chi})</option>)}
          </select>
        </label>
        <div role="radiogroup" aria-label="Giới tính" className="flex gap-1.5">
          {(["nam", "nu"] as const).map((x) => (
            <button key={x} type="button" role="radio" aria-checked={gioi === x} onClick={() => chon(nam, x)}
              className={cn("min-h-11 rounded-xl border px-4 text-sm", gioi === x ? "border-gold bg-gold/10 text-fg" : "border-line text-fg-muted hover:text-fg")}>
              {GIOI[x]}
            </button>
          ))}
        </div>
      </div>
      {dong && (
        <label className="mt-3 flex items-start gap-2 text-sm text-fg-muted">
          <input type="checkbox" checked={truoc} onChange={(e) => chon(nam, gioi, e.target.checked)} className="mt-1 size-4 accent-[rgb(var(--gold))]" />
          <span>Tôi sinh trước Lập xuân năm {dong.nam} (trước ngày {dm(dong.lap_xuan)}) — Bát trạch tính theo năm {dong.nam - 1}.</span>
        </label>
      )}
      {!nam && <p className="mt-4 text-sm text-fg-muted">Bảng có năm sinh 1960–2005. Sinh năm khác hoặc muốn tính đúng theo ngày sinh: <Link href="/phong-thuy" className="text-gold underline">công cụ Phong thuỷ</Link>.</p>}
      {nam && !g && (
        <p className="mt-4 text-sm text-fg-muted">Năm {namTinh} nằm ngoài bảng 1960–2005 — mở <Link href="/phong-thuy" className="text-gold underline">công cụ Phong thuỷ</Link> và nhập ngày sinh.</p>
      )}
      {g && namTinh && (
        <div className="mt-5" data-testid="tra-ket-qua">
          <p className="text-lg leading-relaxed text-fg">
            {GIOI[gioi]} sinh năm {namTinh}{truoc ? ` (tính theo năm trước Lập xuân)` : ""}: <b className="text-gold">cung {g.quai}</b>, {g.nhom}.
            Hướng tốt nhất <b>{g.tot[0]}</b>; tiếp theo {g.tot.slice(1).join(", ")}.
          </p>
          <div className="mt-4">
            <LaBanSong key={g.quai} huong={huong} quai={g.quai} nhom={g.nhom} maDo="la_ban_tra_tuoi" />
          </div>
          <KyMonHuongHop huongCat={g.tot} maDo="tra_huong_tuoi" tieuDe="Hôm nay, các hướng tốt của bạn thuận vào giờ nào?"
            ghiChu={"Bốn hướng tốt theo Bát trạch (thứ hạng không đổi) ghép với hướng thuận của từng canh giờ theo Kỳ Môn — chỉ để chọn lúc làm việc quan trọng."} />
          <Link href={`${duongCung[g.slug] ?? "#"}#${gioi}-${namTinh}`}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 px-4 text-sm text-fg hover:bg-gold/10"
            onClick={() => ghi("cross_cta_clicked", { tu: "tra_huong_tuoi", den: "cung_phi" })}>
            Xem đầy đủ cung {g.quai}: bố trí cửa, bếp, giường, sách xưa <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}
    </section>
  );
}
