// QT-1: lõi sửa kho tri thức — chạy trên MỌI file KB thật: chỉ đúng chuỗi được sửa đổi, phần còn lại giữ từng byte.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { apDungSua, chiMucChuoi, khoaDuong } from "../lib/kb-sua";

const THU_MUC = path.join(__dirname, "..", "..", "engine", "app", "kb", "data");
const TEP = readdirSync(THU_MUC).filter((f) => f.endsWith(".json"));

/** Mọi chuỗi giá trị theo đường dẫn, đọc bằng JSON.parse — đối chứng độc lập với bộ quét. */
function chuoiThat(o: unknown, d: (string | number)[] = [], ra = new Map<string, string>()): Map<string, string> {
  if (typeof o === "string") ra.set(khoaDuong(d), o);
  else if (Array.isArray(o)) o.forEach((x, i) => chuoiThat(x, [...d, i], ra));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) chuoiThat(v, [...d, k], ra);
  return ra;
}

test("bộ quét tìm đúng mọi chuỗi giá trị của từng file KB (so với JSON.parse)", () => {
  expect(TEP.length).toBeGreaterThan(10);
  for (const f of TEP) {
    const t = readFileSync(path.join(THU_MUC, f), "utf8");
    const quet = chiMucChuoi(t), that = chuoiThat(JSON.parse(t));
    expect(quet.size, f).toBe(that.size);
    for (const [k, v] of that) expect(quet.get(k)?.giaTri, `${f} ${k}`).toBe(v);
  }
});

test("sửa một chuỗi: chỉ đổi đúng đoạn đó, file vẫn hợp lệ, phần khác giữ nguyên từng ký tự", () => {
  for (const f of TEP) {
    const t = readFileSync(path.join(THU_MUC, f), "utf8");
    const ds = [...chiMucChuoi(t)];
    const [k, vt] = ds[Math.floor(ds.length / 2)]!;
    const moi = `${vt.giaTri} — đã sửa "thử" \\ xuống\ndòng`;
    const ra = apDungSua(t, [{ duong: JSON.parse(k), cu: vt.giaTri, moi }]);
    expect(ra.slice(0, vt.dau), f).toBe(t.slice(0, vt.dau));
    expect(ra.slice(ra.length - (t.length - vt.cuoi)), f).toBe(t.slice(vt.cuoi));
    expect(chuoiThat(JSON.parse(ra)).get(k), f).toBe(moi);
  }
});

test("chặn: sai giá trị cũ, đường dẫn không phải chuỗi, để trống, sửa trùng", () => {
  const t = '{\n "a": {"b": "x", "n": 3},\n "c": ["y", "z"]\n}\n';
  expect(() => apDungSua(t, [{ duong: ["a", "b"], cu: "khac", moi: "m" }])).toThrow(/đã khác/);
  expect(() => apDungSua(t, [{ duong: ["a", "n"], cu: "3", moi: "4" }])).toThrow(/Không có chuỗi/);
  expect(() => apDungSua(t, [{ duong: ["c", 0], cu: "y", moi: "  " }])).toThrow(/trống/);
  expect(() => apDungSua(t, [{ duong: ["c", 1], cu: "z", moi: "1" }, { duong: ["c", 1], cu: "z", moi: "2" }])).toThrow(/trùng/);
  expect(apDungSua(t, [{ duong: ["c", 1], cu: "z", moi: "Ž" }, { duong: ["a", "b"], cu: "x", moi: "xx" }]))
    .toBe('{\n "a": {"b": "xx", "n": 3},\n "c": ["y", "Ž"]\n}\n');
});
