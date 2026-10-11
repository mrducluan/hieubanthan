// Phân quyền CMS. Vai trò nằm trên tài khoản biên tập (collection bien-tap-vien):
//   quan_tri — mọi thứ, kể cả tài khoản;  chu_bien — xuất bản, ký thẩm định, chỉnh tính năng;
//   bien_tap — viết/sửa NHÁP, không xuất bản;  may_doc — khoá API cho web đọc bản nháp khi xem trước, không vào được admin.
import type { Access, FieldAccess, PayloadRequest } from "payload";

export const VAI_TRO = [
  { label: "Quản trị", value: "quan_tri" },
  { label: "Chủ biên", value: "chu_bien" },
  { label: "Biên tập viên", value: "bien_tap" },
  { label: "Máy đọc (khoá API cho web)", value: "may_doc" },
] as const;
export type VaiTro = (typeof VAI_TRO)[number]["value"];

export const vaiTro = (req: PayloadRequest): VaiTro | null => {
  const u = req.user as { collection?: string; vai_tro?: VaiTro } | null;
  return u && u.collection === "bien-tap-vien" ? (u.vai_tro ?? null) : null;
};
const la = (...ds: VaiTro[]) => (req: PayloadRequest) => {
  const v = vaiTro(req);
  return Boolean(v && ds.includes(v));
};

export const laQuanTri = la("quan_tri");
export const laChuBien = la("quan_tri", "chu_bien");
export const laNguoiViet = la("quan_tri", "chu_bien", "bien_tap");
export const daDangNhap = la("quan_tri", "chu_bien", "bien_tap", "may_doc");

export const ai: Access = () => true;
export const chiQuanTri: Access = ({ req }) => laQuanTri(req);
export const chiChuBien: Access = ({ req }) => laChuBien(req);
export const nguoiViet: Access = ({ req }) => laNguoiViet(req);

/** Đọc bài: khách chỉ thấy bản đã xuất bản; người trong ban biên tập (và máy đọc xem trước) thấy cả nháp. */
export const daXuatBanHoacNoiBo: Access = ({ req }) =>
  daDangNhap(req) ? true : { _status: { equals: "published" } };

/** Sửa bài: biên tập viên được lưu nháp, KHÔNG được xuất bản (Payload hỏi quyền xuất bản bằng data._status=published). */
export const suaBai: Access = ({ req, data }) => {
  if (laChuBien(req)) return true;
  if (!laNguoiViet(req)) return false;
  return (data as { _status?: string } | undefined)?._status !== "published";
};

export const truongChuBien: FieldAccess = ({ req }) => laChuBien(req);
export const truongNoiBo: FieldAccess = ({ req }) => daDangNhap(req);
