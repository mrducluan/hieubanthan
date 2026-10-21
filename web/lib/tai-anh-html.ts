// Tải một khối HTML (kể cả SVG lồng bên trong) thành ảnh PNG mà không thêm thư viện: bản sao được "đóng
// băng" style tính sẵn (computed style) rồi bọc trong <svg><foreignObject> và vẽ qua canvas — cùng kỹ
// thuật các thư viện html-to-image dùng. Phông web không nhúng → ảnh dùng phông hệ thống gần nhất.
import { taiCanvas } from "@/lib/tai-anh-svg";
// TCS-1: khung theo giao diện + dải chân (mã QR + hieuban.com) cho mọi ảnh tải về — lib/chan-anh.ts.
import { dungAnhCoChan, nenCuaPhanTu, type TuyChonChan } from "@/lib/chan-anh";

// Chỉ chép các thuộc tính ảnh hưởng hình thức (chép toàn bộ ~350 thuộc tính làm ảnh nặng hàng chục MB).
const THUOC_TINH = [
  "display", "position", "top", "right", "bottom", "left", "box-sizing", "width", "height", "min-width", "min-height",
  "margin-top", "margin-right", "margin-bottom", "margin-left", "padding-top", "padding-right", "padding-bottom",
  "padding-left", "border-top", "border-right", "border-bottom", "border-left", "border-radius", "outline",
  "background-color", "background-image", "box-shadow", "opacity", "overflow", "color", "font-family", "font-size",
  "font-weight", "font-style", "line-height", "letter-spacing", "text-align", "text-transform", "text-decoration",
  "white-space", "word-break", "vertical-align", "flex-direction", "flex-wrap", "flex-grow", "flex-shrink",
  "flex-basis", "align-items", "align-self", "justify-content", "gap", "row-gap", "column-gap",
  "grid-template-columns", "grid-template-rows", "grid-column", "grid-row", "list-style-type", "transform",
  "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-opacity", "fill-opacity", "text-anchor",
  "dominant-baseline", "visibility", "z-index",
];

function dongBang(goc: Element, ban: Element) {
  const cs = getComputedStyle(goc);
  // Khối cuộn ngang trên màn hẹp: trong ảnh trải hết, không vẽ thanh cuộn.
  const tran = (k: string) => (k === "overflow" && /auto|scroll/.test(cs.overflow) ? "overflow:visible" : `${k}:${cs.getPropertyValue(k)}`);
  ban.setAttribute("style", THUOC_TINH.map(tran).join(";"));
  ban.removeAttribute("class");
  const bo: Element[] = [];
  for (let i = 0; i < goc.children.length; i++) {
    const g = goc.children[i], b = ban.children[i];
    if (!g || !b) continue;
    // Chữ chỉ dành cho trình đọc màn hình (sr-only) không vẽ vào ảnh — trong foreignObject nó chiếm ô lưới.
    if (g.classList.contains("sr-only")) bo.push(b);
    else dongBang(g, b);
  }
  bo.forEach((b) => b.remove());
}

const doc = (b: Blob) => new Promise<string>((ok, loi) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.onerror = () => loi(r.error);
  r.readAsDataURL(b);
});

/** Các @font-face cùng nguồn của trang, tệp phông đổi thành data URL (bỏ phông chữ Hán). */
async function nhungPhong(): Promise<string> {
  const quy: CSSFontFaceRule[] = [];
  for (const ss of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = ss.cssRules; } catch { continue; }      // stylesheet khác nguồn
    for (const r of Array.from(rules)) if (r instanceof CSSFontFaceRule) quy.push(r);
  }
  const han = getComputedStyle(document.documentElement).getPropertyValue("--font-han").split(",")[0]?.trim().replace(/['"]/g, "");
  const ds = await Promise.all(quy.map(async (r) => {
    if (han && r.style.getPropertyValue("font-family").replace(/['"]/g, "").trim() === han) return "";
    let css = r.cssText;
    for (const m of Array.from(css.matchAll(/url\(["']?([^"')]+)["']?\)/g))) {
      try {
        const b = await (await fetch(new URL(m[1]!, document.baseURI))).blob();
        css = css.replace(m[0], `url(${await doc(b)})`);
      } catch { return ""; }
    }
    return css;
  }));
  return ds.join("\n");
}

export async function taiAnhHtml(el: HTMLElement, tenFile: string, tiLe = 2, chan: TuyChonChan = {}): Promise<void> {
  const w = el.scrollWidth, h = el.scrollHeight;
  const ban = el.cloneNode(true) as HTMLElement;
  dongBang(el, ban);
  ban.style.width = `${w}px`;
  ban.style.margin = "0";
  ban.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  const phong = await nhungPhong();
  if (phong) {
    const st = document.createElement("style");
    st.textContent = phong;
    ban.prepend(st);
  }
  const xml = new XMLSerializer().serializeToString(ban);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="100%" height="100%">${xml}</foreignObject></svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const anh = new Image();
  await new Promise<void>((ok, loi) => { anh.onload = () => ok(); anh.onerror = () => loi(new Error("Không dựng được ảnh")); anh.src = url; });
  await taiCanvas(dungAnhCoChan(anh, w, h, tiLe, nenCuaPhanTu(el), chan), tenFile);
}
