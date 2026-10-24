// BLOG-3b — nguồn đọc bài NotFair của CMS: khoá riêng → gọi thẳng; không có khoá riêng → đi qua web bằng bí mật chung.
import assert from "node:assert/strict";
import { test } from "node:test";
import { cauHinhGoi, nguonNotFair } from "./notfair-nguon.ts";

test("có NOTFAIR_SEO_API_KEY → gọi thẳng NotFair với Bearer", () => {
  const env = { NOTFAIR_SEO_API_KEY: "nfbl_x", CMS_WEBHOOK_SECRET: "bi", WEB_URL: "https://hieuban.com" , NODE_ENV: "test" } as NodeJS.ProcessEnv;
  assert.equal(nguonNotFair(env), "truc_tiep");
  const c = cauHinhGoi("?slug=a", env);
  assert.match(c.url, /^https:\/\/notfair\.co\/api\/seo\/content\?slug=a$/);
  assert.deepEqual(c.headers, { authorization: "Bearer nfbl_x" });
});

test("thiếu khoá riêng nhưng có bí mật chung + WEB_URL → đọc qua web /api/cms/notfair", () => {
  const env = { CMS_WEBHOOK_SECRET: "bi-mat", WEB_URL: "https://hieuban.com/" , NODE_ENV: "test" } as NodeJS.ProcessEnv;
  assert.equal(nguonNotFair(env), "qua_web");
  assert.deepEqual(cauHinhGoi("", env), { url: "https://hieuban.com/api/cms/notfair", headers: { "x-cms-bi-mat": "bi-mat" } });
  assert.equal(cauHinhGoi("?slug=x%C4%91", env).url, "https://hieuban.com/api/cms/notfair?slug=x%C4%91");
});

test("không có gì → không nguồn, gọi báo lỗi rõ", () => {
  const env = { WEB_URL: "https://hieuban.com" , NODE_ENV: "test" } as NodeJS.ProcessEnv;
  assert.equal(nguonNotFair(env), null);
  assert.throws(() => cauHinhGoi("", env), /NOTFAIR_SEO_API_KEY/);
});

