// Khung đọc bài blog (bài CMS + bài NotFair): cột bài tối đa 48rem, màn hình lớn thêm cột phải DÍNH gồm mục lục
// (MucLucBai) và thẻ nhỏ mời dùng công cụ của mảng (CtaBen). Không đủ mục → một cột như cũ. Thân bài phải có id
// `THAN_BAI_ID` để tính % đã đọc.
import type { ReactNode } from "react";
import { MucLucBai } from "@/components/blog/MucLucBai";
import { dangHienMucLuc, type MucLuc } from "@/lib/muc-luc";
import { cn } from "@/lib/utils";

export const THAN_BAI_ID = "than-bai";

export function KhungBaiDoc({ mucLuc, tieuDe, ben, nguon, children }: {
  mucLuc: MucLuc[]; tieuDe: string; /** thẻ đặt dưới mục lục ở cột phải */ ben?: ReactNode; nguon: "cms" | "notfair"; children: ReactNode;
}) {
  const co = dangHienMucLuc(mucLuc);
  return (
    <div className={cn("mx-auto", co ? "lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-16" : "max-w-3xl")}
      data-nguon-bai={nguon} data-khung-bai={co ? "hai-cot" : "mot-cot"}>
      <div className="mx-auto min-w-0 w-full max-w-3xl lg:mx-0">{children}</div>
      {co && (
        <aside className="hidden lg:block" aria-label="Bên lề bài viết">
          <div className="sticky top-24 space-y-5">
            <MucLucBai muc={mucLuc} thanId={THAN_BAI_ID} tieuDe={tieuDe} bien="canh" />
            {ben}
          </div>
        </aside>
      )}
    </div>
  );
}

/** Mục lục gập cho điện thoại / máy tính bảng — đặt ngay trên thân bài, ẩn ở màn hình lớn (đã có cột phải). */
export function MucLucGon({ mucLuc, tieuDe }: { mucLuc: MucLuc[]; tieuDe: string }) {
  if (!dangHienMucLuc(mucLuc)) return null;
  return <div className="mt-6 lg:hidden"><MucLucBai muc={mucLuc} thanId={THAN_BAI_ID} tieuDe={tieuDe} bien="gon" /></div>;
}
