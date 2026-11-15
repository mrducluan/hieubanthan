"use client";
// UI-PT 3 — "Hành trình nhà bạn": một thẻ đầu trang Phong thuỷ nối 5 khối rời (mệnh quái → đo hướng → bài đọc → khảo sát
// kỹ → sao theo năm) thành một đường đi có trạng thái, đọc từ hồ sơ nhà lưu TRÊN MÁY (lib/ho-so-nha) + mệnh quái đã tính.
// UI-PT2 A: chọn LOẠI NHÀ ngay đầu (nhà phố / chung cư / biệt thự / cấp 4) — các khối bên dưới đổi hướng dẫn, chỗ đo, luật
// căn hộ theo đó. UI-PT2 P5: lưu tối đa 3 căn để so, đổi căn đang xem. Trả lời ba câu người xem nhà hay hỏi: nhà có hợp
// tôi? · kê gì ở đâu? · khi nào sửa? Không gọi máy chủ (so hai căn mới gọi engine).
import { useState } from "react";
import { Building2, Check, ChevronRight, Home, Pencil, Save, Scale, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  chonCan, LOAI_NHA, luuCanDeSo, luuHoSoNha, tenCan, tenLoaiNha, tenNha, TOI_DA_CAN, useDanhSachNha, useHoSoNha, xoaCan, xoaHoSoNha,
  type LoaiNha,
} from "@/lib/ho-so-nha";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { SoHaiCan, type SinhSo } from "@/components/huyen-hoc/SoHaiCan";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";

type TrangThai = "xong" | "san_sang" | "cho";
interface Buoc { ma: string; ten: string; chi: string; trang_thai: TrangThai; neo: string }

function ngayNgan(iso?: string, en = false): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return en ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d) : `${d.getDate()}/${d.getMonth() + 1}`;
}

