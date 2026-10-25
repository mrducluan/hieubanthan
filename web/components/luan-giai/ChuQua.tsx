// SAO-V "Tặng một chương": dòng ghi chú ở chương bạn bè tặng (báo cáo của chính người nhận).
import { Gift } from "lucide-react";

export function ChuQua() {
  return (
    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs text-gold" data-testid="chuong-qua">
      <Gift className="size-3.5" aria-hidden /> Chương này là quà của một người bạn
    </p>
  );
}
