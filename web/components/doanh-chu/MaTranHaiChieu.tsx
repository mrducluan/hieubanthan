"use client";
// Ma Trận Phối Hợp 2 Chiều Thông Minh (Ông Chủ ↔ Cộng Sự) — lọc theo mức bù khuyết,
// soi đủ 6 yếu tố cốt lõi, đối chiếu 2 chiều quản trị & kịch bản mở lời copy 1 chạm.
import { useState } from "react";
import { Check, Copy, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { CHU_DOANH_CHU } from "@/lib/chu/doanh-chu";
import { soNamCaNhan, type MucPhoiHop, type ThanhVienMaTran } from "@/lib/doanh-chu";

type BoLoc = "tat_ca" | MucPhoiHop;

const PHONG_MUC: Record<MucPhoiHop, { badge: string; border: string; dot: string }> = {
  bu_khuyet_cao: {
    badge: "border-jade/40 bg-jade/15 text-jade",
    border: "border-jade/50 bg-jade/5",
    dot: "bg-jade",
  },
  bo_tro_on_dinh: {
    badge: "border-moon/40 bg-moon/15 text-moon",
    border: "border-moon/40 bg-moon/5",
    dot: "bg-moon",
  },
  can_quy_che_ro: {
    badge: "border-[rgb(245_170_80/0.4)] bg-[rgb(245_170_80/0.12)] text-[#f0b35c]",
    border: "border-[rgb(245_170_80/0.45)] bg-[rgb(245_170_80/0.06)]",
    dot: "bg-[#f0b35c]",
  },
};

export function MaTranHaiChieu({
  danhSach,
  namXem,
}: {
  danhSach: ThanhVienMaTran[];
  namXem: number;
}) {
  const [boLoc, setBoLoc] = useState<BoLoc>("tat_ca");
  const [chiSoChon, setChiSoChon] = useState<number>(0);
  const [daChep, setDaChep] = useState<boolean>(false);

  const danhSachLoc =
    boLoc === "tat_ca" ? danhSach : danhSach.filter((tv) => tv.muc_phoi_hop === boLoc);
  const dangChon = danhSachLoc[chiSoChon] ?? danhSachLoc[0] ?? null;

  const demTheoMuc = (muc: MucPhoiHop) => danhSach.filter((tv) => tv.muc_phoi_hop === muc).length;

  async function chepKichBan(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setDaChep(true);
      setTimeout(() => setDaChep(false), 2000);
    } catch {
      /* trình duyệt chặn clipboard */
    }
  }

  return (
    <section className="glass rounded-3xl p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold">{CHU_DOANH_CHU.ma_tran.nho}</p>
          <h2 className="mt-1 font-serif text-2xl text-fg">{CHU_DOANH_CHU.ma_tran.tieu_de}</h2>
          <p className="mt-1 text-sm text-fg-muted">{CHU_DOANH_CHU.ma_tran.phu_de}</p>
        </div>

        {/* Bộ lọc thông minh theo mức độ bù khuyết */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc theo mức phối hợp">
          {(
            [
              ["tat_ca", `${CHU_DOANH_CHU.ma_tran.loc_tat_ca} (${danhSach.length})`],
              ["bu_khuyet_cao", `${CHU_DOANH_CHU.ma_tran.loc_bu_khuyet} (${demTheoMuc("bu_khuyet_cao")})`],
              ["bo_tro_on_dinh", `${CHU_DOANH_CHU.ma_tran.loc_bo_tro} (${demTheoMuc("bo_tro_on_dinh")})`],
              ["can_quy_che_ro", `${CHU_DOANH_CHU.ma_tran.loc_quy_che} (${demTheoMuc("can_quy_che_ro")})`],
            ] as [BoLoc, string][]
          ).map(([ma, nhan]) => {
            const active = boLoc === ma;
            return (
              <button
                key={ma}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setBoLoc(ma);
                  setChiSoChon(0);
                }}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                  active
                    ? "border-gold/60 bg-gold/15 text-gold"
                    : "border-line/70 bg-surface/50 text-fg-muted hover:border-line hover:text-fg"
                }`}
              >
                {nhan}
              </button>
            );
          })}
        </div>
      </div>

      {danhSachLoc.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line/60 bg-surface/40 p-6 text-center text-sm text-fg-muted">
          {CHU_DOANH_CHU.ma_tran.khong_co_ket_qua}
        </p>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[270px_1fr]">
          {/* Cột trái: Danh sách cộng sự (chọn nhanh) */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {danhSachLoc.map((tv, i) => {
              const phong = PHONG_MUC[tv.muc_phoi_hop] ?? PHONG_MUC.bo_tro_on_dinh;
              const selected = dangChon?.ten === tv.ten && i === (danhSachLoc[chiSoChon] ? chiSoChon : 0);
              return (
                <button
                  key={`${tv.ten}-${i}`}
                  type="button"
                  onClick={() => setChiSoChon(i)}
                  className={`min-w-[215px] flex-1 rounded-2xl border p-3.5 text-left transition-all duration-200 lg:min-w-0 lg:flex-none ${
                    selected
                      ? `${phong.border} shadow-card`
                      : "border-line/60 bg-surface/50 hover:border-line hover:bg-surface-2/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-fg">{tv.ten}</span>
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${phong.dot}`} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-fg-muted">
                    {tv.vai_tro_hien_tai || tv.vai_tro_goi_y}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${phong.badge}`}>
                      {tv.nhan_phoi_hop}
                    </span>
                    <span className="rounded-full border border-line/70 bg-bg/60 px-2 py-0.5 text-[11px] text-fg-muted">
                      {tv.chi_so.hanh_manh} · #{tv.chi_so.duong_doi}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cột phải: Bảng soi chi tiết 2 chiều của cộng sự đang chọn */}
          {dangChon && (
            <div
              key={dangChon.ten}
              className="space-y-5 rounded-2xl border border-line/70 bg-surface/55 p-4 sm:p-6 motion-safe:animate-[muc-hien_240ms_ease-out]"
            >
              {/* Dải tổng quan cộng sự */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/60 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-xl text-fg">{dangChon.ten}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        (PHONG_MUC[dangChon.muc_phoi_hop] ?? PHONG_MUC.bo_tro_on_dinh).badge
                      }`}
                    >
                      {dangChon.nhan_phoi_hop}
                    </span>
                    {dangChon.chi_so.bu_khuyet_ngu_hanh && (
                      <span className="rounded-full border border-jade/40 bg-jade/10 px-2.5 py-0.5 text-xs text-jade">
                        {CHU_DOANH_CHU.ma_tran.bu_khuyet_tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-fg-muted">
                    {CHU_DOANH_CHU.ma_tran.vai_tro_goi_y}:{" "}
                    <strong className="font-medium text-gold">{dangChon.vai_tro_goi_y}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="rounded-xl border border-line/70 bg-bg/70 px-3 py-1.5">
                    <span className="text-fg-faint">{CHU_DOANH_CHU.ma_tran.hanh_chinh}: </span>
                    <strong className="text-jade">{dangChon.chi_so.hanh_manh}</strong>
                  </div>
                  <div className="rounded-xl border border-line/70 bg-bg/70 px-3 py-1.5">
                    <span className="text-fg-faint">{CHU_DOANH_CHU.ma_tran.so_chu_dao}: </span>
                    <strong className="tabular-nums text-fg">{dangChon.chi_so.duong_doi}</strong>
                  </div>
                  <div className="rounded-xl border border-line/70 bg-bg/70 px-3 py-1.5">
                    <span className="text-fg-faint">{CHU_DOANH_CHU.ma_tran.nam_ca_nhan} {namXem}: </span>
                    <strong className="tabular-nums text-gold">{soNamCaNhan(dangChon.chi_so.nam_ca_nhan)}</strong>
                  </div>
                </div>
              </div>

              {/* Đối chiếu 2 chiều: Ông Chủ cần chú ý ↔ Nhân Sự cần lưu ý */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[rgb(245_170_80/0.35)] bg-[rgb(245_170_80/0.08)] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#f0b35c]">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{CHU_DOANH_CHU.ma_tran.cot_ong_chu}</span>
                  </div>
                  <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-fg">
                    {dangChon.ong_chu_can_chu_y.map((dong, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0b35c]" />
                        <span>{dong}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-jade/35 bg-jade/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-jade">
                    <UserCheck className="h-4 w-4 shrink-0" />
                    <span>{CHU_DOANH_CHU.ma_tran.cot_nhan_su}</span>
                  </div>
                  <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-fg">
                    {dangChon.nhan_su_can_luu_y.map((dong, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-jade" />
                        <span>{dong}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Kịch bản mở lời hóa giải bất đồng (Copy 1 chạm) */}
              <div className="rounded-2xl border border-gold/35 bg-gold/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gold">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>{CHU_DOANH_CHU.ma_tran.kich_ban_tieu_de}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => chepKichBan(dangChon.kich_ban_trao_doi)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-surface/80 px-3 py-1 text-xs font-medium text-gold transition hover:bg-surface-2"
                  >
                    {daChep ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{daChep ? CHU_DOANH_CHU.ma_tran.da_chep_kich_ban : CHU_DOANH_CHU.ma_tran.nut_chep_kich_ban}</span>
                  </button>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fg">{dangChon.kich_ban_trao_doi}</p>
              </div>

              {/* 6 yếu tố cốt lõi */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-fg-faint">
                  {CHU_DOANH_CHU.ma_tran.sau_yeu_to}
                </p>
                <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                  {dangChon.sau_yeu_to_cot_loi.map((yt, idx) => (
                    <div key={idx} className="rounded-xl border border-line/60 bg-bg/50 p-3.5">
                      <p className="text-xs font-semibold text-gold">{yt.yeu_to}</p>
                      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{yt.chi_tiet}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
