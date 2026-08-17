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

        <div className="home-card" style={{ borderStyle: "dashed", cursor: "default" }}>
          <h2>Nhân tướng · Tử vi · Kinh Dịch</h2>
          <p className="soon">Đang xây dựng.</p>
        </div>
      </div>

      <p className="health">
        Engine: {health.ok ? `v${health.engine_version} — hoạt động` : "chưa kết nối"}
      </p>
    </main>
  );
}
