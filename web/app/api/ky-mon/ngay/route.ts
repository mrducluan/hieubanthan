// POST /api/ky-mon/ngay — 13 khung giờ của một ngày theo bàn Kỳ Môn; có `viec` thì kèm các giờ hợp việc ấy.
import { goiEngine } from "@/lib/proxy";
import { NgayIn } from "../khuon";

export function POST(req: Request) {
  return goiEngine(req, NgayIn, "/v1/ky-mon/ngay");
}
