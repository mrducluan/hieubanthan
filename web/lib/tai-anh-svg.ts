// Tải một <svg> trên trang thành ảnh PNG (không thêm thư viện). Biến màu CSS (--ls-*) được "đóng băng"
// vào bản sao vì ảnh vẽ qua canvas không đọc stylesheet của trang. Phông chữ web không nhúng → trình
// duyệt dùng phông hệ thống gần nhất trong ảnh.
export async function taiAnhSvg(svg: SVGSVGElement, tenFile: string, tiLe = 2): Promise<void> {
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
    const canvas = document.createElement("canvas");
    canvas.width = vb.width * tiLe;
    canvas.height = vb.height * tiLe;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Trình duyệt không hỗ trợ canvas");
    ctx.scale(tiLe, tiLe);
    ctx.drawImage(anh, 0, 0);
    const png = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/png"));
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
  } finally {
    URL.revokeObjectURL(url);
  }
}

function khongDau(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9._-]+/g, "-");
}
