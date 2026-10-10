// Tên vai trò quản trị — tách khỏi lib/quan-tri.ts (chỉ máy chủ) để giao diện phía trình duyệt dùng được.
export type VaiTro = "chu_so_huu" | "bien_tap" | "tham_dinh" | "ho_tro" | "xem";

export const TEN_VAI_TRO: Record<VaiTro, string> = {
  chu_so_huu: "Chủ sở hữu", bien_tap: "Biên tập", tham_dinh: "Chuyên gia thẩm định", ho_tro: "Hỗ trợ", xem: "Chỉ xem",
};
