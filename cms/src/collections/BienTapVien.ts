// Tài khoản ban biên tập (đăng nhập /admin). Tách hẳn khỏi tài khoản người dùng web (Supabase).
import { APIError, type CollectionConfig } from "payload";
import { VAI_TRO, canMfa, chiQuanTri, daDangNhap, laQuanTri } from "../access";
import { THOI_HAN_GIAY, TEN_COOKIE, cookieHopLe, docCookie, giaiMa, kiemMa, maHoa, taoBiMat, taoCookie, uriOtp, base32 } from "../lib/totp";

type NguoiMfa = { id: number | string; email?: string; vai_tro?: string; mfa_bat?: boolean | null; collection?: string };
const nguoi = (u: unknown) => (u && (u as NguoiMfa).collection === "bien-tap-vien" ? (u as NguoiMfa) : null);
const SAI_TOI_DA = 5, KHOA_PHUT = 15;

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
  // CMS-2: xác thực 2 bước (TOTP). Màn /admin/xac-thuc-2-buoc (components/XacThuc) gọi các endpoint dưới đây bằng
  // phiên đăng nhập (chưa cần MFA). Bắt buộc với Quản trị/Chủ biên khi env CMS_BAT_BUOC_MFA=1; ai cũng tự bật được.
  endpoints: [
    {
      path: "/mfa/trang-thai", method: "get",
      handler: async (req) => {
        const u = nguoi(req.user);
        if (!u) return Response.json({ loi: "Cần đăng nhập" }, { status: 401 });
        return Response.json({ email: u.email, can: canMfa(u), da_bat: Boolean(u.mfa_bat),
          da_xac_thuc: cookieHopLe(docCookie(req.headers.get("cookie")), u.id), may_doc: u.vai_tro === "may_doc" });
      },
    },
    {
      // Bắt đầu bật: tạo bí mật mới (chỉ khi CHƯA bật) — trả chuỗi bí mật + link otpauth để thêm vào app xác thực.
      path: "/mfa/bat-dau", method: "post",
      handler: async (req) => {
        const u = nguoi(req.user);
        if (!u) return Response.json({ loi: "Cần đăng nhập" }, { status: 401 });
        if (u.mfa_bat) return Response.json({ loi: "Đã bật xác thực 2 bước." }, { status: 409 });
        const bi = taoBiMat();
        await req.payload.update({ collection: "bien-tap-vien", id: u.id, overrideAccess: true, context: { mfa: true },
          data: { mfa_bi_mat: maHoa(bi), mfa_buoc_cuoi: 0, mfa_sai: 0 } as never });
        return Response.json({ bi_mat: base32(bi).replace(/(.{4})/g, "$1 ").trim(), uri: uriOtp(bi, u.email ?? "") });
      },
    },
    {
      // Nhập mã 6 số: đúng → (bật nếu đang bật lần đầu) + cookie cms-mfa 8 giờ. Sai 5 lần → khoá 15 phút. Chặn dùng lại mã.
      path: "/mfa/xac-nhan", method: "post",
      handler: async (req) => {
        const u = nguoi(req.user);
        if (!u) return Response.json({ loi: "Cần đăng nhập" }, { status: 401 });
        const body = (typeof req.json === "function" ? await req.json().catch(() => ({})) : {}) as { ma?: unknown };
        const doc = await req.payload.findByID({ collection: "bien-tap-vien", id: u.id, overrideAccess: true, showHiddenFields: true, depth: 0 }) as unknown as
          { mfa_bi_mat?: string | null; mfa_buoc_cuoi?: number | null; mfa_sai?: number | null; mfa_khoa_den?: string | null; mfa_bat?: boolean };
        if (doc.mfa_khoa_den && Date.parse(doc.mfa_khoa_den) > Date.now()) {
          return Response.json({ loi: `Nhập sai nhiều lần. Thử lại sau ${KHOA_PHUT} phút.` }, { status: 429 });
        }
        const bi = doc.mfa_bi_mat ? giaiMa(doc.mfa_bi_mat) : null;
        if (!bi) return Response.json({ loi: "Chưa bắt đầu bật xác thực 2 bước." }, { status: 409 });
        const buoc = kiemMa(bi, String(body.ma ?? "").replace(/\s/g, ""), doc.mfa_buoc_cuoi ?? -1);
        if (buoc === null) {
          const sai = (doc.mfa_sai ?? 0) + 1;
          await req.payload.update({ collection: "bien-tap-vien", id: u.id, overrideAccess: true, context: { mfa: true },
            data: { mfa_sai: sai >= SAI_TOI_DA ? 0 : sai, mfa_khoa_den: sai >= SAI_TOI_DA ? new Date(Date.now() + KHOA_PHUT * 60_000).toISOString() : null } as never });
          return Response.json({ loi: "Mã không đúng hoặc đã dùng. Lấy mã mới trong app xác thực." }, { status: 400 });
        }
        await req.payload.update({ collection: "bien-tap-vien", id: u.id, overrideAccess: true, context: { mfa: true },
          data: { mfa_bat: true, mfa_buoc_cuoi: buoc, mfa_sai: 0, mfa_khoa_den: null } as never });
        const bao = process.env.NODE_ENV === "production" ? "; Secure" : "";
        return Response.json({ ok: true }, { headers: {
          "set-cookie": `${TEN_COOKIE}=${taoCookie(u.id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${THOI_HAN_GIAY}${bao}`,
        } });
      },
    },
    {
      // Quản trị đặt lại MFA cho người mất điện thoại (người đó đăng nhập lại sẽ bật lại từ đầu).
      path: "/mfa/dat-lai", method: "post",
      handler: async (req) => {
        if (!laQuanTri(req)) return Response.json({ loi: "Chỉ Quản trị (đã xác thực 2 bước)." }, { status: 403 });
        const body = (typeof req.json === "function" ? await req.json().catch(() => ({})) : {}) as { id?: unknown };
        if (typeof body.id !== "number" && typeof body.id !== "string") return Response.json({ loi: "Thiếu id" }, { status: 422 });
        await req.payload.update({ collection: "bien-tap-vien", id: body.id, overrideAccess: true, context: { mfa: true },
          data: { mfa_bat: false, mfa_bi_mat: null, mfa_buoc_cuoi: 0, mfa_sai: 0, mfa_khoa_den: null } as never });
        return Response.json({ ok: true });
      },
    },
  ],
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
      // Chỉ đổi qua endpoint /mfa/* (overrideAccess). Người dùng đọc được trạng thái của mình.
      name: "mfa_bat", label: "Xác thực 2 bước", type: "checkbox", defaultValue: false,
      access: { create: () => false, update: () => false },
      admin: { position: "sidebar", readOnly: true, description: "Bật ở màn đăng nhập (/admin/xac-thuc-2-buoc). Quản trị đặt lại khi mất điện thoại." },
    },
    { name: "mfa_bi_mat", type: "text", hidden: true, access: { read: () => false, create: () => false, update: () => false } },
    { name: "mfa_buoc_cuoi", type: "number", hidden: true, access: { read: () => false, create: () => false, update: () => false } },
    { name: "mfa_sai", type: "number", hidden: true, access: { read: () => false, create: () => false, update: () => false } },
    { name: "mfa_khoa_den", type: "date", hidden: true, access: { read: () => false, create: () => false, update: () => false } },
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
