// EN-ALL GĐ 1 việc 5 (docs/PROMPT-EN-TOAN-BO.md mục 3.1 "Dữ liệu engine theo ngôn ngữ") — mọi lời gọi engine có bộ nhớ
// đệm (`fetch` + `next.revalidate`) phải mang ngôn ngữ TRONG URL (`?ngon_ngu=en`), không chỉ trong header: khoá đệm dữ
// liệu của Next không tính header, nên bản Anh và bản Việt sẽ dùng chung một bản đệm. Bản Việt GIỮ NGUYÊN URL cũ (không
// thêm tham số) → khoá đệm + đầu ra bản Việt không đổi.
// Dùng được ở module mà component client cũng import (chỉ đọc header khi chạy ở máy chủ, qua import động).
import { LA_MA_EN } from "@/lib/ngon-ngu";

/** Ngôn ngữ của lượt tải trang hiện tại ở máy chủ ("vi" khi không trong một lượt yêu cầu: build, script, trình duyệt). */
export async function maNgonNguLuot(): Promise<string> {
  if (typeof window !== "undefined") return "vi";
  try {
    const { headers } = await import("next/headers");
    const nn = ((await headers()).get("x-ngon-ngu") ?? "vi").toLowerCase();
    return LA_MA_EN.test(nn) ? nn : "vi";
  } catch {
    return "vi";   // ngoài phạm vi một yêu cầu (generateStaticParams, build) → bản Việt
  }
}

/** Gắn ngôn ngữ vào đường dẫn engine + header: bản Việt trả nguyên. */
export function ganNgonNgu(duong: string, ma: string): { duong: string; dau: Record<string, string> } {
  if (!LA_MA_EN.test(ma)) return { duong, dau: {} };
  return { duong: `${duong}${duong.includes("?") ? "&" : "?"}ngon_ngu=${ma}`, dau: { "x-ngon-ngu": ma } };
}

/** Cả hai bước cho một lời gọi engine ở máy chủ. */
export async function duongTheoLuot(duong: string): Promise<{ duong: string; dau: Record<string, string> }> {
  return ganNgonNgu(duong, await maNgonNguLuot());
}
