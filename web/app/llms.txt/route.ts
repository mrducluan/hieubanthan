// /llms.txt — bản đồ site cho mô hình ngôn ngữ (chuẩn llmstxt.org). Nội dung: lib/llms.ts.
import { taoLlmsTxt } from "@/lib/llms";

export const revalidate = 21600;

export async function GET() {
  return new Response(await taoLlmsTxt(), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
