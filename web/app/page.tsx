import Link from "next/link";
import { engineHealth } from "@/lib/engine";

export const dynamic = "force-dynamic";

export default async function Home() {
  const health = await engineHealth();

  return (
    <main>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Hiểu Bản Thân</h1>
      <p style={{ color: "#44534a", maxWidth: "60ch" }}>
        Khám phá các hệ thống tự nhận thức trong văn hoá phương Đông — trình bày
        trung thực cả những chỗ các trường phái không thống nhất với nhau.
      </p>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 28,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        <Link
          href="/than-so"
          style={{
            display: "block",
            padding: "18px 20px",
            background: "#fff",
            border: "1px solid #d5ddd6",
            borderRadius: 6,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <strong style={{ fontSize: 17 }}>Thần số học</strong>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#5b6a60" }}>
            Tính các chỉ số Pythagoras — và đo xem con số của bạn phụ thuộc vào
            quy ước phiên âm tới mức nào.
          </p>
        </Link>

        <div
          style={{
            padding: "18px 20px",
            background: "#eef1ee",
            border: "1px dashed #c2ccc4",
            borderRadius: 6,
            color: "#7a877e",
          }}
        >
          <strong style={{ fontSize: 17 }}>Nhân tướng · Tử vi · Kinh Dịch</strong>
          <p style={{ margin: "6px 0 0", fontSize: 14 }}>Đang xây dựng.</p>
        </div>
      </div>

      <p style={{ marginTop: 28, fontSize: 13, color: "#7a877e" }}>
        Engine: {health.ok ? `v${health.engine_version} — hoạt động` : "chưa kết nối"}
        {health.ok && !health.ty_boundary_set
          ? " · chính sách giờ Tý chưa chốt (chỉ ảnh hưởng tử vi/bát tự)"
          : ""}
      </p>
    </main>
  );
}
