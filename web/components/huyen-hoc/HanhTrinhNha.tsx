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
  chonCan, LOAI_NHA, luuCanDeSo, luuHoSoNha, TEN_LOAI_NHA, tenCan, tenNha, TOI_DA_CAN, useDanhSachNha, useHoSoNha, xoaCan, xoaHoSoNha,
  type LoaiNha,
} from "@/lib/ho-so-nha";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { SoHaiCan, type SinhSo } from "@/components/huyen-hoc/SoHaiCan";

type TrangThai = "xong" | "san_sang" | "cho";
interface Buoc { ma: string; ten: string; chi: string; trang_thai: TrangThai; neo: string }

function ngayNgan(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `${d.getDate()}/${d.getMonth() + 1}`;
}

export function HanhTrinhNha({ mq, coSinh, sinh = null }: { mq: { quai: string; nhom: string } | null; coSinh: boolean; sinh?: SinhSo }) {
  const nha = useHoSoNha();
  const ds = useDanhSachNha();
  const [suaTen, setSuaTen] = useState(false);
  const [ten, setTen] = useState("");
  const [hoiXoa, setHoiXoa] = useState(false);
  const [moSo, setMoSo] = useState(false);
  const [baoLuu, setBaoLuu] = useState<string | null>(null);
  if (nha === undefined) return null;

  const canHo = nha?.loai_nha === "can_ho";
  const coHuong = Boolean(nha && (nha.huong_do != null || nha.huong));
  const bc = nha?.bo_cuc;
  const soPhong = Object.keys(bc?.vi_tri ?? {}).length;
  const soDau = bc?.dau_hieu?.length ?? 0;
  const coKhaoSat = soPhong > 0 || soDau > 0 || Boolean(bc?.mat_bang);
  const buoc: Buoc[] = [
    { ma: "menh", ten: "Bạn hợp phía nào", neo: "#menh-quai",
      trang_thai: mq ? "xong" : coSinh ? "san_sang" : "cho",
      chi: mq ? `mệnh ${mq.quai} · ${mq.nhom}` : coSinh ? "đang tính" : "cần năm sinh + giới tính" },
    { ma: "huong", ten: "Hướng nhà", neo: "#do-huong",
      trang_thai: coHuong ? "xong" : "san_sang",
      chi: coHuong ? (nha!.huong_do != null ? `${nha!.huong_do}°${nha!.theo === "ban_cong" ? " (ban công)" : ""}` : nha!.huong!)
        : canHo ? "đo ở ban công hoặc lấy từ bản đồ" : "đo bằng điện thoại hoặc bản đồ" },
    { ma: "doc", ten: "Nhà này với bạn", neo: "#nha-cua-ban",
      trang_thai: coHuong || mq ? "san_sang" : "cho",
      chi: coHuong ? "bài đọc 5 chương bằng lời thường" : "cần hướng nhà hoặc năm sinh" },
    { ma: "khao_sat", ten: "Kê gì ở đâu", neo: "#khao-sat-nha",
      trang_thai: coKhaoSat ? "xong" : "san_sang",
      chi: coKhaoSat ? [soPhong ? `${soPhong} phòng` : "", soDau ? `${soDau} dấu hiệu` : "", bc?.mat_bang ? "mặt bằng" : ""].filter(Boolean).join(" · ") : "phòng, dấu hiệu, mặt bằng" },
    { ma: "nam", ten: "Khi nào sửa", neo: "#huyen-khong",
      trang_thai: nha?.nam_xay && (nha.toa || nha.huong_do != null) ? "xong" : coHuong ? "san_sang" : "cho",
      chi: nha?.nam_xay ? `nhà năm ${nha.nam_xay} · sao theo năm, tháng` : "cần năm xây hoặc năm dọn vào" },
  ];
  const daXong = buoc.filter((b) => b.trang_thai === "xong").length;

  const chonLoai = (m: LoaiNha) => {
    try { luuHoSoNha({ loai_nha: m, ...(m === "can_ho" && !coHuong ? { theo: "ban_cong" } : {}) }); } catch { /* bỏ qua */ }
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "chon_loai_nha", loai_nha: m });
  };
  const luuTen = () => {
    const t = ten.trim().slice(0, 40);
    try { luuHoSoNha({ ten_goi: t || undefined }); } catch { /* bỏ qua */ }
    setSuaTen(false);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "dat_ten_nha" });
  };
  const xoa = () => {
    xoaHoSoNha(); setHoiXoa(false); setMoSo(false);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "xoa_nha" });
  };
  const luuDeSo = () => {
    const c = luuCanDeSo();
    setBaoLuu(c ? `Đã lưu "${tenCan(c, (ds ?? []).findIndex((x) => x.id === c.id) < 0 ? (ds ?? []).length : (ds ?? []).findIndex((x) => x.id === c.id))}" để so.` : `Đã đủ ${TOI_DA_CAN} căn — bỏ bớt một căn rồi lưu.`);
    window.setTimeout(() => setBaoLuu(null), 3500);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "luu_can_so", so_can: (ds?.length ?? 0) + (c ? 1 : 0) });
  };

  return (
    <section aria-labelledby="hanh-trinh-nha" className="glass rounded-2xl p-4 sm:p-5" data-testid="hanh-trinh-nha">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="hanh-trinh-nha" className="flex items-center gap-2 text-lg"><Home className="size-4 text-gold" aria-hidden /> Hành trình nhà bạn
          <span className="text-xs font-normal text-fg-faint">{daXong}/{buoc.length}</span></h2>
        {nha ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted" data-testid="hanh-trinh-ten-nha">
            {suaTen ? (
              <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); luuTen(); }}>
                <Input value={ten} onChange={(e) => setTen(e.target.value.slice(0, 40))} aria-label="Tên gọi cho nhà này" placeholder="vd Nhà đang ở, Căn định mua" className="h-8 w-48 text-xs" autoFocus />
                <button type="submit" className="rounded-full border border-gold/60 px-2.5 py-1 text-gold">Lưu</button>
                <button type="button" onClick={() => setSuaTen(false)} className="px-1 text-fg-faint">Thôi</button>
              </form>
            ) : (
              <>
                <span>Đang xem: <b className="text-fg">{tenNha(nha)}</b>{ngayNgan(nha.cap_nhat_luc) ? ` · ${ngayNgan(nha.cap_nhat_luc)}` : ""}</span>
                <button type="button" onClick={() => { setTen(nha.ten_goi ?? ""); setSuaTen(true); }} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 hover:text-fg" aria-label="Đặt tên cho nhà này"><Pencil className="size-3" aria-hidden /> Đặt tên</button>
                {hoiXoa ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-fg">Xoá hướng, bố cục đã lưu trên máy này?</span>
                    <button type="button" onClick={xoa} className="rounded-full border border-cinnabar/60 px-2 py-0.5 text-cinnabar">Xoá</button>
                    <button type="button" onClick={() => setHoiXoa(false)} className="px-1 text-fg-faint">Giữ</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setHoiXoa(true)} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 hover:text-fg" aria-label="Xoá nhà đã lưu trên máy"><Trash2 className="size-3" aria-hidden /> Xem nhà khác</button>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="text-xs text-fg-faint">Ba câu hay hỏi: nhà có hợp tôi? · kê gì ở đâu? · khi nào sửa?</p>
        )}
      </div>

      {/* UI-PT2 A: loại nhà — đổi hướng dẫn đo, chỗ đo mặc định (căn hộ → ban công), luật thực hành căn hộ */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Loại nhà" data-testid="chon-loai-nha">
        <span className="mr-1 inline-flex items-center gap-1 text-xs text-fg-muted"><Building2 className="size-3.5" aria-hidden /> Nhà bạn là</span>
        {LOAI_NHA.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={nha?.loai_nha === m} onClick={() => chonLoai(m)} data-testid={`loai-nha-${m}`}
            className={cn("rounded-full border px-3 py-1 text-xs", nha?.loai_nha === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>{TEN_LOAI_NHA[m]}</button>
        ))}
        {canHo && <span className="text-xs text-fg-faint">→ đo ở ban công / cửa sổ lớn hoặc lấy từ bản đồ; luật căn hộ (không đập kết cấu, xử lý trong cửa) tự áp.</span>}
      </div>

      <ol className="-mx-1 mt-3 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible" aria-label="Các bước xem nhà">
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
                {b.trang_thai === "xong" ? "đã có" : b.trang_thai === "san_sang" ? "sẵn sàng" : "chưa đủ dữ liệu"}
              </span>
              <span className="mt-1 text-sm font-semibold text-fg">{b.ten}</span>
              <span className="mt-0.5 text-[11px] leading-snug text-fg-muted">{b.chi}</span>
              <span className="mt-auto inline-flex items-center gap-0.5 pt-1 text-[11px] text-gold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Tới đó <ChevronRight className="size-3" aria-hidden /></span>
            </a>
          </li>
        ))}
      </ol>

      {/* UI-PT2 P5: nhiều căn để so (≤ 3) — vẫn trên máy */}
      {(coHuong || (ds?.length ?? 0) > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-3 text-xs" data-testid="danh-sach-can">
          <span className="text-fg-muted">Đang xem nhiều căn?</span>
          {(ds ?? []).map((c, i) => {
            const dang = nha?.id === c.id;
            return (
              <span key={c.id} className={cn("inline-flex items-center gap-1 rounded-full border pl-2.5 pr-1 py-0.5", dang ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted")}>
                <button type="button" onClick={() => { chonCan(c.id); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doi_can" }); }} aria-pressed={dang} data-testid={`can-${i}`}>{tenCan(c, i)}</button>
                <button type="button" onClick={() => xoaCan(c.id)} aria-label={`Bỏ ${tenCan(c, i)} khỏi danh sách so`} className="grid size-4 place-items-center rounded-full hover:bg-line/60"><X className="size-3" aria-hidden /></button>
              </span>
            );
          })}
          {coHuong && (
            <button type="button" onClick={luuDeSo} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-fg-muted hover:text-fg" data-testid="luu-can-so">
              <Save className="size-3" aria-hidden /> {nha?.id && ds?.some((c) => c.id === nha.id) ? "Cập nhật căn này" : "Lưu căn này để so"}
            </button>
          )}
          {(ds?.length ?? 0) >= 2 && (
            <button type="button" onClick={() => setMoSo((v) => !v)} aria-expanded={moSo} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5", moSo ? "border-gold text-gold" : "border-gold/50 text-gold hover:bg-gold/10")} data-testid="mo-so-hai-can">
              <Scale className="size-3" aria-hidden /> So hai căn
            </button>
          )}
          {baoLuu && <span className="text-fg-faint" role="status">{baoLuu}</span>}
        </div>
      )}
      {moSo && ds && ds.length >= 2 && <SoHaiCan ds={ds} sinh={sinh} />}
    </section>
  );
}
