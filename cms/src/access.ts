// Phân quyền CMS. Vai trò nằm trên tài khoản biên tập (collection bien-tap-vien):
//   quan_tri — mọi thứ, kể cả tài khoản;  chu_bien — xuất bản, ký thẩm định, chỉnh tính năng;
//   bien_tap — viết/sửa NHÁP, không xuất bản;  may_doc — khoá API cho web đọc bản nháp khi xem trước, không vào được admin;
//   cong_tac_vien — chuyên gia / người dùng đóng góp bài (lộ trình chuyên gia, docs/KE-HOACH-CHUYEN-GIA.md): chỉ thấy và
//   sửa NHÁP CỦA CHÍNH MÌNH, gửi duyệt; không xuất bản, không đổi chữ ký E-E-A-T, không sửa bài người khác.
import type { Access, FieldAccess, PayloadRequest, Where } from "payload";
import { cookieHopLe, docCookie } from "./lib/totp";

export const VAI_TRO = [
  { label: "Quản trị", value: "quan_tri" },
  { label: "Chủ biên", value: "chu_bien" },
  { label: "Biên tập viên", value: "bien_tap" },
  { label: "Cộng tác viên / chuyên gia", value: "cong_tac_vien" },
  { label: "Máy đọc (khoá API cho web)", value: "may_doc" },
] as const;
export type VaiTro = (typeof VAI_TRO)[number]["value"];

/** CMS-2: tài khoản này phải qua xác thực 2 bước? (đã tự bật, hoặc Quản trị/Chủ biên khi CMS_BAT_BUOC_MFA=1) */
export const canMfa = (u: { vai_tro?: string; mfa_bat?: boolean | null }) =>
  u.mfa_bat === true || (process.env.CMS_BAT_BUOC_MFA === "1" && (u.vai_tro === "quan_tri" || u.vai_tro === "chu_bien"));

/** Vai trò CÓ HIỆU LỰC. Cần MFA mà chưa có cookie cms-mfa hợp lệ → null (không quyền gì, kể cả vào admin — Payload đưa
 *  sang màn xác thực 2 bước). Không áp cho khoá API (Máy đọc của web) và script máy chủ (Local API KHÔNG kèm cookie /
 *  Authorization — lưu ý: trang admin của Payload cũng chạy qua Local API nhưng mang cookie trình duyệt → vẫn bị kiểm). */
export const vaiTro = (req: PayloadRequest): VaiTro | null => {
  const u = req.user as { id?: string | number; collection?: string; vai_tro?: VaiTro; mfa_bat?: boolean | null; _strategy?: string } | null;
  if (!u || u.collection !== "bien-tap-vien") return null;
  const cookie = req.headers?.get?.("cookie") ?? null;
  const tuScript = req.payloadAPI === "local" && !cookie && !req.headers?.get?.("authorization");
  if (!tuScript && u._strategy !== "api-key" && canMfa(u) && !cookieHopLe(docCookie(cookie), u.id ?? "")) return null;
  return u.vai_tro ?? null;
};
const la = (...ds: VaiTro[]) => (req: PayloadRequest) => {
  const v = vaiTro(req);
  return Boolean(v && ds.includes(v));
};

export const laQuanTri = la("quan_tri");
export const laChuBien = la("quan_tri", "chu_bien");
export const laNguoiViet = la("quan_tri", "chu_bien", "bien_tap");
export const laCongTacVien = la("cong_tac_vien");
/** Ban biên tập nội bộ + máy đọc (thấy mọi bản nháp). Cộng tác viên KHÔNG thuộc nhóm này. */
export const laNoiBo = la("quan_tri", "chu_bien", "bien_tap", "may_doc");
export const daDangNhap = la("quan_tri", "chu_bien", "bien_tap", "may_doc", "cong_tac_vien");
/** Được tải ảnh lên (cộng tác viên cần ảnh cho bài của mình). */
export const taiAnh: Access = ({ req }) => laNguoiViet(req) || laCongTacVien(req);

export const ai: Access = () => true;
export const chiQuanTri: Access = ({ req }) => laQuanTri(req);
export const chiChuBien: Access = ({ req }) => laChuBien(req);
export const nguoiViet: Access = ({ req }) => laNguoiViet(req);

const xuatBan = (data: unknown) => (data as { _status?: string } | undefined)?._status === "published";
const cuaToi = (req: PayloadRequest, truong = "nguoi_tao"): Where => ({ [truong]: { equals: req.user!.id } });

/** Đọc bài: khách chỉ thấy bản đã xuất bản; ban biên tập (và máy đọc xem trước) thấy cả nháp;
 *  cộng tác viên thấy bài đã xuất bản + bài của chính mình. */
export const daXuatBanHoacNoiBo: Access = ({ req }): boolean | Where => {
  if (laNoiBo(req)) return true;
  if (laCongTacVien(req)) return { or: [{ _status: { equals: "published" } }, cuaToi(req)] };
  return { _status: { equals: "published" } };
};

/** Tạo bài: ban biên tập + cộng tác viên, chỉ Chủ biên được tạo thẳng ở trạng thái xuất bản. */
export const taoBai: Access = ({ req, data }) => {
  if (laChuBien(req)) return true;
  return (laNguoiViet(req) || laCongTacVien(req)) && !xuatBan(data);
};

/** Sửa bài: biên tập viên được lưu nháp, KHÔNG được xuất bản (Payload hỏi quyền xuất bản bằng data._status=published);
 *  cộng tác viên chỉ sửa nháp bài CỦA MÌNH (trả điều kiện → Payload lọc ở DB, không đoán được id bài người khác). */
export const suaBai: Access = ({ req, data }) => {
  if (laChuBien(req)) return true;
  if (xuatBan(data)) return false;
  if (laNguoiViet(req)) return true;
  return laCongTacVien(req) ? cuaToi(req) : false;
};

export const docPhienBan: Access = ({ req }) => {
  if (laNguoiViet(req)) return true;
  return laCongTacVien(req) ? cuaToi(req, "version.nguoi_tao") : false;
};

export const truongChuBien: FieldAccess = ({ req }) => laChuBien(req);
export const truongBienTap: FieldAccess = ({ req }) => laNguoiViet(req);
export const truongNoiBo: FieldAccess = ({ req }) => daDangNhap(req);
