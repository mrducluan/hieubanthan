import Link from "next/link";
import { KinhDich } from "./KinhDich";

export default function KinhDichPage() {
  return (
    <main>
      <Link href="/" className="backlink">← Trang chủ</Link>
      <header className="page-head">
        <span className="eyebrow">Kinh Dịch · tham khảo văn hoá</span>
        <h1>Hỏi một quẻ</h1>
        <p className="lede">
          Một việc, một câu hỏi, hỏi một lần. Quẻ do máy gieo ngẫu nhiên, theo giờ (Mai Hoa)
          hoặc do bạn tự gieo — hệ thống không bao giờ chọn quẻ theo câu hỏi. Lời đọc lấy từ
          kho tri thức có nguồn (Chu Dịch, Mai Hoa Dịch Số, Tăng San Bốc Dịch).
        </p>
      </header>
      <KinhDich />
    </main>
  );
}
