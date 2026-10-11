// Tài khoản ban biên tập (đăng nhập /admin). Tách hẳn khỏi tài khoản người dùng web (Supabase).
import { APIError, type CollectionConfig } from "payload";
import { VAI_TRO, chiQuanTri, daDangNhap, laQuanTri } from "../access";

const MAT_KHAU_TOI_THIEU = 12;

export const BienTapVien: CollectionConfig = {
  slug: "bien-tap-vien",
  labels: { singular: "Thành viên ban biên tập", plural: "Ban biên tập" },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["ten_hien_thi", "email", "vai_tro", "updatedAt"],
    group: "Hệ thống",
    description: "Tài khoản đăng nhập CMS. Mỗi người một tài khoản; không dùng chung mật khẩu.",
  },
  auth: {
    tokenExpiration: 8 * 60 * 60,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    useAPIKey: true,
    cookies: { sameSite: "Lax", secure: process.env.NODE_ENV === "production" },
  },
  access: {
    // Tài khoản đầu tiên đi qua màn "tạo tài khoản đầu tiên" của Payload (bỏ qua access) — hook bên dưới khoá
    // email (env CMS_EMAIL_QUAN_TRI) + vai trò quản trị cho lần đó.
    create: chiQuanTri,
    read: ({ req }) => (laQuanTri(req) ? true : req.user ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => (laQuanTri(req) ? true : req.user ? { id: { equals: req.user.id } } : false),
    delete: chiQuanTri,
    admin: ({ req }) => daDangNhap(req) && (req.user as { vai_tro?: string }).vai_tro !== "may_doc",
    unlock: chiQuanTri,
  },
  hooks: {
    beforeOperation: [
      ({ args, operation }) => {
        const mk = (args as { data?: { password?: unknown } }).data?.password;
        if ((operation === "create" || operation === "update" || operation === "resetPassword")
            && typeof mk === "string" && mk.length < MAT_KHAU_TOI_THIEU) {
          throw new APIError(`Mật khẩu cần ít nhất ${MAT_KHAU_TOI_THIEU} ký tự.`, 400, null, true);
        }
        return args;
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        // Script máy chủ (Local API) là tin cậy; chặn chỉ áp cho yêu cầu qua mạng khi CHƯA đăng nhập
        // (= màn "tạo tài khoản đầu tiên") — chỉ được là tài khoản đầu tiên.
        if (operation !== "create" || req.user || req.payloadAPI === "local") return data;
        const { totalDocs } = await req.payload.count({ collection: "bien-tap-vien", overrideAccess: true });
        if (totalDocs > 0) throw new APIError("Đã có tài khoản quản trị. Nhờ quản trị cấp tài khoản.", 403, null, true);
        const cho = (process.env.CMS_EMAIL_QUAN_TRI || "").trim().toLowerCase();
        if (!cho && process.env.NODE_ENV === "production") {
          throw new APIError("Chưa đặt CMS_EMAIL_QUAN_TRI — không cho tạo tài khoản đầu tiên trên máy chủ thật.", 403, null, true);
        }
        if (cho && String(data.email ?? "").trim().toLowerCase() !== cho) {
          throw new APIError("Email này không phải email quản trị đã khai báo.", 403, null, true);
        }
        return { ...data, vai_tro: "quan_tri" };
      },
    ],
  },
  fields: [
    { name: "ten_hien_thi", label: "Tên hiển thị", type: "text", required: true },
    {
      name: "vai_tro", label: "Vai trò", type: "select", required: true, defaultValue: "bien_tap",
      options: [...VAI_TRO],
      access: { update: ({ req }) => laQuanTri(req) },
      admin: {
        position: "sidebar",
        description: "Biên tập viên lưu nháp; Chủ biên xuất bản và ký thẩm định; Máy đọc chỉ để web xem trước nháp.",
      },
    },
  ],
};
