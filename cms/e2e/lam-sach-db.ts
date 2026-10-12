// Trước mỗi lượt e2e: xoá sạch dữ liệu CMS trong DB thử (schema "cms") → luồng "tài khoản đầu tiên" chạy lại được.
// Chỉ chạy trên DB có tên chứa "e2e" — không bao giờ đụng DB khác.
import pg from "pg";
import { DB_E2E } from "../playwright.config";

export default async function lamSach() {
  if (!/e2e/.test(new URL(DB_E2E).pathname)) throw new Error("DB e2e phải có chữ 'e2e' trong tên");
  const ten = new URL(DB_E2E).pathname.slice(1);
  const goc = new URL(DB_E2E); goc.pathname = "/postgres";
  const qt = new pg.Client({ connectionString: goc.toString() });
  await qt.connect();
  const co = await qt.query("select 1 from pg_database where datname = $1", [ten]);
  if (!co.rowCount) await qt.query(`create database "${ten}"`);
  await qt.end();
  const c = new pg.Client({ connectionString: DB_E2E });
  await c.connect();
  // Giữ cấu trúc (máy chủ đang chạy dùng nó), chỉ xoá dữ liệu.
  const bang = await c.query("select tablename from pg_tables where schemaname = 'cms' and tablename <> 'payload_migrations'");
  if (bang.rowCount) await c.query(`truncate ${bang.rows.map((r) => `"cms"."${r.tablename}"`).join(", ")} restart identity cascade`);
  await c.end();
}
