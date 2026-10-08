// IndexNow — khoá xác minh chủ sở hữu khi báo Bing/Yandex/Seznam… có trang mới (Bing cấp dữ liệu cho Copilot,
// ChatGPT tìm kiếm). Khoá này công khai theo thiết kế của giao thức, không phải bí mật. Gửi: scripts/indexnow.mjs.
const INDEXNOW_KEY = "063b24c995f334e004c3d7de00cf0bbf";

export function GET() {
  return new Response(INDEXNOW_KEY, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