export function HanhTrinhNha({ mq, coSinh, sinh = null }: { mq: { quai: string; nhom: string; so?: number } | null; coSinh: boolean; sinh?: SinhSo }) {
  const nha = useHoSoNha();
  const ds = useDanhSachNha();
  const [suaTen, setSuaTen] = useState(false);
  const [ten, setTen] = useState("");
  const [hoiXoa, setHoiXoa] = useState(false);
  const [moSo, setMoSo] = useState(false);
  const [baoLuu, setBaoLuu] = useState<string | null>(null);
  const { c: t, en, quai, nhom, huong } = useChuPT();
  if (nha === undefined) return null;

  const canHo = nha?.loai_nha === "can_ho";
  const coHuong = Boolean(nha && (nha.huong_do != null || nha.huong));
  const bc = nha?.bo_cuc;
  const soPhong = Object.keys(bc?.vi_tri ?? {}).length;
  const soDau = bc?.dau_hieu?.length ?? 0;
  const coKhaoSat = soPhong > 0 || soDau > 0 || Boolean(bc?.mat_bang);
  const buoc: Buoc[] = [
    { ma: "menh", ten: t("ht.b1"), neo: "#menh-quai",
      trang_thai: mq ? "xong" : coSinh ? "san_sang" : "cho",
      chi: mq ? t("ht.b1_xong", { quai: en && mq.so ? `${mq.so} (${quai(mq.quai)})` : quai(mq.quai), nhom: nhom(mq.nhom) }) : coSinh ? t("ht.b1_dang") : t("ht.b1_can") },
    { ma: "huong", ten: t("ht.b2"), neo: "#do-huong",
      trang_thai: coHuong ? "xong" : "san_sang",
      chi: coHuong ? (nha!.huong_do != null ? `${nha!.huong_do}°${nha!.theo === "ban_cong" ? t("ht.ban_cong") : ""}` : huong(nha!.huong!))
        : canHo ? t("ht.b2_can_ho") : t("ht.b2_can") },
    { ma: "doc", ten: t("ht.b3"), neo: "#nha-cua-ban",
      trang_thai: coHuong || mq ? "san_sang" : "cho",
      chi: coHuong ? t("ht.b3_san") : t("ht.b3_can") },
    { ma: "khao_sat", ten: t("ht.b4"), neo: "#khao-sat-nha",
      trang_thai: coKhaoSat ? "xong" : "san_sang",
      chi: coKhaoSat ? [soPhong ? (soPhong === 1 ? t("ht.phong_1") : t("ht.phong", { so: String(soPhong) })) : "", soDau ? (soDau === 1 ? t("ht.dau_hieu_1") : t("ht.dau_hieu", { so: String(soDau) })) : "", bc?.mat_bang ? t("ht.mat_bang") : ""].filter(Boolean).join(" · ") : t("ht.b4_can") },
    { ma: "nam", ten: t("ht.b5"), neo: "#huyen-khong",
      trang_thai: nha?.nam_xay && (nha.toa || nha.huong_do != null) ? "xong" : coHuong ? "san_sang" : "cho",
      chi: nha?.nam_xay ? t("ht.b5_xong", { nam: String(nha.nam_xay) }) : t("ht.b5_can") },
  ];
  const daXong = buoc.filter((b) => b.trang_thai === "xong").length;

  const chonLoai = (m: LoaiNha) => {
    try { luuHoSoNha({ loai_nha: m, ...(m === "can_ho" && !coHuong ? { theo: "ban_cong" } : {}) }); } catch { /* bỏ qua */ }
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "chon_loai_nha", loai_nha: m });
  };
  const luuTen = () => {
    const tg = ten.trim().slice(0, 40);
    try { luuHoSoNha({ ten_goi: tg || undefined }); } catch { /* bỏ qua */ }
    setSuaTen(false);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "dat_ten_nha" });
  };
  const xoa = () => {
    xoaHoSoNha(); setHoiXoa(false); setMoSo(false);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "xoa_nha" });
  };
  const luuDeSo = () => {
    const c = luuCanDeSo();
    setBaoLuu(c ? t("ht.da_luu", { ten: tenCan(c, (ds ?? []).findIndex((x) => x.id === c.id) < 0 ? (ds ?? []).length : (ds ?? []).findIndex((x) => x.id === c.id), en) }) : t("ht.du_can", { so: String(TOI_DA_CAN) }));
    window.setTimeout(() => setBaoLuu(null), 3500);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "luu_can_so", so_can: (ds?.length ?? 0) + (c ? 1 : 0) });
  };

  return (
    <section aria-labelledby="hanh-trinh-nha" className="glass rounded-2xl p-4 sm:p-5" data-testid="hanh-trinh-nha">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="hanh-trinh-nha" className="flex items-center gap-2 text-lg"><Home className="size-4 text-gold" aria-hidden /> {t("ht.tieu_de")}
          <span className="text-xs font-normal text-fg-faint">{daXong}/{buoc.length}</span></h2>
        {nha ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted" data-testid="hanh-trinh-ten-nha">
            {suaTen ? (
              <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); luuTen(); }}>
                <Input value={ten} onChange={(e) => setTen(e.target.value.slice(0, 40))} aria-label={t("ht.ten_aria")} placeholder={t("ht.ten_vi_du")} className="h-8 w-48 text-xs" autoFocus />
                <button type="submit" className="rounded-full border border-gold/60 px-2.5 py-1 text-gold">{t("ht.luu")}</button>
                <button type="button" onClick={() => setSuaTen(false)} className="px-1 text-fg-faint">{t("ht.thoi")}</button>
              </form>
            ) : (
              <>
                <span>{t("ht.dang_xem")}<b className="text-fg">{tenNha(nha, en)}</b>{ngayNgan(nha.cap_nhat_luc, en) ? ` · ${ngayNgan(nha.cap_nhat_luc, en)}` : ""}</span>
                <button type="button" onClick={() => { setTen(nha.ten_goi ?? ""); setSuaTen(true); }} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 hover:text-fg" aria-label={t("ht.dat_ten_aria")}><Pencil className="size-3" aria-hidden /> {t("ht.dat_ten")}</button>
                {hoiXoa ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-fg">{t("ht.hoi_xoa")}</span>
                    <button type="button" onClick={xoa} className="rounded-full border border-cinnabar/60 px-2 py-0.5 text-cinnabar">{t("ht.xoa")}</button>
                    <button type="button" onClick={() => setHoiXoa(false)} className="px-1 text-fg-faint">{t("ht.giu")}</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setHoiXoa(true)} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 hover:text-fg" aria-label={t("ht.xoa_aria")}><Trash2 className="size-3" aria-hidden /> {t("ht.nha_khac")}</button>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="text-xs text-fg-faint">{t("ht.ba_cau")}</p>
        )}
      </div>

      {/* UI-PT2 A: loại nhà — đổi hướng dẫn đo, chỗ đo mặc định (căn hộ → ban công), luật thực hành căn hộ */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={t("ht.loai_aria")} data-testid="chon-loai-nha">
        <span className="mr-1 inline-flex items-center gap-1 text-xs text-fg-muted"><Building2 className="size-3.5" aria-hidden /> {t("ht.nha_ban_la")}</span>
        {LOAI_NHA.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={nha?.loai_nha === m} onClick={() => chonLoai(m)} data-testid={`loai-nha-${m}`}
            className={cn("rounded-full border px-3 py-1 text-xs", nha?.loai_nha === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>{tenLoaiNha(m, en)}</button>
        ))}
        {canHo && <span className="text-xs text-fg-faint">{t("ht.can_ho_nhac")}</span>}
      </div>

      <ol className="-mx-1 mt-3 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible" aria-label={t("ht.cac_buoc")}>
        {buoc.map((b, i) => (
          <li key={b.ma} className="min-w-[9.5rem] snap-start sm:min-w-0">
            <a href={b.neo} data-trang-thai={b.trang_thai} data-testid={`hanh-trinh-${b.ma}`}
              onClick={() => ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hanh_trinh_buoc", buoc: b.ma, trang_thai: b.trang_thai })}
              className={cn("group flex h-full flex-col rounded-xl border p-2.5 text-left transition-colors",
                b.trang_thai === "xong" ? "border-jade/40 bg-jade/[0.07]" : b.trang_thai === "san_sang" ? "border-gold/40 bg-gold/[0.05] hover:border-gold/70" : "border-line/60 opacity-70 hover:opacity-100")}>
              <span className="flex items-center gap-1.5 text-[11px] text-fg-faint">
                <span className={cn("grid size-4 place-items-center rounded-full border text-[9px] font-semibold",
                  b.trang_thai === "xong" ? "border-jade/60 bg-jade/20 text-jade" : b.trang_thai === "san_sang" ? "border-gold/60 text-gold" : "border-line text-fg-faint")}>
                  {b.trang_thai === "xong" ? <Check className="size-2.5" aria-hidden /> : i + 1}
                </span>
                {b.trang_thai === "xong" ? t("ht.tt_xong") : b.trang_thai === "san_sang" ? t("ht.tt_san") : t("ht.tt_cho")}
              </span>
              <span className="mt-1 text-sm font-semibold text-fg">{b.ten}</span>
              <span className="mt-0.5 text-[11px] leading-snug text-fg-muted">{b.chi}</span>
              <span className="mt-auto inline-flex items-center gap-0.5 pt-1 text-[11px] text-gold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{t("ht.toi_do")} <ChevronRight className="size-3" aria-hidden /></span>
            </a>
          </li>
        ))}
      </ol>

      {/* UI-PT2 P5: nhiều căn để so (≤ 3) — vẫn trên máy */}
      {(coHuong || (ds?.length ?? 0) > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-3 text-xs" data-testid="danh-sach-can">
          <span className="text-fg-muted">{t("ht.nhieu_can")}</span>
          {(ds ?? []).map((c, i) => {
            const dang = nha?.id === c.id;
            return (
              <span key={c.id} className={cn("inline-flex items-center gap-1 rounded-full border pl-2.5 pr-1 py-0.5", dang ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted")}>
                <button type="button" onClick={() => { chonCan(c.id); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doi_can" }); }} aria-pressed={dang} data-testid={`can-${i}`}>{tenCan(c, i, en)}</button>
                <button type="button" onClick={() => xoaCan(c.id)} aria-label={t("ht.bo_can", { ten: tenCan(c, i, en) })} className="grid size-4 place-items-center rounded-full hover:bg-line/60"><X className="size-3" aria-hidden /></button>
              </span>
            );
          })}
          {coHuong && (
            <button type="button" onClick={luuDeSo} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-fg-muted hover:text-fg" data-testid="luu-can-so">
              <Save className="size-3" aria-hidden /> {nha?.id && ds?.some((c) => c.id === nha.id) ? t("ht.cap_nhat_can") : t("ht.luu_can")}
            </button>
          )}
          {(ds?.length ?? 0) >= 2 && (
            <button type="button" onClick={() => setMoSo((v) => !v)} aria-expanded={moSo} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5", moSo ? "border-gold text-gold" : "border-gold/50 text-gold hover:bg-gold/10")} data-testid="mo-so-hai-can">
              <Scale className="size-3" aria-hidden /> {t("ht.so_hai_can")}
            </button>
          )}
          {baoLuu && <span className="text-fg-faint" role="status">{baoLuu}</span>}
        </div>
      )}
      {moSo && ds && ds.length >= 2 && <SoHaiCan ds={ds} sinh={sinh} />}
    </section>
  );
}
