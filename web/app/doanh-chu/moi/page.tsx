// Chuyển hướng vĩnh viễn từ URL cũ /doanh-chu/moi?ma=... sang /ban-do-doi-ngu/moi?ma=... (giữ nguyên mã mời).
import { permanentRedirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ma) ? sp.ma[0] : sp.ma;
  permanentRedirect(raw ? `/ban-do-doi-ngu/moi?ma=${encodeURIComponent(raw)}` : "/ban-do-doi-ngu/moi");
}
