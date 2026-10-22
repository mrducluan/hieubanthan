// ND-7 đợt 2 — "Chữ dùng chung": chữ nhỏ lặp lại trên nhiều trang của hieuban.com (form hồ sơ, ô vào trang chủ, khung hỏi
// đáp, nút Thử lại). Bảng chữ gốc (mac_dinh.chu) do job đồng bộ sổ trang ghi từ web (web/lib/chu/chung.ts) — biên tập viên
// chỉ gõ chữ thay ở tab "Chữ trên trang" (cùng giao diện với Trang website). Để trống = chữ gốc.
import { APIError, type GlobalBeforeChangeHook, type GlobalConfig } from "payload";
import { ai, chiChuBien } from "../access";
import { lamMoiGlobal } from "../hooks/lamMoiWeb";
import { bangCua, locChuCms } from "../lib/chu-trang";
import { kiemTrang } from "../lib/noi-dung-trang";

/** Ô mac_dinh chỉ đồng bộ ghi; chữ thay lọc theo bảng + kiểm định ranh giới chung (liên hệ, tên nội bộ…) → chặn lưu. */
const locVaKiem: GlobalBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (req.context?.dongBo) return data;
  data.mac_dinh = (originalDoc as { mac_dinh?: unknown } | undefined)?.mac_dinh ?? null;
  data.chu = locChuCms(bangCua(data.mac_dinh), data.chu);
  const kq = kiemTrang({ chu: data.chu });
  if (kq.chan.length) throw new APIError("Chưa lưu được — sửa các lỗi sau: " + kq.chan.map((m) => m.thong_diep).join(" · "), 400, null, true);
  return data;
};

export const ChuChung: GlobalConfig = {
  slug: "chu-chung",
  label: "Chữ dùng chung",
  admin: { group: "Giao diện website",
    description: "Chữ nhỏ lặp lại trên nhiều trang: form hồ sơ, ô vào trang chủ, khung hỏi đáp, nút Thử lại. Sửa một lần, đổi ở mọi trang (sau vài giây). Để trống = chữ gốc." },
  access: { read: ai, update: chiChuBien },
  hooks: { beforeChange: [locVaKiem], afterChange: [lamMoiGlobal] },
  fields: [
    { name: "mac_dinh", label: "Chữ gốc trong code", type: "json", access: { update: () => false }, admin: { hidden: true } },
    { name: "chu", label: "Chữ trên trang", type: "json", admin: { components: { Field: "/components/ChuTrenTrang#ChuTrenTrang" } } },
  ],
};
