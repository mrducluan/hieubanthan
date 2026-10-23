// Tài khoản ban biên tập (đăng nhập /admin). Tách hẳn khỏi tài khoản người dùng web (Supabase).
import { sql } from "@payloadcms/db-postgres";
import { APIError, type CollectionConfig } from "payload";
import { VAI_TRO, canMfa, chiQuanTri, daDangNhap, laQuanTri, vaiTro } from "../access";
import { THOI_HAN_GIAY, TEN_COOKIE, cookieHopLe, docCookie, giaiMa, kiemMa, maHoa, taoBiMat, taoCookie, uriOtp, base32 } from "../lib/totp";

type NguoiMfa = { id: number | string; email?: string; vai_tro?: string; mfa_bat?: boolean | null; collection?: string; _sid?: string };
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
    // SEC-2: tự sửa tài khoản mình (mật khẩu, email, khoá API) cần vai trò CÓ HIỆU LỰC — phiên mới có mật khẩu, chưa qua
    // mã 2 bước thì không đổi được gì (không khoá được chủ thật ra ngoài).
    update: ({ req }) => (laQuanTri(req) ? true : vaiTro(req) ? { id: { equals: req.user!.id } } : false),
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
        // co_vai_tro: tài khoản biên tập hợp lệ (không phải Máy đọc) → được TỰ bật 2 bước kể cả khi chưa bắt buộc
        // (trước đây màn 2 bước chỉ mở khi `can` → Quản trị không bật trước được để rồi mới đặt CMS_BAT_BUOC_MFA=1).
        const coVaiTro = Boolean(u.vai_tro && u.vai_tro !== "may_doc" && VAI_TRO.some((v) => v.value === u.vai_tro));
        return Response.json({ email: u.email, can: canMfa(u), da_bat: Boolean(u.mfa_bat), co_vai_tro: coVaiTro,
          da_xac_thuc: cookieHopLe(docCookie(req.headers.get("cookie")), u.id, u._sid), may_doc: u.vai_tro === "may_doc" });
      },
    },
    {
      // Bắt đầu bật: tạo bí mật mới (chỉ khi CHƯA bật) — trả chuỗi bí mật + link otpauth để thêm vào app xác thực.
      path: "/mfa/bat-dau", method: "post",
      handler: async (req) => {
        const u = nguoi(req.user);
        if (!u) return Response.json({ loi: "Cần đăng nhập" }, { status: 401 });
        if (u.mfa_bat) return Response.json({ loi: "Đã bật xác thực 2 bước." }, { status: 409 });
        if (u.vai_tro === "may_doc") return Response.json({ loi: "Tài khoản Máy đọc không đăng nhập giao diện." }, { status: 403 });
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
        // SEC-2: GIỮ CHỖ một lượt thử NGUYÊN TỬ trong SQL trước khi kiểm mã — gửi song song N yêu cầu cũng chỉ được 5 lượt
        // / 15 phút (trước đây đọc mfa_sai rồi ghi +1 ở bước sau → N yêu cầu cùng lúc = N lượt đoán).
        const db = req.payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> } };
        const giu = await db.drizzle.execute(sql`
          update cms.bien_tap_vien set
            mfa_sai = case when coalesce(mfa_sai, 0) + 1 >= ${SAI_TOI_DA} then 0 else coalesce(mfa_sai, 0) + 1 end,
            mfa_khoa_den = case when coalesce(mfa_sai, 0) + 1 >= ${SAI_TOI_DA}
              then now() + make_interval(mins => ${KHOA_PHUT}) else mfa_khoa_den end
          where id = ${u.id} and (mfa_khoa_den is null or mfa_khoa_den <= now())
          returning mfa_bi_mat, mfa_buoc_cuoi`);
        const doc = giu.rows[0] as { mfa_bi_mat?: string | null; mfa_buoc_cuoi?: number | null } | undefined;
        if (!doc) return Response.json({ loi: `Nhập sai nhiều lần. Thử lại sau ${KHOA_PHUT} phút.` }, { status: 429 });
        const bi = doc.mfa_bi_mat ? giaiMa(doc.mfa_bi_mat) : null;
        if (!bi) return Response.json({ loi: "Chưa bắt đầu bật xác thực 2 bước." }, { status: 409 });
        const buoc = kiemMa(bi, String(body.ma ?? "").replace(/\s/g, ""), Number(doc.mfa_buoc_cuoi ?? -1));
        if (buoc === null) return Response.json({ loi: "Mã không đúng hoặc đã dùng. Lấy mã mới trong app xác thực." }, { status: 400 });
        // Đúng mã: ghi bước (chặn dùng lại — cũng nguyên tử: hai yêu cầu cùng mã chỉ một cái qua), xoá đếm sai.
        const xong = await db.drizzle.execute(sql`
          update cms.bien_tap_vien set mfa_bat = true, mfa_buoc_cuoi = ${buoc}, mfa_sai = 0, mfa_khoa_den = null
          where id = ${u.id} and coalesce(mfa_buoc_cuoi, -1) < ${buoc} returning id`);
        if (!xong.rows.length) return Response.json({ loi: "Mã không đúng hoặc đã dùng. Lấy mã mới trong app xác thực." }, { status: 400 });
        const bao = process.env.NODE_ENV === "production" ? "; Secure" : "";
        return Response.json({ ok: true }, { headers: {
          "set-cookie": `${TEN_COOKIE}=${taoCookie(u.id, u._sid)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${THOI_HAN_GIAY}${bao}`,
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
    // SEC-2: khoá API không bao giờ trả ra cho ai ngoài Quản trị (kể cả chính chủ tài khoản).
    afterRead: [
      ({ doc, req }) => {
        if (!laQuanTri(req) && doc && typeof doc === "object") delete (doc as { apiKey?: unknown }).apiKey;
        return doc;
      },
    ],
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
      ({ data, originalDoc, req }) => {
        // SEC-2: bật / đổi khoá API chỉ Quản trị (đã qua MFA) hoặc script máy chủ — khoá API là lối đăng nhập thứ hai.
        if (req.payloadAPI === "local" && !req.headers?.get?.("cookie") && !req.headers?.get?.("authorization")) return data;
        // Màn "tạo tài khoản đầu tiên" (chưa đăng nhập) gửi kèm ô API Key rỗng — hook bên dưới khoá email + vai trò lần đó.
        if (!req.user && !originalDoc) return data;
        const d = data as { enableAPIKey?: unknown; apiKey?: unknown };
        const cu = (originalDoc ?? {}) as { enableAPIKey?: unknown; apiKey?: unknown };
        // Chỉ tính là đổi khi BẬT khoá hoặc đặt một khoá KHÁC RỖNG mới (form gửi kèm ô trống / tắt khoá là bình thường).
        const doi = (d.enableAPIKey === true && !cu.enableAPIKey)
          || (typeof d.apiKey === "string" && d.apiKey !== "" && d.apiKey !== cu.apiKey);
        if (doi && !laQuanTri(req)) throw new APIError("Chỉ Quản trị (đã xác thực 2 bước) được bật hoặc đổi khoá API.", 403, null, true);
        return data;
      },
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
