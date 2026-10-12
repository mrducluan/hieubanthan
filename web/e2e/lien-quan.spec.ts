// CMS-4 — bài liên quan theo nghĩa phía web: dùng vectơ CMS tính sẵn (cms/src/kiem-dinh/vecto.ts, có test riêng).
import { test, expect } from "@playwright/test";
import { doGiong, idfTu, xepLienQuan, type Vecto } from "../lib/lien-quan";

type B = { slug: string; mang: string; vecto: Vecto | null };

test("xếp liên quan: gần nghĩa trước, cùng mảng phá hoà, bỏ chính nó; idf giảm từ phổ biến", () => {
  const goc: B = { slug: "a", mang: "than_so", vecto: { "số": 4, "chủ đạo": 6, "tình yêu": 6 } };
  const ds: B[] = [
    goc,
    { slug: "b", mang: "tu_vi", vecto: { "hướng nhà": 6, "mệnh quái": 6 } },
    { slug: "c", mang: "than_so", vecto: { "số": 4, "chủ đạo": 6, "nghề": 4 } },
    { slug: "d", mang: "than_so", vecto: null },
  ];
  expect(xepLienQuan(goc, ds).map((b) => b.slug)).toEqual(["c", "d", "b"]);
  const idf = idfTu([{ "số": 1, "a": 1 }, { "số": 1 }]);
  expect(idf("số")).toBeLessThan(idf("a"));
  expect(doGiong({ x: 1 }, {})).toBe(0);
  expect(doGiong({ x: 1, y: 1 }, { x: 1, y: 1 })).toBeCloseTo(1, 10);
});
