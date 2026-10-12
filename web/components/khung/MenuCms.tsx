// Menu đầu trang + tab dưới đọc từ CMS (server). Bọc trong Suspense ở layout: CMS chậm/lỗi → hiện ngay bản mặc định
// MENU_DAU_TRANG, không giữ byte đầu của trang (như chân trang). Hai chỗ gọi cùng một fetch → Next gộp một lượt.
import { menuDauTrangCms } from "@/lib/cms";
import { MENU_DAU_TRANG } from "@/lib/menu-dau-trang";
import { TabDuoi, ThanhTren } from "./DieuHuong";

export async function ThanhTrenCms() {
  return <ThanhTren muc={(await menuDauTrangCms()) ?? MENU_DAU_TRANG} />;
}

export async function TabDuoiCms() {
  return <TabDuoi muc={(await menuDauTrangCms()) ?? MENU_DAU_TRANG} />;
}
