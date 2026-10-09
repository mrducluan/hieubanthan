// QT-1 — sửa kho tri thức (engine/app/kb/data/*.json) KHÔNG chạm định dạng file: tìm đúng vị trí chuỗi trong văn bản
// gốc rồi thay riêng chuỗi đó. Ghi lại cả file bằng JSON.stringify sẽ đổi định dạng (nhiều file có object viết gọn
// một dòng) → PR đầy dòng thay đổi vô nghĩa. Chỉ sửa GIÁ TRỊ CHUỖI đã có: không thêm/xoá khoá, không đổi kiểu —
// đổi cấu trúc là việc của kỹ sư (engine + test). Hàm thuần, chạy được ở cả máy chủ và trình duyệt.

export type DuongDan = (string | number)[];
export interface ViTriChuoi { dau: number; cuoi: number; giaTri: string }   // [dau, cuoi) gồm cả hai dấu "
export interface MucSua { duong: DuongDan; cu: string; moi: string }

export const DAI_TOI_DA = 20_000;
export const khoaDuong = (d: DuongDan) => JSON.stringify(d);

const SO = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
const HANG = /^(?:true|false|null)/;

/** Vị trí mọi chuỗi GIÁ TRỊ (không tính khoá) theo đường dẫn. Văn bản không phải JSON hợp lệ → ném lỗi. */
export function chiMucChuoi(t: string): Map<string, ViTriChuoi> {
  const ra = new Map<string, ViTriChuoi>();
  let i = 0;
  const loi = (vi: string): never => { throw new Error(`JSON lỗi ở ký tự ${i}: ${vi}`); };
  const trang = () => { while (i < t.length && (t[i] === " " || t[i] === "\n" || t[i] === "\r" || t[i] === "\t")) i++; };
  const can = (c: string) => { trang(); if (t[i] !== c) loi(`cần "${c}"`); i++; };
  const chuoi = (): ViTriChuoi => {
    const dau = i;
    i++;
    while (i < t.length && t[i] !== '"') i += t[i] === "\\" ? 2 : 1;
    if (i >= t.length) loi("chuỗi chưa đóng");
    i++;
    return { dau, cuoi: i, giaTri: JSON.parse(t.slice(dau, i)) as string };
  };
  const giaTri = (d: DuongDan): void => {
    trang();
    const c = t[i];
    if (c === "{") {
      i++; trang();
      if (t[i] === "}") { i++; return; }
      for (;;) {
        trang(); if (t[i] !== '"') loi("cần khoá");
        const k = chuoi().giaTri;
        can(":"); giaTri([...d, k]); trang();
        if (t[i] === ",") { i++; continue; }
        can("}"); return;
      }
    }
    if (c === "[") {
      i++; trang();
      if (t[i] === "]") { i++; return; }
      for (let n = 0; ; n++) {
        giaTri([...d, n]); trang();
        if (t[i] === ",") { i++; continue; }
        can("]"); return;
      }
    }
    if (c === '"') { ra.set(khoaDuong(d), chuoi()); return; }
    const m = SO.exec(t.slice(i, i + 40)) ?? HANG.exec(t.slice(i, i + 5));
    if (!m) loi("giá trị lạ");
    i += m![0].length;
  };
  giaTri([]);
  trang();
  if (i !== t.length) loi("thừa ký tự sau JSON");
  return ra;
}

/** Áp các mục sửa vào văn bản gốc. Kiểm: đường dẫn phải là chuỗi có sẵn, giá trị cũ phải khớp (chống sửa đè bản
 *  người khác vừa đổi), độ dài giới hạn; sau khi thay, file vẫn là JSON và chỉ đúng các chuỗi đó đổi. */
export function apDungSua(t: string, sua: MucSua[]): string {
  const muc = chiMucChuoi(t);
  const thay: { vt: ViTriChuoi; moi: string }[] = [];
  const daGap = new Set<string>();
  for (const s of sua) {
    const k = khoaDuong(s.duong);
    if (daGap.has(k)) throw new Error(`Sửa trùng một mục: ${k}`);
    daGap.add(k);
    const vt = muc.get(k);
    if (!vt) throw new Error(`Không có chuỗi ở ${k}`);
    if (vt.giaTri !== s.cu) throw new Error(`Nội dung ở ${k} đã khác bản bạn mở — tải lại trang rồi sửa lại.`);
    if (typeof s.moi !== "string" || s.moi.length > DAI_TOI_DA) throw new Error(`Nội dung mới ở ${k} quá dài.`);
    if (s.moi.trim() === "" && s.cu.trim() !== "") throw new Error(`Không để trống ${k} — muốn bỏ mục thì báo kỹ sư.`);
    if (s.moi !== s.cu) thay.push({ vt, moi: s.moi });
  }
  let ra = t;
  for (const { vt, moi } of thay.sort((a, b) => b.vt.dau - a.vt.dau)) ra = ra.slice(0, vt.dau) + JSON.stringify(moi) + ra.slice(vt.cuoi);

  // Kiểm lại: cùng bộ đường dẫn, chỉ các mục đã sửa đổi giá trị.
  const sau = chiMucChuoi(ra);
  if (sau.size !== muc.size) throw new Error("Cấu trúc file bị đổi — huỷ.");
  const doi = new Map(sua.map((s) => [khoaDuong(s.duong), s.moi]));
  for (const [k, v] of muc) {
    const m = sau.get(k);
    if (!m || m.giaTri !== (doi.get(k) ?? v.giaTri)) throw new Error(`Kiểm lại không khớp ở ${k} — huỷ.`);
  }
  return ra;
}
