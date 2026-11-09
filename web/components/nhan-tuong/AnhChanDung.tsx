"use client";
// ANH-1 + ANH-2 — "Tải ảnh chân dung" ở ĐẦU trang Nhân tướng học (ẩn khi đã có bài đọc).
// Cách chính (ANH-2, luôn có): hệ thống hieuban TỰ ĐO trên ảnh, không AI — ảnh không rời máy, người dùng chấm điểm mốc,
// engine đo tỉ lệ "tam đình ngũ nhãn" → gợi ý → xác nhận → bài đọc (components/nhan-tuong/DoMatTrenAnh).
// Cách thêm (ANH-1, chỉ khi người vận hành bật `NHAN_TUONG_DOC_ANH=1`): gửi ảnh cho máy AI gợi ý thêm sắc da, nếp, ánh mắt
// — thoả thuận riêng, gập mặc định (components/nhan-tuong/GoiYTuAi).
import { useEffect, useState } from "react";
import { ChevronDown, ScanFace } from "lucide-react";
import type { KhaoSat, TraLoi } from "@/lib/nhan-tuong";
import { DoMatTrenAnh } from "./DoMatTrenAnh";
import { GoiYTuAi } from "./GoiYTuAi";

export function AnhChanDung({ ks, daTraLoi, onGoiY, onXem, onDungVaXem, dangXem }: {
  ks: KhaoSat | null; daTraLoi: TraLoi; onGoiY: (tl: TraLoi) => void; onXem: () => void; onDungVaXem?: (tl: TraLoi) => void; dangXem?: boolean;
}) {
  const [bat, setBat] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/nhan-tuong/cau-hinh").then((r) => (r.ok ? r.json() : null)).then((d) => setBat(Boolean(d?.doc_anh))).catch(() => setBat(false));
  }, []);
  return (
    <section aria-labelledby="anh-chan-dung" data-testid="anh-chan-dung" data-ai={bat ? "1" : "0"}
      className="relative mx-auto mb-8 max-w-5xl overflow-hidden rounded-3xl border border-gold/45 bg-gradient-to-br from-gold/[0.09] via-surface/70 to-bg/40 p-5 sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" aria-hidden />
      <div className="relative">
        <p className="eyebrow text-gold">Từ ảnh của bạn · ảnh không rời máy</p>
        <h2 id="anh-chan-dung" className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">Tải ảnh chân dung — <span className="text-gradient-gold">hệ thống tự đo</span>, bạn xác nhận</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted sm:text-base">
          Chọn một ảnh chụp thẳng — máy bạn tự tìm 20 điểm mốc ngay trong trình duyệt (vài giây), bạn chỉ xem lại và kéo chấm nào lệch. Hệ thống đo tỉ lệ ba đình, độ rộng trán, gò má, quai hàm, mắt, mũi, miệng theo phép &ldquo;tam đình ngũ nhãn&rdquo; của sách tướng, gợi ý câu trả lời cho khảo sát, bạn xác nhận rồi xem bài đọc. Ảnh không gửi đi đâu, không chấm điểm, không lưu ảnh.
        </p>
        <div className="mt-5">{ks ? <DoMatTrenAnh ks={ks} daTraLoi={daTraLoi} onGoiY={onGoiY} onXem={onXem} onDungVaXem={onDungVaXem} dangXem={dangXem} /> : null}</div>
        {bat && ks && (
          <details className="group mt-5 rounded-2xl border border-line/70 bg-bg/40 p-4" data-testid="anh-ai-khoi">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-fg">
              <ScanFace className="size-4 text-gold" aria-hidden /> Cho máy AI xem thêm sắc da, nếp, ánh mắt (tuỳ chọn)
              <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-2 text-xs text-fg-muted">Phép đo ở trên chỉ đo hình dáng. Những nét cần nhìn màu và kết cấu da, bạn có thể tự soi gương ở Khảo sát hoặc cho máy AI gợi ý — cách này gửi ảnh ra dịch vụ bên thứ ba nên có thoả thuận riêng.</p>
            <div className="mt-4"><GoiYTuAi ks={ks} daTraLoi={daTraLoi} onGoiY={onGoiY} onXem={onXem} dangXem={dangXem} /></div>
          </details>
        )}
      </div>
    </section>
  );
}
