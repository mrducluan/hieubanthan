// So bí mật chung web ↔ CMS (`CMS_WEBHOOK_SECRET`) — hằng thời gian, thiếu env → luôn sai.
import { createHash, timingSafeEqual } from "node:crypto";

export function dungBiMatChung(gui: string | null | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  const bi = env.CMS_WEBHOOK_SECRET;
  if (!bi || bi.length < 16 || !gui) return false;
  const a = createHash("sha256").update(gui).digest(), b = createHash("sha256").update(bi).digest();
  return timingSafeEqual(a, b);
}
