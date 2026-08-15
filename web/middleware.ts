// Chặn staging bằng HTTP Basic Auth — chỉ người biết mật khẩu mới xem được.
// TẮT HOÀN TOÀN khi STAGING_USER/STAGING_PASS không set → dev local và bản
// công khai (sau khi qua cổng pháp lý) không đòi mật khẩu.
//
// Đây là hàng rào staging tạm thời, KHÔNG phải hệ thống tài khoản người dùng
// (cái đó là giai đoạn B, dùng Supabase Auth).
import { NextRequest, NextResponse } from "next/server";

export const config = {
  // Bỏ qua tài nguyên tĩnh của Next để trang tải nhanh; chỉ gác nội dung.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req: NextRequest): NextResponse {
  const user = process.env.STAGING_USER;
  const pass = process.env.STAGING_PASS;

  // Không cấu hình → không gác (dev local, hoặc bản công khai chính thức).
  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    if (u === user && p === pass) return NextResponse.next();
  }

  return new NextResponse("Cần đăng nhập để xem bản thử nghiệm", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="HieuBanThan Staging"' },
  });
}
