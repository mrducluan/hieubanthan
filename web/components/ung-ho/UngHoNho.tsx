// Thẻ nhỏ "Ủng hộ nhà phát triển" đặt cuối các trang quan trọng. Chưa khai ví/tài khoản (env) → không hiện gì.
import { coUngHo } from "@/lib/ung-ho";
import { UngHoThe } from "./UngHoThe";

export function UngHoNho({ className = "", tu }: { className?: string; tu?: string }) {
  if (!coUngHo()) return null;
  return <UngHoThe className={className} tu={tu} />;
}
