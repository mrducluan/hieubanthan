"use client";
// Chặng 2 — Không gian Cố vấn Kinh doanh & Bàn cờ E2EE (/co-van-kinh-doanh).
import { useState } from "react";
import { ArrowUpRight, Briefcase, Compass, LockKeyhole, Users } from "lucide-react";
import Link from "@/components/khung/Lien";
import type { DoiTacBanCo, MatBangBanCo } from "@/lib/ma-hoa-ban-co";
import { cn } from "@/lib/utils";
import { BanCoMaHoaE2EE } from "./BanCoMaHoaE2EE";
import { CamNangKinhDoanh } from "./CamNangKinhDoanh";
import { CongCoVanTamTai } from "./CongCoVanTamTai";
import { SoiGopVonDoiTac } from "./SoiGopVonDoiTac";

type TabKinhDoanh = "quyet_dinh" | "cam_nang" | "gop_von" | "ban_co_e2ee";

export function KhungCoVanKinhDoanh() {
  const [tab, setTab] = useState<TabKinhDoanh>("cam_nang");
  const [dsChuyenSang, setDsChuyenSang] = useState<DoiTacBanCo[] | null>(null);
  const [mbChuyenSang, setMbChuyenSang] = useState<MatBangBanCo[] | null>(null);

  return (
    <div className="space-y-6" data-testid="khung-co-van-kinh-doanh">
      <div className="flex flex-wrap gap-2 border-b border-line/70 pb-3" role="tablist" aria-label="Không gian Cố vấn Kinh doanh">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "cam_nang"}
          data-testid="tab-cvkd-cam-nang"
          onClick={() => setTab("cam_nang")}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "cam_nang" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Compass className="size-4" aria-hidden /> Mở rộng, Mặt bằng &amp; Bài trí (5 Trụ)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "quyet_dinh"}
          data-testid="tab-cvkd-quyet-dinh"
          onClick={() => setTab("quyet_dinh")}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "quyet_dinh" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Briefcase className="size-4" aria-hidden /> Hỏi Quyết định Kinh doanh
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "gop_von"}
          data-testid="tab-cvkd-gop-von"
          onClick={() => setTab("gop_von")}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "gop_von" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Users className="size-4" aria-hidden /> Soi Bù Khuyết Góp Vốn (2–4 người)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ban_co_e2ee"}
          data-testid="tab-cvkd-ban-co-e2ee"
          onClick={() => setTab("ban_co_e2ee")}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "ban_co_e2ee" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <LockKeyhole className="size-4" aria-hidden /> Bàn cờ Đối tác &amp; Mặt bằng (E2EE)
        </button>
      </div>

      {tab === "cam_nang" && <CamNangKinhDoanh matBangTuBanCo={mbChuyenSang} />}
      {tab === "quyet_dinh" && <CongCoVanTamTai macDinhCheDo="kinh_doanh" />}
      {tab === "gop_von" && <SoiGopVonDoiTac danhSachTuBanCo={dsChuyenSang} />}
      {tab === "ban_co_e2ee" && (
        <BanCoMaHoaE2EE
          onChuyenSangGopVon={(ds) => {
            setDsChuyenSang(ds);
            setTab("gop_von");
          }}
          onChuyenSangCamNang={(mb) => {
            setMbChuyenSang(mb);
            setTab("cam_nang");
          }}
        />
      )}

      {/* CẦU NỐI TÁI SỬ DỤNG CÔNG CỤ ĐIỀU HÀNH CHUYÊN SÂU ĐÃ CÓ (KHÔNG TRÙNG LẶP SEO) */}
      <div className="grid grid-cols-1 gap-3 border-t border-line/70 pt-6 sm:grid-cols-3">
        <Link href="/quan-ly-nhan-su" className="rounded-xl border border-line/70 bg-surface/30 p-3.5 text-xs hover:border-gold/50">
          <p className="flex items-center justify-between font-semibold text-fg">
            <span>Bản đồ Đội ngũ 1–8 nhân sự</span>
            <ArrowUpRight className="size-3.5 text-gold" />
          </p>
          <p className="mt-1 text-fg-muted">Phối hợp giao tiếp 2 chiều &amp; kế hoạch 30 ngày cho đội nhóm.</p>
        </Link>
        <Link href="/quan-ly-nhan-su#lich-12-thang" className="rounded-xl border border-line/70 bg-surface/30 p-3.5 text-xs hover:border-gold/50">
          <p className="flex items-center justify-between font-semibold text-fg">
            <span>Lịch Quyết Định 12 Tháng</span>
            <ArrowUpRight className="size-3.5 text-gold" />
          </p>
          <p className="mt-1 text-fg-muted">Chọn tháng mở rộng, ký kết hay phòng thủ dòng tiền.</p>
        </Link>
        <Link href="/quan-ly-nhan-su#mat-bang" className="rounded-xl border border-line/70 bg-surface/30 p-3.5 text-xs hover:border-gold/50">
          <p className="flex items-center justify-between font-semibold text-fg">
            <span>Chấm Mặt Bằng &amp; Ngày Khai Trương</span>
            <ArrowUpRight className="size-3.5 text-gold" />
          </p>
          <p className="mt-1 text-fg-muted">Đặt vị trí quầy thu ngân, bàn chủ cơ sở &amp; chọn 5 ngày khai trương.</p>
        </Link>
      </div>
    </div>
  );
}
