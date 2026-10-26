"use client";
// Gửi / chép link chia sẻ dùng chung cho mọi nút chia sẻ — mục 18 (rà UX): bấm "Chia sẻ" lúc nào cũng có phản hồi.
// Điện thoại: Web Share. Không có (đa số máy tính) hoặc bị từ chối → chép vào bộ nhớ tạm. Chép cũng không được (trình duyệt
// chặn, Safari mất "cú bấm" sau khi chờ máy chủ ký mã…) → hiện link để người dùng tự chép, không im lặng.
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
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

/** Chọn hết chữ trong ô nhưng giữ khung nhìn ở ĐẦU link (v3 M8): select() mặc định cuộn tới cuối, người dùng chỉ thấy
 *  "…?tu=hn.a5c" mà không thấy tên miền. Chọn theo chiều "backward" để điểm con trỏ ở đầu, rồi kéo scrollLeft về 0. */
function chonTuDau(el: HTMLInputElement) {
  try { el.setSelectionRange(0, el.value.length, "backward"); } catch { el.select(); }
  el.scrollLeft = 0;
}

/** Khi máy không cho chép tự động. Có `url` → hiện ô link (chọn sẵn, hiện từ đầu) + nút "Chép"; không có → chỉ một dòng
 *  nhắc (dùng ở khung đã có sẵn ô link). */
export function ChepTay({ url, className = "" }: { url?: string; className?: string }) {
  const o = useRef<HTMLInputElement>(null);
  const [kq, setKq] = useState<"" | "da_chep" | "tu_chep">("");
  useEffect(() => {
    const el = o.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    chonTuDau(el);
    setKq("");
  }, [url]);
  // Bấm "Chép" là một cú bấm mới của người dùng → trình duyệt thường cho chép lúc này. Không được → để sẵn chữ đã chọn.
  async function chep() {
    const el = o.current;
    if (!url || !el) return;
    let duoc = (await chepLink(url)) === "da_chep";
    if (!duoc) {
      el.focus({ preventScroll: true });
      el.select();
      try { duoc = document.execCommand("copy"); } catch { duoc = false; }
      chonTuDau(el);
    }
    setKq(duoc ? "da_chep" : "tu_chep");
  }
  return (
    <div role="status" className={`space-y-1.5 ${className}`} data-testid="chep-tay">
      <p className="text-sm text-fg-muted">
        {url ? "Máy chưa cho chép tự động — bạn chép link dưới đây nhé:" : "Máy chưa cho chép tự động — bấm vào ô link rồi chép nhé."}
      </p>
      {url && (
        <div className="flex gap-2">
          <Input ref={o} readOnly value={url} aria-label="Link chia sẻ" onFocus={(e) => chonTuDau(e.currentTarget)}
            className="h-11 min-w-0 flex-1 text-sm" data-testid="chep-tay-o" />
          <Button type="button" variant="secondary" className="h-11 shrink-0" onClick={() => void chep()} data-testid="chep-tay-nut">
            {kq === "da_chep" ? <Check aria-hidden /> : <Copy aria-hidden />}{kq === "da_chep" ? "Đã chép" : "Chép"}
          </Button>
        </div>
      )}
      {kq === "tu_chep" && <p className="text-xs text-fg-muted">Link đã được chọn sẵn — nhấn giữ vào ô rồi chọn “Sao chép”.</p>}
    </div>
  );
}
