// Nút "Xem trước" trong CMS → /api/cms/xem-truoc?slug=…&ma=HMAC(slug) (bài viết) hoặc ?duong=…&ma=HMAC("trang:" + duong)
// (Trang website / Mẫu cụm — ND-6). Mã đúng → bật draft mode (cookie phiên, chỉ trình duyệt này) rồi mở trang; trang đọc
// bản NHÁP mới nhất bằng khoá API Máy đọc (CMS_API_KEY). Mẫu cụm ("/tu-vi/sao-o-cung/{slug}") → mở một trang ví dụ của cụm.
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { maXemTruoc, soKhop } from "@/lib/cms";
import { duongHopLe } from "@/lib/noi-dung-trang";
import { khopMauCum, MAU_CUM, mucSoTrang, viDuMau } from "@/lib/so-trang";

const sai = () => NextResponse.json({ loi: "Link xem trước không hợp lệ hoặc đã đổi khoá." }, { status: 401 });

export async function GET(req: Request) {
  const u = new URL(req.url);
  const ma = u.searchParams.get("ma");
  const duong = u.searchParams.get("duong");
  if (duong !== null) {
    // Chỉ URL có trong sổ trang / thuộc một mẫu cụm, hoặc chính một mẫu cụm — không mở chuyển hướng tuỳ ý.
    const mau = MAU_CUM.find((m) => m.mau_duong === duong);
    const den = mau ? viDuMau(mau) : duongHopLe(duong);
    if (!den || !soKhop(ma, maXemTruoc(`trang:${duong}`))) return sai();
    if (!mau && !mucSoTrang(den) && !khopMauCum(den)) return sai();
    (await draftMode()).enable();
    redirect(den);
  }
  const slug = u.searchParams.get("slug") ?? "";
  if (!/^[a-z0-9-]{1,120}$/.test(slug) || !soKhop(ma, maXemTruoc(slug))) return sai();
  (await draftMode()).enable();
  redirect(`/blog/${slug}`);
}
