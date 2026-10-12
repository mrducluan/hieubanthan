// Vercel "Ignored Build Step" cho CMS: thoát 0 = BỎ QUA build, thoát 1 = BUILD.
// Chỉ build bản chính thức: bản Preview (nhánh PR) không có biến môi trường và nếu có thì `payload migrate` của nhánh PR
// sẽ chạy lên DB thật trước khi merge (docs/KIEN-TRUC-CMS.md mục 8d).
// Bản cũ dùng `[ "$VERCEL_ENV" != "production" ]` → trên Vercel bước này bỏ qua CẢ bản main (2026-10-12: CMS đứng ở
// bản #81 suốt 7 lần merge). Nay xét nhiều tín hiệu và in ra log để thấy ngay vì sao build / bỏ qua (không in bí mật).
const env = process.env.VERCEL_ENV || "";
const target = process.env.VERCEL_TARGET_ENV || "";
const nhanh = process.env.VERCEL_GIT_COMMIT_REF || "";
const NHANH_CHINH = process.env.CMS_NHANH_CHINH || "main";

const laChinh = env === "production" || target === "production" || nhanh === NHANH_CHINH;
const khongRo = !env && !target && !nhanh;
console.log(`[bo-qua-build] VERCEL_ENV=${env || "(trống)"} VERCEL_TARGET_ENV=${target || "(trống)"} nhánh=${nhanh || "(trống)"}`);
if (laChinh || khongRo) {
  // Không rõ môi trường → vẫn build: bỏ qua nhầm bản chính thức (CMS đứng im) tệ hơn build nhầm một bản Preview
  // (Preview không có biến môi trường → kiem-env dừng trước khi migrate).
  console.log(`[bo-qua-build] → BUILD${khongRo ? " (không đọc được môi trường — build cho chắc)" : ""}`);
  process.exit(1);
}
console.log("[bo-qua-build] → bỏ qua (bản Preview — kiểm thử CMS do GitHub Actions job cms đảm nhận)");
process.exit(0);
