// QTE — mọi URL lạ dưới /en rơi vào trang 404 tiếng Anh (not-found.tsx cùng thư mục) thay vì trang 404 tiếng Việt của gốc.
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Page() {
  notFound();
}
