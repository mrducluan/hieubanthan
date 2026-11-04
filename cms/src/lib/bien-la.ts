// 6b-6 — biến {x} trong chữ KHỐI không thuộc danh sách biến của mẫu cụm = lỗi chặn xuất bản (trước chỉ cảnh báo): web bỏ
// hẳn khối còn biến lạ thay vì hiện chữ "{nam}" trần. "Chữ trên trang" có bảng biến riêng từng trang nên không xét ở đây.
// Thuần (không import), test bằng node --test.

export function bienLa(van: string, bien: string[]): string[] {
  const co = new Set(bien);
  return [...new Set([...van.matchAll(/\{([a-z_]+)\}/g)].map((m) => m[1]!))].filter((b) => !co.has(b));
}

export function mucBienLa(chuKhoi: string, bien: string[]) {
  const la = bienLa(chuKhoi, bien);
  if (!la.length) return [];
  const dung = bien.length ? bien.map((b) => `{${b}}`).join(", ") : "(không có)";
  return [{ ma: "bien_la", nhom: "noi_dung" as const, muc_do: "loi" as const, chan: true,
    thong_diep: `Khối dùng biến không có trong mẫu này: ${la.map((b) => `{${b}}`).join(", ")} — biến dùng được: ${dung}. Web sẽ không hiện khối có biến lạ.` }];
}
