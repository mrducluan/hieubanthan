// ND-0 — job "dong-bo-so-trang": mỗi ngày đọc sổ trang của web (/api/so-trang) và đồng bộ "Trang website" + "Mẫu cụm
// trang" (lib/so-trang.ts). Lịch: Vercel Cron gọi /api/payload-jobs/run 1 lần/ngày (vercel.json, gói Hobby) — Payload
// xếp job theo `schedule` rồi chạy luôn trong lượt đó. Nút "Đồng bộ ngay" trên danh sách chạy cùng hàm này.
import type { TaskConfig } from "payload";
import { dongBoSoTrang, laySoTrang } from "../lib/so-trang";

export const DongBoSoTrangTask: TaskConfig = {
  slug: "dong-bo-so-trang",
  label: "Đồng bộ sổ trang (Trang website)",
  retries: 1,
  schedule: [{ cron: "0 0 * * *", queue: "default" }],
  handler: async ({ req }) => {
    const kq = await dongBoSoTrang(req.payload, await laySoTrang());
    req.payload.logger.info({ msg: "[cms] đồng bộ sổ trang", ...kq });
    return { output: kq };
  },
};
