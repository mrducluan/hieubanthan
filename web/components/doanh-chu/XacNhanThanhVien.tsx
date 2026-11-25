"use client";
// Biểu mẫu để chính nhân sự tự xác nhận đồng ý (Luật BVDLCN 91/2025/QH15) và nhận mã hóa AES-256-GCM gửi lại trưởng nhóm.
import { useState } from "react";
import { Check, Copy, Lock, ShieldCheck } from "lucide-react";
import Link from "@/components/khung/Lien";
import { CHU_DOANH_CHU } from "@/lib/chu/doanh-chu";
import type { CaNhanDoiNgu } from "@/lib/doanh-chu";
import { ghi } from "@/lib/do-luong";

export function XacNhanThanhVien({ maMoi, tenNhom }: { maMoi: string; tenNhom: string }) {
  const [bietDanh, setBietDanh] = useState<string>("");
  const [vaiTro, setVaiTro] = useState<string>("");
  const [ngay, setNgay] = useState<string>("10");
  const [thang, setThang] = useState<string>("3");
  const [nam, setNam] = useState<string>("1992");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [dongY, setDongY] = useState<boolean>(false);

  const [dangGui, setDangGui] = useState<boolean>(false);
  const [loi, setLoi] = useState<string>("");
  const [tvToken, setTvToken] = useState<string>("");
  const [daChep, setDaChep] = useState<boolean>(false);
  const [caNhan, setCaNhan] = useState<CaNhanDoiNgu | null>(null);

  async function guiXacNhan(e: React.FormEvent) {
    e.preventDefault();
    setLoi("");
    if (!dongY) {
      setLoi("Bạn cần tự nguyện tích đồng ý trước khi tạo mã bảo mật.");
      return;
    }
    setDangGui(true);
    try {
      const r = await fetch("/api/doanh-chu/xac-nhan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ma_moi: maMoi,
          biet_danh: bietDanh.trim() || "Cộng sự",
          vai_tro: vaiTro.trim(),
          ngay: Number(ngay),
          thang: Number(thang),
          nam: Number(nam),
          gioi_tinh: gioiTinh,
          dong_y_tu_nguyen: true,
        }),
      });
      const data = (await r.json().catch(() => null)) as { tv_token?: string; error?: string; ca_nhan?: CaNhanDoiNgu | null } | null;
      if (!r.ok || !data?.tv_token) {
        setLoi(data?.error ?? "Không tạo được mã bảo mật. Kiểm tra lại ngày sinh.");
        return;
      }
      setTvToken(data.tv_token);
      if (data.ca_nhan) {
        setCaNhan(data.ca_nhan);
        ghi("chart_interacted", { mo_dun: "doanh_chu", kind: "ca_nhan_xem" });
      }
    } catch {
      setLoi("Không kết nối được máy chủ.");
    } finally {
      setDangGui(false);
    }
  }

  async function chepMa() {
    if (!tvToken) return;
    try {
      await navigator.clipboard.writeText(tvToken);
      setDaChep(true);
      setTimeout(() => setDaChep(false), 2000);
    } catch {
      /* trình duyệt chặn clipboard */
    }
  }

  if (tvToken) {
    return (
      <div className="bau-troi space-y-4 p-6">
        <div className="flex items-center gap-2 text-jade">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="font-serif text-xl text-fg">{CHU_DOANH_CHU.trang_moi.thanh_cong_tieu_de}</h2>
        </div>
        <p className="text-sm text-fg-muted">{CHU_DOANH_CHU.trang_moi.thanh_cong_mo_ta}</p>
        <div className="rounded-2xl border border-jade/40 bg-bg/80 p-3.5 font-mono text-xs break-all text-jade">
          {tvToken}
        </div>
        <button
          type="button"
          onClick={chepMa}
          className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/20 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/30"
        >
          {daChep ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{daChep ? CHU_DOANH_CHU.buoc_nhap.da_chep : CHU_DOANH_CHU.trang_moi.nut_chep_ma}</span>
        </button>
        {caNhan && <BanCaNhan cn={caNhan} />}
      </div>
    );
  }

  return (
    <form onSubmit={guiXacNhan} className="glass space-y-5 rounded-3xl p-5 sm:p-7">
      <div className="rounded-2xl border border-jade/35 bg-jade/10 p-4 text-sm">
        <p className="text-xs text-jade">{CHU_DOANH_CHU.trang_moi.nhom_label}</p>
        <p className="mt-0.5 font-serif text-lg text-fg">{tenNhom}</p>
      </div>

      <div className="space-y-2 rounded-2xl border border-[rgb(245_170_80/0.35)] bg-[rgb(245_170_80/0.08)] p-4 text-xs leading-relaxed text-[#f0b35c]">
        <p>• {CHU_DOANH_CHU.trang_moi.cam_ket_1}</p>
        <p>• {CHU_DOANH_CHU.trang_moi.cam_ket_2}</p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.trang_moi.biet_danh_nhan}</label>
          <input
            type="text"
            required
            value={bietDanh}
            onChange={(e) => setBietDanh(e.target.value)}
            placeholder={CHU_DOANH_CHU.trang_moi.biet_danh_goi_y}
            maxLength={40}
            className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm text-fg placeholder:text-fg-faint"
          />
        </div>
        <div>
          <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.vai_tro_nhan}</label>
          <input
            type="text"
            value={vaiTro}
            onChange={(e) => setVaiTro(e.target.value)}
            placeholder={CHU_DOANH_CHU.trang_moi.vai_tro_goi_y}
            maxLength={60}
            className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm text-fg placeholder:text-fg-faint"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div>
          <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.ngay_nhan}</label>
          <input
            type="number"
            min={1}
            max={31}
            required
            value={ngay}
            onChange={(e) => setNgay(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm tabular-nums text-fg"
          />
        </div>
        <div>
          <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.thang_nhan}</label>
          <input
            type="number"
            min={1}
            max={12}
            required
            value={thang}
            onChange={(e) => setThang(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm tabular-nums text-fg"
          />
        </div>
        <div>
          <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.nam_nhan}</label>
          <input
            type="number"
            min={1930}
            max={2025}
            required
            value={nam}
            onChange={(e) => setNam(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm tabular-nums text-fg"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.gioi_tinh_nhan}</label>
        <div className="mt-1 grid max-w-xs grid-cols-2 gap-2">
          {(["nam", "nu"] as const).map((gt) => (
            <button
              key={gt}
              type="button"
              onClick={() => setGioiTinh(gt)}
              className={`rounded-xl border py-2 text-sm transition ${
                gioiTinh === gt
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : "border-line/70 bg-bg/50 text-fg-muted hover:text-fg"
              }`}
            >
              {gt === "nam" ? CHU_DOANH_CHU.buoc_nhap.nam : CHU_DOANH_CHU.buoc_nhap.nu}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-line/70 bg-bg/50 p-3.5 text-sm text-fg">
        <input
          type="checkbox"
          checked={dongY}
          onChange={(e) => setDongY(e.target.checked)}
          className="mt-1 h-4 w-4 accent-jade"
        />
        <span>{CHU_DOANH_CHU.trang_moi.tick_dong_y}</span>
      </label>

      {loi && <p className="text-sm text-[#ef8a6f]">{loi}</p>}

      <button
        type="submit"
        disabled={dangGui || !dongY}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-jade/50 bg-jade/20 py-3 text-sm font-semibold text-jade transition hover:bg-jade/30 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Lock className="h-4 w-4" />
        <span>{dangGui ? CHU_DOANH_CHU.trang_moi.dang_tao_ma : CHU_DOANH_CHU.trang_moi.nut_tao_ma}</span>
      </button>
    </form>
  );
}

/** QLNS-1 — "Cách làm việc của bạn": phần quà cho chính người vừa xác nhận (chỉ trên máy họ, engine không lưu),
 *  kèm lối sang thần số học và lối "bạn cũng quản lý một nhóm?" (người được mời thành người lập bản đồ mới). */
function BanCaNhan({ cn }: { cn: CaNhanDoiNgu }) {
  const T = CHU_DOANH_CHU.trang_moi;
  const dong = (nhan: string, chu: string) => (
    <div className="rounded-2xl border border-line/60 bg-bg/50 p-3.5">
      <p className="text-xs font-semibold text-jade">{nhan}</p>
      <p className="mt-1 text-sm leading-relaxed text-fg">{chu}</p>
    </div>
  );
  const bam = (den: string) => ghi("cross_cta_clicked", { tu: "quan_ly_nhan_su_moi", den });
  return (
    <section className="mt-6 space-y-3 border-t border-line/60 pt-5" data-testid="ban-ca-nhan">
      <h2 className="font-serif text-xl text-fg">{cn.nhan.tieu_de}</h2>
      <p className="text-xs text-fg-muted">{T.ca_nhan_mo_ta}</p>
      <p className="text-sm text-fg">
        <span className="text-gold">{cn.hanh_manh}</span> · {cn.vai_tro_hop}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {dong(cn.nhan.nhan_manh, cn.manh)}
        {dong(cn.nhan.nhan_lam_tot, cn.lam_tot)}
        {dong(cn.nhan.nhan_de_y, cn.de_y)}
        {dong(cn.nhan.nhan_trao_doi, cn.trao_doi)}
      </div>
      {dong(`${cn.nhan.nhan_nam} ${cn.nam_xem}`, cn.nhip_nam)}
      <p className="text-xs leading-relaxed text-fg-faint">{cn.nhan.ve_nhom}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Link href="/than-so" onClick={() => bam("than_so")}
          className="inline-flex min-h-[44px] items-center rounded-full border border-gold/50 bg-gold/15 px-4 text-sm font-medium text-gold hover:bg-gold/25">
          {T.ca_nhan_than_so}
        </Link>
        <Link href="/quan-ly-nhan-su" onClick={() => bam("lap_ban_do")}
          className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 text-sm text-fg hover:border-gold/60">
          {T.ca_nhan_nhom_minh}
        </Link>
        <Link href="/hom-nay" onClick={() => bam("hom_nay")}
          className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 text-sm text-fg-muted hover:text-fg">
          {T.ca_nhan_hom_nay}
        </Link>
      </div>
    </section>
  );
}
