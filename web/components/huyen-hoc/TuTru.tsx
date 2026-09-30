import { cn } from "@/lib/utils";

export interface LaSoBatTu {
  tru: { can: string; chi: string }[];
  nhat_chu: { can: string; ngu_hanh: string; am_duong: string };
  tang_can: string[][];
  thap_than_can: string[];
  thap_than_chi: string[][];
  ngu_hanh: { diem: Record<string, number>; thieu: string[]; nhieu_nhat: string };
  than: { ti_le: number; ket_luan: string; thang_diem: string };
  dung_than: {
    phu_uc: { hanh: string[]; giai_thich: string };
    dieu_hau: { hanh: string[]; giai_thich: string };
    cach_cuc: { ten: string } | null;
  };
  dai_van: { ds: { can: string; chi: string; tu_nam: number; den_nam: number; tu_tuoi_thuc: number }[] };
  co_canh_bao: { loai: string; chi_tiet: string }[];
}

const TEN_TRU = ["Năm", "Tháng", "Ngày", "Giờ"];
const MAU_HANH: Record<string, string> = {
  "Kim": "bg-fg-muted", "Mộc": "bg-jade", "Thủy": "bg-moon", "Hỏa": "bg-cinnabar", "Thổ": "bg-gold",
};

// Tứ trụ + ngũ hành + dụng thần (hai cách, không tự chọn) + đại vận — vẽ đúng dữ liệu engine.
export function TuTru({ ls, namNay }: { ls: LaSoBatTu; namNay: number }) {
  const tong = Object.values(ls.ngu_hanh.diem).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-2" role="table" aria-label="Tứ trụ">
        {ls.tru.map((t, i) => (
          <div key={i} role="row" className={cn("rounded-xl border p-2 text-center", i === 2 ? "border-gold/70 bg-gold/[0.07]" : "border-line/70 bg-bg/40")}>
            <p className="eyebrow">{TEN_TRU[i]}</p>
            <p className="mt-1 text-[0.65rem] text-moon sm:text-xs">{ls.thap_than_can[i]}</p>
            <p className="font-serif text-xl min-[400px]:text-2xl sm:text-3xl">{t.can}</p>
            <p className="font-serif text-xl text-gold min-[400px]:text-2xl sm:text-3xl">{t.chi}</p>
            <p className="mt-1 text-[0.65rem] text-fg-faint sm:text-xs">{ls.tang_can[i]?.join(" · ")}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-fg-muted">
        Nhật chủ <b className="text-gold">{ls.nhat_chu.can}</b> ({ls.nhat_chu.am_duong} {ls.nhat_chu.ngu_hanh}) · thân{" "}
        <b className="text-fg">{ls.than.ket_luan}</b> (tỉ lệ {ls.than.ti_le.toLocaleString("vi-VN")})
      </p>

      <div>
        <p className="eyebrow mb-2">Ngũ hành (thang điểm công bố)</p>
        <ul className="space-y-1.5">
          {Object.entries(ls.ngu_hanh.diem).map(([h, d]) => (
            <li key={h} className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2 text-sm">
              <span>{h}</span>
              <span className="h-2 overflow-hidden rounded-full bg-surface-2">
                <span className={cn("block h-full rounded-full", MAU_HANH[h] ?? "bg-gold")} style={{ width: `${(d / tong) * 100}%` }} />
              </span>
              <span className="text-right text-fg-faint">{d.toLocaleString("vi-VN")}</span>
            </li>
          ))}
        </ul>
        <details className="mt-2 text-xs text-fg-faint"><summary className="cursor-pointer">Cách chấm điểm</summary><p className="mt-1">{ls.than.thang_diem}</p></details>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line/70 bg-bg/40 p-4">
          <p className="eyebrow">Dụng thần · Phù ức</p>
          <p className="mt-1 font-serif text-xl text-jade">{ls.dung_than.phu_uc.hanh.join(", ")}</p>
          <p className="text-sm text-fg-muted">{ls.dung_than.phu_uc.giai_thich}</p>
        </div>
        <div className="rounded-xl border border-line/70 bg-bg/40 p-4">
          <p className="eyebrow">Dụng thần · Điều hậu</p>
          <p className="mt-1 font-serif text-xl text-jade">{ls.dung_than.dieu_hau.hanh.join(", ")}</p>
          <p className="text-sm text-fg-muted">{ls.dung_than.dieu_hau.giai_thich}</p>
        </div>
        <p className="text-xs text-fg-faint sm:col-span-2">
          Hai cách xác định dụng thần có thể khác nhau — hệ thống trình bày cả hai, không tự chọn thay bạn.
          {ls.dung_than.cach_cuc ? ` Cách cục theo nguyệt lệnh: ${ls.dung_than.cach_cuc.ten}.` : ""}
        </p>
      </div>

      <div>
        <p className="eyebrow mb-2">Đại vận (10 năm)</p>
        <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {ls.dai_van.ds.map((v) => {
            const on = namNay >= v.tu_nam && namNay <= v.den_nam;
            return (
              <li key={v.tu_nam} className={cn("min-w-[5.5rem] rounded-xl border p-2 text-center", on ? "border-gold/70 bg-gold/[0.08]" : "border-line/70 bg-bg/40")}>
                <p className="whitespace-nowrap font-serif text-lg">{v.can} {v.chi}</p>
                <p className="text-[0.7rem] text-fg-faint">{v.tu_nam}–{v.den_nam}</p>
                <p className="text-[0.7rem] text-fg-faint">từ {v.tu_tuoi_thuc} tuổi</p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
