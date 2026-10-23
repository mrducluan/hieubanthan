// TC-HOOK — dòng "điểm mù" chạy ở hero: mỗi câu rút gọn từ `diem_mu` của kho chân dung (thanso_chan_dung.json),
// để người xem tự nhận ra mình/người quen trong 3 giây rồi muốn biết số của mình. Chỉ CSS (globals.css), không JS.
// ND-7: chữ lấy từ bảng chữ trang chủ (lib/chu/trang-chu.ts) — sửa được ở CMS; `*Số n*` = phần vàng.
import { ChuNhan } from "@/components/cms/ChuNhan";

const CO_THUONG = { chu: "text-base sm:text-lg", khung: "h-[3.25rem] sm:h-7" };

export function DiemMuLuot({ nhan, cau, className, co = CO_THUONG }: { nhan: string; cau: string[]; className?: string; co?: { chu: string; khung: string } }) {
  return (
    <div className={className} data-testid="diem-mu-luot">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 rounded-full border border-cinnabar/40 bg-cinnabar/10 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-cinnabar">
          {nhan}
        </span>
        <ul className={`diem-mu-luot relative flex-1 ${co.khung}`} aria-label="Ví dụ điểm mù theo con số">
          {cau.map((c, i) => (
            <li key={i} className={`flex items-baseline gap-2 leading-snug text-fg ${co.chu}`} style={{ animationDelay: `${i * 3}s` }}>
              <ChuNhan chu={c} lopNhan="shrink-0 font-serif text-gold" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
