import Link from "next/link";
import { BatTu } from "./BatTu";

export default function BatTuPage() {
  return (
    <main>
      <Link href="/" className="backlink">← Trang chủ</Link>
      <header className="page-head">
        <span className="eyebrow">Bát tự · tham khảo văn hoá</span>
        <h1>Hỏi về tứ trụ</h1>
        <p className="lede">
          Tứ trụ tính theo tiết khí (năm đổi tại Lập xuân, tháng đổi theo tiết), đại vận và lưu niên do
          engine tính. Dụng thần trình bày cả hai cách (Tử Bình Chân Thuyên và Trích Thiên Tuỷ) — hệ thống
          không tự chọn thay bạn.
        </p>
      </header>
      <BatTu />
    </main>
  );
}
