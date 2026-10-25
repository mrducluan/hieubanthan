"use client";
// KC-5 — khối cuối bài đọc (sau góp ý): (1) gợi mở sang mảng khác cùng nỗi băn khoăn (từ điển ý định chung), (2) luận giải
// toàn bộ / nạp Sao khi đang thu Sao, (3) mời bạn, (4) ủng hộ. Không doạ, không đếm ngược; mọi link trong site.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Gift, HeartHandshake, Sparkles, UserPlus } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { mangLuanGiai } from "@/lib/luan-giai-mang";
import { GoiMoCheo, type GoiMo } from "./GoiMoCheo";

const MA_MAC_DINH: Record<string, string> = {
  thanso: "ban_than", thanso_sau: "ban_than", tuvi: "ban_than", battu: "ban_than", kinhdich: "ban_than", phongthuy: "nha_cua",
  hom_nay: "thoi_diem", xem_ngay: "thoi_diem", tuoi_lam_nha: "nha_cua", tuoi_xong_dat: "nha_cua", hop_doi: "tinh_cam",
};
const LUAN_GIAI: Record<string, { duong: string; ten: string }> = {
  thanso: { duong: "/than-so#ban-do-con-so", ten: "Bản đồ con số" }, thanso_sau: { duong: "/than-so#ban-do-con-so", ten: "Bản đồ con số" },
  tuvi: { duong: "/tu-vi", ten: "Luận giải Tử vi đời sống" }, battu: { duong: "/bat-tu", ten: "Luận giải Bát tự" },
};

export function CtaCuoiBai({ moDun, maYDinh, goiMo }: { moDun: string; maYDinh?: string | null; goiMo?: GoiMo | null }) {
  const [phi, setPhi] = useState<{ thu: boolean; gia: number } | null>(null);
  const lg = LUAN_GIAI[moDun];
  const bam = (kind: string) => ghi("chart_interacted", { mo_dun: moDun, kind: `cta_${kind}` });
  const lgKhac = Object.entries(LUAN_GIAI).filter(([k]) => k !== moDun && !(moDun === "thanso_sau" && k === "thanso")).slice(0, 2);
  // SAO-V: công tắc thu Sao có thể bật riêng từng mảng → hỏi đúng mảng của báo cáo mà thẻ này dẫn tới.
  const mangPhi = mangLuanGiai(lg ? moDun : lgKhac[0]?.[0]) ?? "thanso";
  useEffect(() => {
    let huy = false;
    fetch(`/api/luan-giai/phi?mo_dun=${mangPhi}`).then((r) => r.json()).then((d) => { if (!huy && d && typeof d.thu === "boolean") setPhi(d); }).catch(() => { /* coi như miễn phí */ });
    return () => { huy = true; };
  }, [mangPhi]);
  return (
    <div className="space-y-4" data-nosnippet="" data-testid="cta-cuoi-bai">
      <GoiMoCheo goiMo={goiMo} moDun={moDun} ma={goiMo ? undefined : (maYDinh ?? MA_MAC_DINH[moDun] ?? "ban_than")} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href={lg?.duong ?? lgKhac[0]?.[1].duong ?? "/than-so"} onClick={() => bam("luan_giai")}
          className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/[0.06] p-4 text-sm hover:border-gold/70" data-testid="cta-luan-giai">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
          <span><b className="block text-fg">{lg ? `Đọc trọn ${lg.ten}` : `Đọc ${lgKhac[0]?.[1].ten ?? "Bản đồ con số"}`}</b>
            <span className="text-fg-muted">{phi?.thu ? `Chương đầu miễn phí · trọn bộ ${phi.gia} Sao, xem lại cả ngày.` : "Đang miễn phí giai đoạn ra mắt — đọc ngay."}</span></span>
        </Link>
        <Link href="/hop-doi" onClick={() => bam("moi_ban")} className="flex items-start gap-3 rounded-2xl border border-line/70 p-4 text-sm hover:border-gold/60" data-testid="cta-moi-ban">
          <UserPlus className="mt-0.5 size-5 shrink-0 text-jade" aria-hidden />
          <span><b className="block text-fg">Rủ một người xem cùng</b><span className="text-fg-muted">Gửi link hợp đôi hoặc thẻ ngày — người kia tự nhập, cả hai cùng thấy. Hai bên được tặng Sao khi lưu hồ sơ.</span></span>
        </Link>
        {phi?.thu ? (
          <Link href="/nap-sao" onClick={() => bam("nap_sao")} className="flex items-start gap-3 rounded-2xl border border-line/70 p-4 text-sm hover:border-gold/60" data-testid="cta-nap-sao">
            <Gift className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
            <span><b className="block text-fg">Nạp Sao</b><span className="text-fg-muted">Sao dùng cho báo cáo sâu và câu hỏi thêm. Nạp nhanh bằng QR, quay lại đúng chỗ đang đọc.</span></span>
          </Link>
        ) : (
          <Link href="/ung-ho" onClick={() => bam("ung_ho")} className="flex items-start gap-3 rounded-2xl border border-line/70 p-4 text-sm hover:border-gold/60" data-testid="cta-ung-ho">
            <HeartHandshake className="mt-0.5 size-5 shrink-0 text-moon" aria-hidden />
            <span><b className="block text-fg">Thấy có ích? Ủng hộ nhóm làm</b><span className="text-fg-muted">Quà tặng tự nguyện, không kèm quyền lợi — giúp giữ phần cốt lõi miễn phí.</span></span>
          </Link>
        )}
      </div>
      {phi?.thu && (
        <p className="text-xs text-fg-faint"><Link href="/ung-ho" onClick={() => bam("ung_ho")} className="hover:underline">Hoặc ủng hộ nhóm làm (quà tặng, không đổi Sao) →</Link></p>
      )}
    </div>
  );
}
