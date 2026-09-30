import type { Metadata } from "next";
import { TuVi } from "./TuVi";

export const metadata: Metadata = {
  title: "Tử vi",
  description: "Lập lá số Tử vi 12 cung theo giờ, ngày và nơi sinh (xử lý múi giờ lịch sử Việt Nam, sinh ở nước ngoài theo giờ địa phương). Đại hạn, lưu niên, tiểu hạn, hỏi đáp theo cung.",
  alternates: { canonical: "/tu-vi" },
  openGraph: { title: "Tử vi", description: "Lập lá số Tử vi 12 cung theo giờ, ngày và nơi sinh (xử lý múi giờ lịch sử Việt Nam, sinh ở nước ngoài theo giờ địa phương). Đại hạn, lưu niên, tiểu hạn, hỏi đáp theo cung.", url: "/tu-vi" },
};

export default function Page() {
  return <TuVi />;
}
