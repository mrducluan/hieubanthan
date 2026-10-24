import assert from "node:assert/strict";
import { test } from "node:test";
import { chuoiDb } from "./chuoi-db.ts";

const PHIEN = "postgresql://postgres.abc:matkhau1@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

test("pooler Supabase cổng 5432 → 6543 khi chạy", () => {
  assert.equal(chuoiDb(PHIEN, {}), PHIEN.replace(":5432/", ":6543/"));
  assert.equal(chuoiDb(PHIEN.replace(":5432", ""), {}), PHIEN.replace(":5432/", ":6543/"));
  assert.equal(chuoiDb(` ${PHIEN}\n`, {}), PHIEN.replace(":5432/", ":6543/"));
});

test("migrate giữ cổng Session; có công tắc tắt", () => {
  assert.equal(chuoiDb(PHIEN, { CMS_DB_CHE_DO: "phien" }), PHIEN);
  assert.equal(chuoiDb(PHIEN, { CMS_DB_GIAO_DICH: "0" }), PHIEN);
});

test("chuỗi khác để nguyên", () => {
  const giaoDich = PHIEN.replace(":5432/", ":6543/");
  assert.equal(chuoiDb(giaoDich, {}), giaoDich);
  assert.equal(chuoiDb("postgres://postgres:postgres@localhost:5432/cms", {}), "postgres://postgres:postgres@localhost:5432/cms");
  assert.equal(chuoiDb("khong-phai-url", {}), "khong-phai-url");
});
