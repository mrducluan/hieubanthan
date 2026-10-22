// Tải một <svg> trên trang thành ảnh PNG (không thêm thư viện). Biến màu CSS (--ls-*) được "đóng băng"
// vào bản sao vì ảnh vẽ qua canvas không đọc stylesheet của trang. Phông chữ web không nhúng → trình
// duyệt dùng phông hệ thống gần nhất trong ảnh.
// TCS-1: ảnh tải về luôn có khung theo giao diện + dải chân (mã QR + hieuban.com) — lib/chan-anh.ts.
import { dungAnhCoChan, nenCuaPhanTu, type TuyChonChan } from "@/lib/chan-anh";

export async function taiAnhSvg(svg: SVGSVGElement, tenFile: string, tiLe = 2, chan: TuyChonChan = {}): Promise<void> {
  const cs = getComputedStyle(svg);
  const banSao = svg.cloneNode(true) as SVGSVGElement;
  const bien: string[] = [];
  for (let i = 0; i < cs.length; i++) {
    const k = cs.item(i);
    if (k.startsWith("--ls-")) bien.push(`${k}:${cs.getPropertyValue(k)}`);
  }
  // Một số trình duyệt không liệt kê biến tuỳ biến trong CSSStyleDeclaration → đọc theo danh sách đã biết.
  if (!bien.length) {
    for (const k of ["nen", "o", "o-sang", "giua", "menh-nen", "vien", "chu", "mo", "kim", "moc", "thuy", "hoa", "tho",
      "cat", "sat", "dao", "ky", "luu", "nhan", "nhan-mo", "nhan-nen", "hoa-van", "han", "tt-nen", "tt-chu"]) {
      bien.push(`--ls-${k}:${cs.getPropertyValue(`--ls-${k}`)}`);
    }
  }
  banSao.setAttribute("style", `${bien.join(";")};font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif`);
  banSao.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const vb = svg.viewBox.baseVal;
  banSao.setAttribute("width", String(vb.width));
  banSao.setAttribute("height", String(vb.height));

  const xml = new XMLSerializer().serializeToString(banSao);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const anh = new Image();
    await new Promise<void>((ok, loi) => { anh.onload = () => ok(); anh.onerror = () => loi(new Error("Không dựng được ảnh")); anh.src = url; });
    const nen = cs.getPropertyValue("--ls-nen").trim() || nenCuaPhanTu(svg);
    await taiCanvas(dungAnhCoChan(anh, vb.width, vb.height, tiLe, nen, chan), tenFile);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Canvas → PNG → tải về. */
export async function taiCanvas(canvas: HTMLCanvasElement, tenFile: string): Promise<void> {
  let png: Blob | null;
  try {
    png = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/png"));
  } catch {
    // Safari coi canvas vẽ từ <foreignObject> là "bẩn" và chặn xuất.
    throw new Error("Trình duyệt này chưa cho xuất ảnh — hãy chụp màn hình hoặc dùng In / lưu PDF.");
  }
  if (!png) throw new Error("Không xuất được PNG");
  // Gắn thẻ <a> vào trang (Safari/Firefox bỏ qua click trên thẻ rời) và bỏ dấu tên file (một số hệ
  // điều hành/trình duyệt thay tên có dấu bằng "download").
  const a = document.createElement("a");
  a.href = URL.createObjectURL(png);
  a.download = khongDau(tenFile);
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function khongDau(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9._-]+/g, "-");
}
