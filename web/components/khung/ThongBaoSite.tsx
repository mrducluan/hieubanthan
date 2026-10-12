// Dải thông báo toàn site (chiến dịch mời, sự kiện). Nội dung do ban biên tập đặt ở CMS → "Trang chủ & banner"
// (bật/tắt, chữ ≤ 160, link trong site, khung ngày hiện). CMS chưa nối / tắt / ngoài khung ngày = không hiện gì.
// Chỉ là chữ thuần + link nội bộ (không HTML). Số/công tắc ảnh hưởng Sao vẫn ở /quan-tri (docs/KIEN-TRUC-CMS.md mục 0).
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { dangHien, duongLienKet, trangChuCms } from "@/lib/cms";

export async function ThongBaoSite() {
  const tb = (await trangChuCms())?.thong_bao;
  const chu = tb?.bat ? tb.chu?.trim() : "";
  if (!tb || !chu || !dangHien(tb)) return null;
  const link = tb.link ? duongLienKet({ nhan: chu, loai: "duong_dan", duong_dan: tb.link }) : null;
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
