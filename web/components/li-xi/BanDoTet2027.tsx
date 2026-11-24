// LX-2027 — Bản đồ 6 mảng giá trị thiết thực trong LÌ XÌ TẾT 2027 (toàn bộ do Engine 5 tầng tính tất định).
import { Briefcase, CalendarCheck2, Coins, Compass, HeartHandshake, HeartPulse } from "lucide-react";
import { Card } from "@/components/ui/card";

const SAU_MANG = [
  {
    icon: Briefcase,
    ten: "1. Công việc & Chuyển việc",
    chiTiet: "Chỉ rõ 2–3 tháng thuận nhất để đổi việc, nhận vị trí mới hoặc học nâng cấp (Quan Lộc lưu niên + KH-1).",
  },
  {
    icon: Coins,
    ten: "2. Tiền bạc, Mua bán & Kinh doanh",
    chiTiet: "Tháng đẹp để khởi sự, ký hợp đồng, mua nhà / mua xe và giai đoạn cần giữ tiền chắc tay, tránh đầu tư vội.",
  },
  {
    icon: HeartHandshake,
    ten: "3. Tình cảm & Gia đình",
    chiTiet: "Nhịp gắn kết lứa đôi, Kim Lâu cưới hỏi, xây sửa nhà cửa và cách giữ hoà khí gia đạo trong năm Đinh Mùi.",
  },
  {
    icon: HeartPulse,
    ten: "4. Sức khoẻ phòng ngừa",
    chiTiet: "Nhắc giai đoạn nên khám tổng quát định kỳ & giữ nhịp sinh hoạt theo ngũ hành (tham khảo, không thay bác sĩ).",
  },
  {
    icon: CalendarCheck2,
    ten: "5. Bản đồ 12 Tháng & Tháng Vàng",
    chiTiet: "Giao thoa 3 môn Tử vi + Bát tự + Thần số Năm cá nhân 2027: đánh dấu tháng cả 3 hệ cùng thuận và tháng nên đi chậm.",
  },
  {
    icon: Compass,
    ten: "6. Tập quán đầu năm 2027",
    chiTiet: "Sao hạn, Tam tai (Hợi–Mão–Mùi năm cuối), Kim lâu, Hoàng ốc, hướng Ngũ Hoàng 2027 — trình bày bình tĩnh, không doạ.",
  },
];

export function BanDoTet2027() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-gold">Giá trị thiết thực cho người nhận</p>
        <h2 className="font-serif text-2xl font-semibold text-fg">
          6 phần hành động cụ thể trong LÌ XÌ TẾT 2027 (Báo cáo Năm Đinh Mùi)
        </h2>
        <p className="text-sm text-fg-muted">
          Toàn bộ tính trực tiếp theo ngày giờ sinh riêng của người nhận qua Engine 5 tầng tất định (không văn mẫu chung chung, không phán định mệnh).
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SAU_MANG.map(({ icon: Icon, ten, chiTiet }) => (
          <Card key={ten} className="space-y-2 border-line/70">
            <Icon className="size-5 text-gold" aria-hidden />
            <h3 className="font-medium text-fg">{ten}</h3>
            <p className="text-sm leading-relaxed text-fg-muted">{chiTiet}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
