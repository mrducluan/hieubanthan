import type { Metadata } from "next";
import { KinhDich } from "./KinhDich";

export const metadata: Metadata = {
  title: "Kinh Dịch",
  description: "Gieo quẻ Kinh Dịch cho một câu hỏi cụ thể: gieo tay hoặc máy gieo, đọc theo Nghĩa Lý, Lục Hào, Mai Hoa — có trích Chu Dịch.",
  alternates: { canonical: "/kinh-dich" },
  openGraph: { title: "Kinh Dịch", description: "Gieo quẻ Kinh Dịch cho một câu hỏi cụ thể: gieo tay hoặc máy gieo, đọc theo Nghĩa Lý, Lục Hào, Mai Hoa — có trích Chu Dịch.", url: "/kinh-dich" },
};

export default function Page() {
  return <KinhDich />;
}
