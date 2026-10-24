// `payload migrate` khi build trên Vercel. Ưu tiên cổng Session 5432 (CMS_DB_CHE_DO=phien). Nếu Session pooler của
// Supabase đã đầy (EMAXCONNSESSION — bản hàm cũ còn giữ kết nối, sự cố 2026-10-24: build hỏng → CMS kẹt ở bản cũ) thì
// chạy lại qua cổng Transaction 6543 (`src/lib/chuoi-db.ts`) — migration của CMS đã thử chạy trọn qua chế độ này.
import { spawnSync } from "node:child_process";

function chay(env) {
  const r = spawnSync("npx", ["payload", "migrate"], { env: { ...process.env, ...env }, encoding: "utf8" });
  process.stdout.write(r.stdout ?? "");
  process.stderr.write(r.stderr ?? "");
  return { ok: r.status === 0, ra: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

const lan1 = chay({ CMS_DB_CHE_DO: "phien" });
if (lan1.ok) process.exit(0);
if (!/EMAXCONNSESSION|max clients reached/i.test(lan1.ra)) process.exit(1);
console.log("[migrate] Session pooler đầy → chạy lại qua cổng Transaction 6543");
process.exit(chay({ CMS_DB_CHE_DO: "" }).ok ? 0 : 1);
