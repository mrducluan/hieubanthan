// POST /api/ky-mon/ban — bàn Kỳ Môn của một giờ + bài đọc hướng (engine lập và đọc; web chỉ chuyển). Không dữ liệu cá nhân.
import { goiEngine } from "@/lib/proxy";
import { BanIn } from "../khuon";

export function POST(req: Request) {
  return goiEngine(req, BanIn, "/v1/ky-mon/ban");
}
