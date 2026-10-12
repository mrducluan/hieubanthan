// CMS-4 — bài liên quan theo nghĩa phía web: dùng vectơ CMS tính sẵn; kết quả khớp hàm của CMS (cms/src/kiem-dinh/vecto.ts).
import { test, expect } from "@playwright/test";
import { doGiong, idfTu, xepLienQuan } from "../lib/lien-quan";
import { doGiong as doGiongCms, idfTu as idfCms, vectoVan } from "../../cms/src/kiem-dinh/vecto";

const v = (s: string) => vectoVan([[s, 4]]);

test("xếp liên quan: gần nghĩa trước, cùng mảng phá hoà, bỏ chính nó; khớp hàm CMS", () => {
  const goc = { slug: "a", mang: "than_so", vecto: v("số chủ đạo 7 trong tình yêu") };
  const ds = [
    goc,
    { slug: "b", mang: "tu_vi", vecto: v("hướng nhà mệnh quái bát trạch") },
    { slug: "c", mang: "than_so", vecto: v("số chủ đạo 7 hợp nghề gì") },
    { slug: "d", mang: "than_so", vecto: null },
  ];
  expect(xepLienQuan(goc, ds).map((b) => b.slug)).toEqual(["c", "d", "b"]);
  const idf = idfTu(ds.map((b) => b.vecto ?? {})), idf2 = idfCms(ds.map((b) => b.vecto ?? {}));
  expect(doGiong(goc.vecto, ds[2]!.vecto!, idf)).toBeCloseTo(doGiongCms(goc.vecto, ds[2]!.vecto!, idf2), 10);
});
