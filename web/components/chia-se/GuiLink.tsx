"use client";
// Gửi / chép link chia sẻ dùng chung cho mọi nút chia sẻ — mục 18 (rà UX): bấm "Chia sẻ" lúc nào cũng có phản hồi.
// Điện thoại: Web Share. Không có (đa số máy tính) hoặc bị từ chối → chép vào bộ nhớ tạm. Chép cũng không được (trình duyệt
// chặn, Safari mất "cú bấm" sau khi chờ máy chủ ký mã…) → hiện link để người dùng tự chép, không im lặng.
import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

export type KetQuaGui = "da_gui" | "da_chep" | "huy" | "khong_duoc";

/** Chép chữ vào bộ nhớ tạm. */
export async function chepLink(chu: string): Promise<"da_chep" | "khong_duoc"> {
  try {
    await navigator.clipboard.writeText(chu);
    return "da_chep";
  } catch {
    return "khong_duoc";
  }
}

/** Web Share → (không có / lỗi) chép `chuChep`. Người dùng tự huỷ hộp chia sẻ mà chép cũng không được → "huy" (im lặng
 *  là đúng: họ chủ động đóng). */
export async function guiHoacChep(d: { title: string; text?: string; url: string }, chuChep: string = d.url): Promise<KetQuaGui> {
  let huy = false;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(d);
      return "da_gui";
    } catch (e) {
      huy = (e as { name?: string } | null)?.name === "AbortError";
    }
  }
  const kq = await chepLink(chuChep);
  return kq === "khong_duoc" && huy ? "huy" : kq;
}

/** Khi máy không cho chép tự động. Có `url` → hiện ô link (chọn sẵn để chép tay); không có → chỉ một dòng nhắc (dùng ở
 *  khung đã có sẵn ô link). */
export function ChepTay({ url, className = "" }: { url?: string; className?: string }) {
  const o = useRef<HTMLInputElement>(null);
  useEffect(() => { o.current?.focus(); o.current?.select(); }, [url]);
  return (
    <div role="status" className={`space-y-1.5 ${className}`} data-testid="chep-tay">
      <p className="text-sm text-fg-muted">
        {url ? "Máy chưa cho chép tự động — bạn chép link dưới đây nhé:" : "Máy chưa cho chép tự động — bấm vào ô link rồi chép nhé."}
      </p>
      {url && (
        <Input ref={o} readOnly value={url} aria-label="Link chia sẻ" onFocus={(e) => e.currentTarget.select()} className="h-11 text-sm" />
      )}
    </div>
  );
}
