// CMS Hiểu Bản Thân — Payload 3 (headless). Thiết kế: docs/KIEN-TRUC-CMS.md.
// Chạy riêng ở cms.hieuban.com; web hieuban.com chỉ ĐỌC qua REST (web/lib/cms.ts). Kho tri thức engine vẫn ở git.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { en } from "@payloadcms/translations/languages/en";
import { vi } from "@payloadcms/translations/languages/vi";
import { buildConfig } from "payload";
import sharp from "sharp";
import { BaiViet } from "./collections/BaiViet";
import { BienTapVien } from "./collections/BienTapVien";
import { ChuyenMuc } from "./collections/ChuyenMuc";
import { Media } from "./collections/Media";
import { TacGia } from "./collections/TacGia";
import { TinhNang } from "./globals/TinhNang";
import { slugViet } from "./kiem-dinh/kiem-dinh";
import { webUrl } from "./lib/web";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsUrl = (process.env.CMS_URL || "http://localhost:3001").replace(/\/+$/, "");

// Ảnh: Supabase Storage qua giao thức S3 (bucket công khai) khi đủ biến; thiếu → lưu đĩa (chỉ dùng lúc chạy máy).
const s3 = {
  bucket: process.env.S3_BUCKET || "",
  endpoint: process.env.S3_ENDPOINT || "",
  region: process.env.S3_REGION || "ap-southeast-1",
  key: process.env.S3_ACCESS_KEY_ID || "",
  secret: process.env.S3_SECRET_ACCESS_KEY || "",
  public: (process.env.S3_PUBLIC_URL || "").replace(/\/+$/, ""),
};
const coS3 = Boolean(s3.bucket && s3.endpoint && s3.key && s3.secret);

export default buildConfig({
  serverURL: cmsUrl,
  secret: process.env.PAYLOAD_SECRET || "",
  admin: {
    user: BienTapVien.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: " · CMS Hiểu Bản Thân",
      description: "Phòng biên tập Hiểu Bản Thân",
      robots: "noindex, nofollow",
      icons: [{ rel: "icon", type: "image/svg+xml", url: "/icon.svg" }],
    },
    dateFormat: "dd/MM/yyyy HH:mm",
    avatar: "default",   // không dùng Gravatar (gửi mã băm email biên tập viên ra máy chủ ngoài)
    components: {
      graphics: { Logo: "/components/ThuongHieu#Logo", Icon: "/components/ThuongHieu#Icon" },
      beforeDashboard: ["/components/TongQuan#TongQuan"],
      beforeLogin: ["/components/TruocDangNhap#TruocDangNhap"],
    },
  },
  i18n: { supportedLanguages: { vi, en }, fallbackLanguage: "vi" },
  collections: [BaiViet, ChuyenMuc, TacGia, Media, BienTapVien],
  globals: [TinhNang],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: (process.env.DATABASE_URI || "").trim() },
    // Bảng CMS nằm trong schema riêng "cms" — không lẫn với bảng của web (public) trên cùng Supabase.
    schemaName: "cms",
    migrationDir: path.resolve(dirname, "migrations"),
    // Máy chủ thật chỉ đổi cấu trúc bằng migration (có down) — không tự "push".
    push: process.env.NODE_ENV !== "production" && process.env.CMS_DB_PUSH !== "0",
  }),
  sharp,
  graphQL: { disable: true },
  upload: { limits: { fileSize: 5_000_000 } },
  cors: [webUrl()],
  csrf: [cmsUrl, webUrl()],
  // Lịch xuất bản: Vercel Cron gọi /api/payload-jobs/run với Authorization: Bearer CRON_SECRET.
  jobs: {
    access: {
      run: ({ req }) => {
        if (req.user) return true;
        const bi = process.env.CRON_SECRET;
        return Boolean(bi) && req.headers.get("authorization") === `Bearer ${bi}`;
      },
    },
  },
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  telemetry: false,
  plugins: [
    seoPlugin({
      uploadsCollection: "media",
      generateTitle: ({ doc }) => String((doc as { tieu_de?: string }).tieu_de ?? "").slice(0, 60),
      generateDescription: ({ doc }) => {
        const d = doc as { tra_loi_nhanh?: string; mo_ta_ngan?: string };
        const s = (d.mo_ta_ngan || d.tra_loi_nhanh || "").replace(/\s+/g, " ").trim();
        return s.length > 158 ? s.slice(0, s.lastIndexOf(" ", 155)) + "…" : s;
      },
      generateImage: ({ doc }) => {
        const a = (doc as { anh_bia?: number | { id: number } }).anh_bia;
        return typeof a === "object" && a ? a.id : (a as number);
      },
      generateURL: ({ doc }) => `${webUrl()}/blog/${(doc as { slug?: string }).slug || slugViet(String((doc as { tieu_de?: string }).tieu_de ?? ""))}`,
    }),
    s3Storage({
      enabled: coS3,
      bucket: s3.bucket,
      collections: {
        media: {
          prefix: "cms",
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => `${s3.public}/${prefix ? `${prefix}/` : ""}${filename}`,
        },
      },
      config: {
        endpoint: s3.endpoint,
        region: s3.region,
        forcePathStyle: true,
        credentials: { accessKeyId: s3.key, secretAccessKey: s3.secret },
      },
    }),
  ],
});
