// IndexNow — khoá xác minh chủ sở hữu khi báo Bing/Yandex/Seznam… có trang mới (Bing cấp dữ liệu cho Copilot,
// ChatGPT tìm kiếm). Khoá này công khai theo thiết kế của giao thức, không phải bí mật. Gửi: scripts/indexnow.mjs
// (sau deploy + hằng ngày) và lib/indexnow.ts (ngay khi CMS xuất bản / sửa một bài blog).
import { INDEXNOW_KEY } from "@/lib/indexnow";

export function GET() {
  return new Response(INDEXNOW_KEY, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
