// LX-2027 — Một bao lì xì mở được gì: đúng các chương của báo cáo "Thời gian tới" năm 2027 (engine /v1/thoi-gian-toi).
// Nói thật phần nào vốn miễn phí, phần nào bao mở, và cần giờ sinh cho lớp Tử vi / Bát tự (NAM-2, TG-V2).
import Link from "@/components/khung/Lien";
import { CalendarCheck2, CalendarRange, Compass, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";

const CHUONG = [
  {
    icon: CalendarRange,
    ten: "3 tháng tới và tóm tắt năm",
    chiTiet: "Ai cũng đọc miễn phí, kể cả khi chưa có bao. Người nhận đọc chương này trước để biết báo cáo nói gì.",
    mienPhi: true,
  },
  {
    icon: CalendarCheck2,
    ten: "12 tháng của năm 2027",
    chiTiet: "Mỗi tháng một hộp: thần số, con giáp, ngày đẹp trong tháng, góc nhà hợp; có giờ sinh thì thêm Tử vi và Bát tự. Tháng nhiều cách cùng thuận, tháng nên đi chậm.",
    mienPhi: false,
  },
  {
    icon: Compass,
    ten: "Cả năm 2027",
    chiTiet: "Công việc, tiền bạc, tình cảm, gia đình, sức khoẻ trong năm; năm nên chú ý mảng nào hơn và việc cụ thể nên làm.",
    mienPhi: false,
  },
  {
    icon: ListChecks,
    ten: "Nên tránh và nên làm",
    chiTiet: "Tháng xung tuổi, tập quán đầu năm (Tam tai, Kim lâu, sao hạn) nói bình tĩnh, kèm việc nên làm. Không bán vật phẩm giải hạn.",
    mienPhi: false,
  },
];

export function BanDoTet2027() {
  return (
    <section className="space-y-4" aria-labelledby="li-xi-mo-gi">
      <div className="space-y-1">
        <h2 id="li-xi-mo-gi" className="font-serif text-2xl font-semibold text-fg">Một bao lì xì mở được gì?</h2>
        <p className="text-sm text-fg-muted">
          Trọn báo cáo <Link href="/thoi-gian-toi?nam=2027" className="text-gold underline underline-offset-4">Thời gian tới năm 2027</Link> cho
          một người, tính từ ngày sinh người nhận tự nhập. Chỉ có ngày sinh thì báo cáo đọc theo thần số, con giáp, ngày đẹp và tập quán;
          thêm giờ sinh, giới tính, nơi sinh thì có thêm Tử vi và Bát tự. Đây là tham khảo văn hoá, không thay lời khuyên y tế, tài chính.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {CHUONG.map(({ icon: Icon, ten, chiTiet, mienPhi }) => (
          <Card key={ten} className="space-y-2 border-line/70">
            <div className="flex items-center justify-between gap-2">
              <Icon className="size-5 text-gold" aria-hidden />
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${mienPhi ? "bg-jade/15 text-jade" : "bg-gold/15 text-gold"}`}>
                {mienPhi ? "Miễn phí cho mọi người" : "Bao lì xì mở"}
              </span>
            </div>
            <h3 className="font-medium text-fg">{ten}</h3>
            <p className="text-sm leading-relaxed text-fg-muted">{chiTiet}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
