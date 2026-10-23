// PT-V2 — "Để máy đọc ảnh": thu nhỏ ảnh nhà NGAY TRÊN TRÌNH DUYỆT trước khi gửi (cạnh dài ≤ 1280 px, JPEG ~0,82,
// ≤ ~1 MB base64, ≤ 3 ảnh). Vẽ lại qua canvas nên EXIF (toạ độ GPS, máy ảnh, giờ chụp) tự rơi; hướng xoay EXIF được
// áp trước khi vẽ (`imageOrientation: "from-image"`). Không lưu gì — chuỗi base64 chỉ sống trong lượt gọi.
// Phần thuần (không DOM) tách riêng để kiểm được: kichThuocThuNho, boTienToData, tongKichThuoc.

export const CANH_DAI_TOI_DA = 1280;
export const CHAT_LUONG_JPEG = 0.82;
/** Mỗi ảnh ≤ ~1 MB base64 (khớp trần route web 1,6 triệu ký tự có dư). */
export const BASE64_TOI_DA = 1_000_000;
export const SO_ANH_TOI_DA = 3;
export type LoaiAnh = "image/jpeg" | "image/png" | "image/webp";
export interface AnhGui { du_lieu: string; loai: LoaiAnh }

/** Cạnh dài về ≤ `toiDa`, giữ tỉ lệ; ảnh nhỏ KHÔNG phóng to. */
export function kichThuocThuNho(rong: number, cao: number, toiDa = CANH_DAI_TOI_DA): [number, number] {
  const r = Math.max(1, Math.round(rong)), c = Math.max(1, Math.round(cao));
  if (r <= toiDa && c <= toiDa) return [r, c];
  const ti = toiDa / Math.max(r, c);
  return [Math.max(1, Math.round(r * ti)), Math.max(1, Math.round(c * ti))];
}

/** "data:image/jpeg;base64,AAAA" → "AAAA" (engine nhận base64 trần, không tiền tố). */
export function boTienToData(dataUrl: string): string {
  const i = dataUrl.indexOf(",");
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
}

export function tongKichThuoc(anh: { du_lieu: string }[]): number {
  return anh.reduce((s, a) => s + a.du_lieu.length, 0);
}

async function docAnh(tep: Blob): Promise<{ nguon: CanvasImageSource; rong: number; cao: number; dong: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(tep, { imageOrientation: "from-image" });
      return { nguon: bmp, rong: bmp.width, cao: bmp.height, dong: () => bmp.close() };
    } catch { /* rơi về <img> */ }
  }
  const url = URL.createObjectURL(tep);
  try {
    const img = await new Promise<HTMLImageElement>((ok, loi) => {
      const el = new Image();
      el.onload = () => ok(el);
      el.onerror = () => loi(new Error("khong_doc_duoc_anh"));
      el.src = url;
    });
    return { nguon: img, rong: img.naturalWidth, cao: img.naturalHeight, dong: () => URL.revokeObjectURL(url) };
  } catch (e) { URL.revokeObjectURL(url); throw e; }
}

/** Thu nhỏ một ảnh thành JPEG base64 (không tiền tố). Quá nặng → hạ chất lượng rồi hạ cỡ tối đa 4 lượt; vẫn quá → ném lỗi. */
export async function thuNhoAnh(tep: Blob): Promise<AnhGui> {
  const a = await docAnh(tep);
  try {
    let [r, c] = kichThuocThuNho(a.rong, a.cao);
    let chatLuong = CHAT_LUONG_JPEG;
    for (let lan = 0; lan < 4; lan++) {
      const canvas = document.createElement("canvas");
      canvas.width = r; canvas.height = c;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("khong_co_canvas");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, r, c);        // PNG trong suốt → nền trắng (JPEG không có alpha)
      ctx.drawImage(a.nguon, 0, 0, r, c);
      const du_lieu = boTienToData(canvas.toDataURL("image/jpeg", chatLuong));
      if (du_lieu.length <= BASE64_TOI_DA) return { du_lieu, loai: "image/jpeg" };
      chatLuong = Math.max(0.5, chatLuong - 0.12);
      [r, c] = [Math.max(1, Math.round(r * 0.8)), Math.max(1, Math.round(c * 0.8))];
    }
    throw new Error("anh_qua_nang");
  } finally { a.dong(); }
}

/** Thu nhỏ ≤ 3 ảnh tuần tự (điện thoại yếu không mở 3 canvas lớn cùng lúc). */
export async function chuanBiAnhGui(teps: Blob[]): Promise<AnhGui[]> {
  const kq: AnhGui[] = [];
  for (const t of teps.slice(0, SO_ANH_TOI_DA)) kq.push(await thuNhoAnh(t));
  return kq;
}
