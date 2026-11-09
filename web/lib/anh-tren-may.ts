// Ảnh người dùng chọn → URL `blob:` để HIỂN THỊ trên máy (không tải lên). Ảnh được giải mã thành điểm ảnh rồi vẽ lại qua
// canvas: URL hiển thị không còn là tệp gốc người dùng đưa vào (CodeQL js/xss-through-dom), EXIF xoay đúng chiều, siêu dữ
// liệu máy ảnh rơi. Giữ nguyên cỡ ảnh (tỉ lệ khung dùng cho phép đo). Không giải mã được → null.
export async function urlAnhSach(f: File | Blob): Promise<string | null> {
  if (!f.type.startsWith("image/")) return null;
  try {
    const bm = await createImageBitmap(f);
    const c = document.createElement("canvas");
    c.width = bm.width; c.height = bm.height;
    const g = c.getContext("2d");
    if (!g || !c.width || !c.height) { bm.close(); return null; }
    g.drawImage(bm, 0, 0);
    bm.close();
    const b = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/jpeg", 0.95));
    return b ? URL.createObjectURL(b) : null;
  } catch {
    return null;
  }
}
