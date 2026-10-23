// Nút "Xem trước" trong CMS → /api/cms/xem-truoc?slug=…&het=…&ma=HMAC(slug:het) (bài viết) hoặc
// ?duong=…&het=…&ma=HMAC("trang:" + duong + ":" + het) (Trang website / Mẫu cụm — ND-6). Mã đúng + chưa hết hạn → bật draft
// mode + cookie PHẠM VI (SEC-2: chỉ bài / trang được ký mới đọc nháp) rồi mở trang; trang đọc bản NHÁP mới nhất bằng khoá
// API Máy đọc (CMS_API_KEY). Mẫu cụm ("/tu-vi/sao-o-cung/{slug}") → mở một trang ví dụ của cụm.
import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { COOKIE_PHAM_VI, maXemTruoc, soKhop, taoPhamVi } from "@/lib/cms";
import { duongHopLe } from "@/lib/noi-dung-trang";
import { khopMauCum, MAU_CUM, mucSoTrang, viDuMau } from "@/lib/so-trang";

const sai = () => NextResponse.json({ loi: "Link xem trước không hợp lệ, đã hết hạn (1 giờ) hoặc đã đổi khoá — bấm lại nút Xem trước trong CMS." }, { status: 401 });
const HAN_TOI_DA = 2 * 60 * 60;   // CMS ký +1 giờ; chừa lệch đồng hồ

async function bat(muc: string, het: number): Promise<boolean> {
  const v = taoPhamVi(muc, het);
  if (!v) return false;
  (await draftMode()).enable();
  (await cookies()).set(COOKIE_PHAM_VI, v, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: Math.max(60, het - Math.floor(Date.now() / 1000)) });
  return true;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const ma = u.searchParams.get("ma");
  const het = Number(u.searchParams.get("het"));
  const bay = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(het) || het < bay || het > bay + HAN_TOI_DA) return sai();
  const duong = u.searchParams.get("duong");
  if (duong !== null) {
    // Chỉ URL có trong sổ trang / thuộc một mẫu cụm, hoặc chính một mẫu cụm — không mở chuyển hướng tuỳ ý.
    const mau = MAU_CUM.find((m) => m.mau_duong === duong);
    const den = mau ? viDuMau(mau) : duongHopLe(duong);
    if (!den || !soKhop(ma, maXemTruoc(`trang:${duong}`, het))) return sai();
    if (!mau && !mucSoTrang(den) && !khopMauCum(den)) return sai();
    if (!(await bat(`trang:${den}`, het))) return sai();
    redirect(den);
  }
  const slug = u.searchParams.get("slug") ?? "";
  if (!/^[a-z0-9-]{1,120}$/.test(slug) || !soKhop(ma, maXemTruoc(slug, het))) return sai();
  if (!(await bat(`bai:${slug}`, het))) return sai();
  redirect(`/blog/${slug}`);
}
