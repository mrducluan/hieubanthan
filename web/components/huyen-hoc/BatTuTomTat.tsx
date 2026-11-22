"use client";
import { useState } from "react";
import { BookOpenCheck } from "lucide-react";
import type { LaSoBatTu } from "@/lib/battu-kieu";
import { useChuBatTu } from "@/components/huyen-hoc/chu-bat-tu";
import { useTen } from "@/components/khung/TenHien";
import { cn } from "@/lib/utils";

const NGU_HANH_ORDER = ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"] as const;

const MAU_HANH: Record<string, string> = {
  "Kim": "var(--ls-kim)",
  "Mộc": "var(--ls-moc)",
  "Thủy": "var(--ls-thuy)",
  "Hỏa": "var(--ls-hoa)",
  "Thổ": "var(--ls-tho)",
};

const MUA_THEO_CHI: Record<string, "xuan" | "ha" | "thu" | "dong"> = {
  "Dần": "xuan", "Mão": "xuan", "Thìn": "xuan",
  "Tỵ": "ha", "Ngọ": "ha", "Mùi": "ha",
  "Thân": "thu", "Dậu": "thu", "Tuất": "thu",
  "Hợi": "dong", "Tý": "dong", "Sửu": "dong",
};

export function BatTuTomTat({ ls }: { ls: LaSoBatTu }) {
  const [bachThoai, setBachThoai] = useState(false);
  const { c: cb } = useChuBatTu();
  const ten = useTen();

  const chiThang = ls.tru[1]?.chi ?? "";
  const muaKhoa = MUA_THEO_CHI[chiThang] ?? "xuan";
  const muaTen = cb(`mua.${muaKhoa}`);
  const ptVuong = String(Math.round(ls.than.ti_le * 100));
  const ketVuong = ten("than_vuong", ls.than.ket_luan);

  const diemHanh = ls.ngu_hanh.diem;
  const tongDiem = Object.values(diemHanh).reduce((a, b) => a + b, 0) || 1;

  const phuUcHanh = ls.dung_than.phu_uc.hanh.map((h) => ten("hanh", h));
  const dieuHauHanh = ls.dung_than.dieu_hau.hanh.map((h) => ten("hanh", h));
  const cachCucTen = ls.mo_rong?.cach_cuc_tbct?.ten
    ? ten("cach_cuc_bt", ls.mo_rong.cach_cuc_tbct.ten)
    : ls.dung_than.cach_cuc?.ten
      ? ten("cach_cuc_bt", ls.dung_than.cach_cuc.ten)
      : null;

  const thapThanNoiBat = Array.from(
    new Set(ls.thap_than_can.filter((_, i) => i !== 2).filter(Boolean))
  ).map((t) => ten("thap_than", t));

  return (
    <section aria-label={cb("tt.aria")} className="space-y-3" data-testid="battu-tom-tat">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">{cb("tt.tieu_de")}</p>
        <button
          type="button"
          data-testid="battu-bach-thoai"
          aria-pressed={bachThoai}
          aria-controls="battu-bach-thoai-panel"
          onClick={() => setBachThoai((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            bachThoai
              ? "border-gold bg-gold/15 text-gold"
              : "border-line bg-surface/60 text-fg-muted hover:border-gold/50 hover:text-fg"
          )}
        >
          <BookOpenCheck className="size-3.5" aria-hidden />
          <span>{bachThoai ? cb("bt.nut_mo") : cb("bt.nut")}</span>
        </button>
      </div>

      {bachThoai && (
        <div
          id="battu-bach-thoai-panel"
          data-testid="battu-bach-thoai-noi-dung"
          className="glass space-y-3 rounded-2xl border border-gold/30 p-4 text-sm"
        >
          <p className="text-xs font-medium text-gold">{cb("bt.mo_ta")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 rounded-xl border border-line/60 bg-surface/40 p-3">
              <p className="font-medium text-fg">{cb("bt.nc.tieu_de")}</p>
              <p className="text-xs leading-relaxed text-fg-muted">
                {cb("bt.nc.noi_dung", {
                  can: ten("can", ls.nhat_chu.can),
                  am_duong: ten("am_duong", ls.nhat_chu.am_duong),
                  hanh: ten("hanh", ls.nhat_chu.ngu_hanh),
                })}
              </p>
            </div>
            <div className="space-y-1.5 rounded-xl border border-line/60 bg-surface/40 p-3">
              <p className="font-medium text-fg">{cb("bt.tt.tieu_de")}</p>
              <p className="text-xs text-fg-muted">{cb("bt.tt.noi_dung")}</p>
              <ul className="space-y-1 text-xs text-fg-muted">
                <li>• {cb("bt.tt.ty_kiep")}</li>
                <li>• {cb("bt.tt.thuc_thuong")}</li>
                <li>• {cb("bt.tt.tai")}</li>
                <li>• {cb("bt.tt.quan_sat")}</li>
                <li>• {cb("bt.tt.an")}</li>
              </ul>
              {thapThanNoiBat.length > 0 && (
                <p className="pt-1 text-xs font-medium text-fg">
                  {cb("bt.trong_la_so", { ds: thapThanNoiBat.join(" · ") })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2" data-testid="battu-4-the">
        {/* (a) Nhật chủ */}
        <article className="rounded-2xl border border-line/70 bg-surface/50 p-4" data-testid="the-nhat-chu">
          <p className="text-xs uppercase tracking-[0.14em] text-fg-faint">{cb("tt.nc.nhan")}</p>
          <p className="mt-1.5 font-serif text-2xl text-fg">
            {ten("can", ls.nhat_chu.can)}{" "}
            <span className="text-base font-sans text-fg-muted">
              ({ten("am_duong", ls.nhat_chu.am_duong)} {ten("hanh", ls.nhat_chu.ngu_hanh)})
            </span>
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            {cb("tt.nc.mo_ta", {
              can: ten("can", ls.nhat_chu.can),
              hanh: ten("hanh", ls.nhat_chu.ngu_hanh),
            })}
          </p>
        </article>

        {/* (b) Mùa sinh / Độ vượng */}
        <article className="rounded-2xl border border-line/70 bg-surface/50 p-4" data-testid="the-mua-vuong">
          <p className="text-xs uppercase tracking-[0.14em] text-fg-faint">{cb("tt.mua.nhan")}</p>
          <p className="mt-1.5 font-serif text-2xl text-fg">
            {muaTen}{" "}
            <span className="text-base font-sans text-fg-muted">
              · {ketVuong} ({ptVuong}%)
            </span>
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            {cb("tt.mua.mo_ta", {
              mua: muaTen,
              chi: ten("chi", chiThang),
              ket: ketVuong,
              pt: ptVuong,
            })}
            {typeof ls.than.dac_lenh === "boolean" && (
              <span> · {ls.than.dac_lenh ? cb("tt.mua.dac_lenh") : cb("tt.mua.khong_dac_lenh")}</span>
            )}
          </p>
        </article>

        {/* (c) Ngũ hành count */}
        <article className="rounded-2xl border border-line/70 bg-surface/50 p-4" data-testid="the-ngu-hanh">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-fg-faint">{cb("tt.nh.nhan")}</p>
            <p className="text-xs text-fg-muted">
              {cb("tt.nh.nhieu", { hanh: ten("hanh", ls.ngu_hanh.nhieu_nhat) })}
            </p>
          </div>
          <ul className="mt-2 grid grid-cols-5 gap-1.5 text-center">
            {NGU_HANH_ORDER.map((h) => {
              const d = diemHanh[h] ?? 0;
              const pct = Math.round((d / tongDiem) * 100);
              return (
                <li
                  key={h}
                  className={cn(
                    "rounded-xl border px-1 py-1.5",
                    d === 0 ? "border-line/50 bg-surface/20 opacity-70" : "border-line/80 bg-surface/70"
                  )}
                >
                  <span className="block text-[0.7rem] font-medium" style={{ color: MAU_HANH[h] }}>
                    {ten("hanh", h)}
                  </span>
                  <span className="block text-xs font-semibold text-fg">{pct}%</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-fg-muted">
            {ls.ngu_hanh.thieu.length > 0
              ? cb("tt.nh.thieu", { ds: ls.ngu_hanh.thieu.map((h) => ten("hanh", h)).join(", ") })
              : cb("tt.nh.du")}
          </p>
          <p className="mt-1 text-[0.72rem] leading-snug text-fg-faint">{cb("tt.nh.luu_y")}</p>
        </article>

        {/* (d) Dụng thần — 3 trường phái song song, chon: None */}
        <article
          className="rounded-2xl border border-line/70 bg-surface/50 p-4"
          data-testid="the-dung-than"
          data-chon="none"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-fg-faint">{cb("tt.dt.nhan")}</p>
            <span className="rounded-full border border-line px-2 py-0.5 text-[0.68rem] text-fg-muted">
              {cb("tt.dt.khong_chon")}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-line/60 bg-surface/40 p-2">
              <p className="text-[0.68rem] text-fg-faint">{cb("tt.dt.phu_uc")}</p>
              <p className="mt-0.5 text-sm font-semibold text-fg">
                {phuUcHanh.length > 0 ? phuUcHanh.join(" · ") : cb("tt.dt.khong_bu")}
              </p>
            </div>
            <div className="rounded-xl border border-line/60 bg-surface/40 p-2">
              <p className="text-[0.68rem] text-fg-faint">{cb("tt.dt.dieu_hau")}</p>
              <p className="mt-0.5 text-sm font-semibold text-fg">
                {dieuHauHanh.length > 0 ? dieuHauHanh.join(" · ") : cb("tt.dt.khong_bu")}
              </p>
            </div>
            <div className="rounded-xl border border-line/60 bg-surface/40 p-2">
              <p className="text-[0.68rem] text-fg-faint">{cb("tt.dt.cach_cuc")}</p>
              <p className="mt-0.5 text-sm font-semibold text-fg">
                {cachCucTen ?? cb("tt.dt.chua_ro")}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
