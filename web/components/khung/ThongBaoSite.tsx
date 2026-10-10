// QT-2 — dải thông báo toàn site (chiến dịch mời, sự kiện). Nội dung do chủ sở hữu đặt ở /quan-tri/cai-dat
// (cau_hinh site.thong_bao, cache 60 giây). Trống = không hiện gì. Chỉ là chữ thuần + link nội bộ (không HTML).
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { layCauHinh } from "@/lib/cau-hinh";

export async function ThongBaoSite() {
  const [chu, link] = await Promise.all([layCauHinh<string>("site.thong_bao"), layCauHinh<string>("site.thong_bao_link")]);
  if (!chu) return null;
  const noi = <><Megaphone className="size-4 shrink-0" aria-hidden /><span>{chu}</span></>;
  return (
    <div role="region" aria-label="Thông báo" data-testid="thong-bao-site"
      className="border-b border-gold/30 bg-gold/10 px-4 py-2 text-center text-sm text-gold">
      {link
        ? <Link href={link} className="inline-flex items-center gap-2 underline-offset-4 hover:underline">{noi}</Link>
        : <span className="inline-flex items-center gap-2">{noi}</span>}
    </div>
  );
}
