import Link from "next/link";
import { engineHealth } from "@/lib/engine";

export const dynamic = "force-dynamic";

export default async function Home() {
  const health = await engineHealth();

  return (
    <main>
      <header className="page-head">
        <span className="eyebrow">Tự nhận thức · văn hoá phương Đông</span>
        <h1>Hiểu Bản Thân</h1>
        <p className="lede">
          Khám phá các hệ thống tự nhận thức trong văn hoá phương Đông — trình bày
          trung thực cả những chỗ các trường phái không thống nhất với nhau, và
          luôn kèm câu hỏi để bạn tự kiểm.
        </p>
      </header>

      <div className="home-grid">
        <Link href="/than-so" className="home-card">
          <h2>Thần số học</h2>
          <p>
            Bốn con số cốt lõi, dải đời đỉnh cao theo tuổi, thử thách và năm cá
            nhân — mỗi số kèm mặt tối và câu tự kiểm.
          </p>
        </Link>

        <Link href="/kinh-dich" className="home-card">
          <h2>Kinh Dịch</h2>
          <p>
            Hỏi một quẻ cho một việc: Nghĩa Lý, Lục Hào hoặc Mai Hoa — lời đọc có nguồn,
            kèm mặt tối và câu tự soi.
          </p>
        </Link>

        <Link href="/tu-vi" className="home-card">
          <h2>Tử vi</h2>
          <p>
            Hỏi về lá số: cung, sao, tứ hoá và vận hạn ba lớp — an sao cục bộ, lời đọc có nguồn,
            không phán bệnh hay tai nạn.
          </p>
        </Link>

        <Link href="/bat-tu" className="home-card">
          <h2>Bát tự</h2>
          <p>
            Tứ trụ theo tiết khí, thập thần, ngũ hành, đại vận — dụng thần trình bày cả hai trường phái,
            không tự chọn.
          </p>
        </Link>

        <Link href="/phong-thuy" className="home-card">
          <h2>Phong thuỷ</h2>
          <p>
            Bát trạch: hướng hợp tuổi, cửa–chủ–bếp, sao năm; loan đầu và bố trí — ghi rõ chỗ nào là
            quan niệm dân gian, không bán vật phẩm.
          </p>
        </Link>

        <div className="home-card" style={{ borderStyle: "dashed", cursor: "default" }}>
          <h2>Nhân tướng</h2>
          <p className="soon">Đang xây dựng.</p>
        </div>
      </div>

      <p className="health">
        Engine: {health.ok ? `v${health.engine_version} — hoạt động` : "chưa kết nối"}
      </p>
    </main>
  );
}
