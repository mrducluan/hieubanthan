"use client";
// ND — video YouTube trong khối CMS: "bấm mới tải" (chủ dự án dặn, mục 8.6) — trước khi bấm chỉ là một nút, không có
// iframe, không ảnh từ máy chủ ngoài, không cookie; bấm mới nhúng youtube-nocookie (CSP frame-src đã cho phép).
import { useState } from "react";
import { Play } from "lucide-react";

export function VideoCms({ ma, tieuDe, chuThich }: { ma: string; tieuDe: string; chuThich: string | null }) {
  const [mo, setMo] = useState(false);
  return (
    <figure className="mx-auto max-w-3xl">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-surface/70">
        {mo ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${ma}?autoplay=1`} title={tieuDe} className="absolute inset-0 size-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        ) : (
          <button type="button" onClick={() => setMo(true)} data-testid="video-cms-phat"
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-gold text-bg shadow-[0_0_32px_-6px_rgb(var(--gold)/0.7)] transition-transform group-hover:scale-105">
              <Play className="ml-1 size-7" aria-hidden />
            </span>
            <span className="max-w-md font-serif text-lg">{tieuDe}</span>
            <span className="text-xs text-fg-faint">Bấm để phát · video từ YouTube</span>
          </button>
        )}
      </div>
      {chuThich && <figcaption className="mt-2 text-sm text-fg-muted">{chuThich}</figcaption>}
    </figure>
  );
}
