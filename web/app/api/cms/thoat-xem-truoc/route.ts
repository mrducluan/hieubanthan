import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { duongHopLe } from "@/lib/noi-dung-trang";

// Thoát chế độ nháp → về bài (?slug=) hoặc về trang đang xem (?duong=, ND-6) — chỉ đường dẫn trong site.
export async function GET(req: Request) {
  (await draftMode()).disable();
  const u = new URL(req.url);
  const slug = u.searchParams.get("slug") ?? "";
  if (/^[a-z0-9-]{1,120}$/.test(slug)) redirect(`/blog/${slug}`);
  redirect(duongHopLe(u.searchParams.get("duong")) ?? "/blog");
}
