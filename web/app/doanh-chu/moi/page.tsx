// Chuyển hướng vĩnh viễn 1 bước từ /doanh-chu/moi?ma=... sang /quan-ly-nhan-su/moi?ma=... (giữ nguyên mã mời).
import { permanentRedirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ma) ? sp.ma[0] : sp.ma;
  permanentRedirect(raw ? `/quan-ly-nhan-su/moi?ma=${encodeURIComponent(raw)}` : "/quan-ly-nhan-su/moi");
}
