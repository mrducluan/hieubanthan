import Link from "next/link";
import { PhongThuy } from "./PhongThuy";

export default function PhongThuyPage() {
  return (
    <main>
      <Link href="/" className="backlink">← Trang chủ</Link>
      <header className="page-head">
        <span className="eyebrow">Phong thuỷ · tham khảo văn hoá</span>
        <h1>Hỏi về nhà ở</h1>
        <p className="lede">
          Bát trạch theo Dương Trạch Tam Yếu: mệnh quái, 8 hướng du niên, cửa–chủ–bếp; loan đầu theo Táng Thư.
          Mục nào là quan niệm dân gian sẽ được ghi rõ kèm lý do thực tế. Hệ thống không giới thiệu vật phẩm
          “hoá giải”.
        </p>
      </header>
      <PhongThuy />
    </main>
  );
}
