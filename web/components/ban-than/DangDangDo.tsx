"use client";
// BT-UI — "Đang dang dở" trên /ban-than: tối đa bốn dòng việc người dùng đã bắt đầu, đọc từ CHÍNH máy họ (lịch sử quẻ, trải bài
// Tarot, hồ sơ nhà, khảo sát tướng, người thân đã lưu) — không gọi máy chủ, không gửi gì đi. Không hiện câu hỏi đã gõ (chỉ
// tên quẻ / lá tâm điểm). Không có gì dang dở → khối không hiện.
import { useEffect, useState } from "react";
import Link from "@/components/khung/Lien";
import { ArrowRight, Hexagon, Home, ScanFace, Sparkles, Users, type LucideIcon } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { docLichSuQue, nhanLuc } from "@/lib/lich-su-que";
import { docLichSu } from "@/lib/tarot";
import { tenNha, useHoSoNha } from "@/lib/ho-so-nha";
import { demTraLoi, TOI_THIEU_CAU, useTraLoi } from "@/lib/nhan-tuong";
import { useNguoiThan } from "@/lib/nguoi-than";

interface Dong { ma: string; Icon: LucideIcon; ten: string; mo: string; duong: string }

export function DangDangDo() {
  const [may, setMay] = useState<Dong[] | null>(null);
  const nha = useHoSoNha();
  const traLoi = useTraLoi();
  const nguoiThan = useNguoiThan();
  useEffect(() => {
    const ds: Dong[] = [];
    const q = docLichSuQue()[0];
    if (q) ds.push({ ma: "que", Icon: Hexagon, ten: `Quẻ ${q.ten_que}${q.ten_bien ? ` → ${q.ten_bien}` : ""}`, mo: `Gieo ${nhanLuc(q.luc)} — xem lại lời đọc hoặc hỏi tiếp`, duong: "/kinh-dich" });
    const t = docLichSu()[0];
    if (t) ds.push({ ma: "tarot", Icon: Sparkles, ten: `Trải bài Tarot: ${t.tom_tat}`, mo: `${t.la.length} lá đã rút — đọc lại hoặc rút cho việc khác`, duong: "/tarot" });
    setMay(ds);
  }, []);
  if (may === null || nha === undefined || traLoi === undefined || nguoiThan === undefined) return null;
  const ds = [...may];
  if (nha) ds.push({ ma: "nha", Icon: Home, ten: tenNha(nha).replace(/^./, (c) => c.toUpperCase()), mo: "Hướng nhà đã lưu — xem tháng này nên để ý phía nào", duong: "/phong-thuy" });
  const soNet = demTraLoi(traLoi);
  if (soNet > 0 && soNet < TOI_THIEU_CAU) ds.push({ ma: "nhan_tuong", Icon: ScanFace, ten: `Soi gương: mới ghi ${soNet} nét`, mo: `Thêm ${TOI_THIEU_CAU - soNet} nét nữa là bài đọc đủ nội dung`, duong: "/nhan-tuong" });
  if (nguoiThan.length) ds.push({ ma: "nguoi_than", Icon: Users, ten: `${nguoiThan.length} người thân đã lưu trên máy`, mo: "Xem lá số của họ hoặc điểm hợp giữa hai người", duong: "/tu-vi#hop-tham" });
  if (!ds.length) return null;
  return (
    <section aria-labelledby="muc-dang-do" data-testid="dang-dang-do">
      <h2 id="muc-dang-do" className="font-serif text-xl">Đang dang dở</h2>
      <p className="mt-1 text-sm text-fg-muted">Những việc bạn đã bắt đầu trên máy này.</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {ds.slice(0, 4).map(({ ma, Icon, ten, mo, duong }) => (
          <li key={ma}>
            <Link href={duong} onClick={() => ghi("chart_interacted", { kind: "ban_than_tiep", muc: ma })} data-testid={`dang-do-${ma}`}
              className="glass group flex h-full items-center justify-between gap-3 rounded-2xl p-4 hover:border-gold/50">
              <span className="flex min-w-0 items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
                <span className="min-w-0"><span className="block truncate font-medium">{ten}</span><span className="block text-sm text-fg-muted">{mo}</span></span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-fg-faint transition-transform group-hover:translate-x-1 group-hover:text-gold" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
