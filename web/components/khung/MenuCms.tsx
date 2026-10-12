// Menu đầu trang + tab dưới đọc từ CMS (server). Bọc trong Suspense ở layout: CMS chậm/lỗi → hiện ngay bản mặc định
// MENU_DAU_TRANG, không giữ byte đầu của trang (như chân trang). fetch có AbortSignal nên Next không tự gộp → cache()
// để thanh trên + tab dưới dùng chung một lượt đọc trong cùng một yêu cầu.
import { cache } from "react";
import { menuDauTrangCms as docMenu } from "@/lib/cms";
import { MENU_DAU_TRANG } from "@/lib/menu-dau-trang";
import { TabDuoi, ThanhTren } from "./DieuHuong";

const menuDauTrangCms = cache(docMenu);

export async function ThanhTrenCms() {
  return <ThanhTren muc={(await menuDauTrangCms()) ?? MENU_DAU_TRANG} />;
}

export async function TabDuoiCms() {
  return <TabDuoi muc={(await menuDauTrangCms()) ?? MENU_DAU_TRANG} />;
}
