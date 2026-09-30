import Link from "next/link";
import { TuVi } from "./TuVi";

export default function TuViPage() {
  return (
    <main>
      <Link href="/" className="backlink">← Trang chủ</Link>
      <header className="page-head">
        <span className="eyebrow">Tử vi · tham khảo văn hoá</span>
        <h1>Hỏi về lá số</h1>
        <p className="lede">
          Lá số an cục bộ (không gửi ngày sinh ra ngoài), hạn đọc theo thứ tự đại hạn &gt; lưu niên &gt;
          tiểu hạn. Lời đọc lấy từ kho tri thức có nguồn, kèm mặt tối và câu tự soi — không phán bệnh,
          tai nạn hay sống chết.
        </p>
      </header>
      <TuVi />
    </main>
  );
}
