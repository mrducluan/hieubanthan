// TC-HOOK — dòng "điểm mù" chạy ở hero: mỗi câu rút gọn từ `diem_mu` của kho chân dung (thanso_chan_dung.json),
// để người xem tự nhận ra mình/người quen trong 3 giây rồi muốn biết số của mình. Chỉ CSS (globals.css), không JS; các câu chồng trong một ô lưới
// nên khung cao đúng bằng câu dài nhất ở mọi cỡ màn hình (TC-HOOK2 — trước đây khung cao cố định, câu 2 dòng đè lời dẫn).
// ND-7: chữ lấy từ bảng chữ trang chủ (lib/chu/trang-chu.ts) — sửa được ở CMS; `*Số n*` = phần vàng.
import { ChuNhan } from "@/components/cms/ChuNhan";

export function DiemMuLuot({ nhan, cau, className, co = "text-base sm:text-lg" }: { nhan: string; cau: string[]; className?: string; co?: string }) {
  return (
    <div className={className} data-testid="diem-mu-luot">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 rounded-full border border-cinnabar/40 bg-cinnabar/10 px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wider text-cinnabar">
          {nhan}
        </span>
        <ul className="diem-mu-luot relative flex-1" aria-label="Ví dụ điểm mù theo con số">
          {cau.map((c, i) => (
            <li key={i} className={`flex items-baseline gap-2 leading-snug text-fg ${co}`} style={{ animationDelay: `${i * 3}s` }}>
              <ChuNhan chu={c} lopNhan="shrink-0 font-serif text-gold" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
