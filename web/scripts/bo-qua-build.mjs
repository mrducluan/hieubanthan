// Vercel "Ignored Build Step" cho WEB: thoát 0 = BỎ QUA build, thoát 1 = BUILD.
// SỰ CỐ-VERCEL (2026-11-02): mỗi lần đẩy commit (main + mọi nhánh preview) đều dựng lại web, kể cả commit chỉ sửa
// engine / CMS / tài liệu — tốn phút build của gói Vercel vô ích. Web không đọc tệp nào ngoài thư mục web/ (engine gọi
// qua HTTP), nên chỉ build khi có thay đổi trong web/ kể từ lần deploy thành công trước của nhánh.
// Không chắc (thiếu mốc so, clone nông, git lỗi) → BUILD: build thừa một lần tốt hơn bỏ sót bản chính thức.
import { execFileSync } from "node:child_process";

const truoc = process.env.VERCEL_GIT_PREVIOUS_SHA || "HEAD^";
const nhanh = process.env.VERCEL_GIT_COMMIT_REF || "(trống)";
console.log(`[bo-qua-build] nhánh=${nhanh} so với=${truoc}`);
try {
  execFileSync("git", ["diff", "--quiet", truoc, "HEAD", "--", "."], { stdio: "inherit" });
  console.log("[bo-qua-build] → bỏ qua (không có thay đổi trong web/)");
  process.exit(0);
} catch (e) {
  const ma = typeof e?.status === "number" ? e.status : -1;
  console.log(ma === 1 ? "[bo-qua-build] → BUILD (web/ có thay đổi)" : "[bo-qua-build] → BUILD (không so được — build cho chắc)");
  process.exit(1);
}
