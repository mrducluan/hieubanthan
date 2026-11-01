// Menu đầu trang + tab dưới đọc từ CMS (server). Bọc trong Suspense ở layout: CMS chậm/lỗi → hiện ngay bản mặc định
// MENU_DAU_TRANG, không giữ byte đầu của trang (như chân trang). fetch có AbortSignal nên Next không tự gộp → cache()
// để thanh trên + tab dưới dùng chung một lượt đọc trong cùng một yêu cầu.
import { cache } from "react";
import { chuyenMucMenuCms, menuDauTrangCms as docMenu } from "@/lib/cms";
import { ganChuyenMucBlog, MENU_DAU_TRANG, thayNamMenu } from "@/lib/menu-dau-trang";
import { namThoiGianToi } from "@/lib/nam";
import { TabDuoi, ThanhTren } from "./DieuHuong";

// NAM-1: "{nam}" trong menu (code hoặc CMS) → năm engine đang mời xem; engine chậm quá 1,5 giây → đoán theo lịch dương.
const menuDauTrangCms = cache(async () => {
  const [m, n, cm] = await Promise.all([docMenu(), namThoiGianToi(1_500), chuyenMucMenuCms()]);
  // Blog không có menu con do biên tập đặt → menu con = chuyên mục đang có bài (mới thêm chuyên mục ở CMS là tự hiện).
  return ganChuyenMucBlog(thayNamMenu(m ?? MENU_DAU_TRANG, n.mac_dinh ?? n.cac_nam[0]!), cm);
});

export async function ThanhTrenCms() {
  return <ThanhTren muc={await menuDauTrangCms()} />;
}

export async function TabDuoiCms() {
  return <TabDuoi muc={await menuDauTrangCms()} />;
}
