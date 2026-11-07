import assert from "node:assert/strict";
import { test } from "node:test";
import { dungBiMatChung } from "./bi-mat-chung.ts";

test("BLOG-9d: bí mật chung — đúng mới qua; thiếu / ngắn / sai đều không qua", () => {
  const env = { CMS_WEBHOOK_SECRET: "bi-mat-chung-dai-16+", NODE_ENV: "test" } as NodeJS.ProcessEnv;
  assert.equal(dungBiMatChung("bi-mat-chung-dai-16+", env), true);
  assert.equal(dungBiMatChung("bi-mat-chung-dai-16", env), false);
  assert.equal(dungBiMatChung(null, env), false);
  assert.equal(dungBiMatChung("x", { NODE_ENV: "test" } as NodeJS.ProcessEnv), false);
  assert.equal(dungBiMatChung("ngan", { CMS_WEBHOOK_SECRET: "ngan", NODE_ENV: "test" } as NodeJS.ProcessEnv), false);
});
