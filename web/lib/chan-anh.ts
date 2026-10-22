// TCS-1 — khung + dải chân cho MỌI ảnh tải về từ trình duyệt (lá số Tử vi, tứ trụ Bát tự… qua lib/tai-anh-*):
// viền theo giao diện đang xem (Đêm sao tối / Giấy cổ sáng — tự nhận theo độ sáng nền), dải chân có tên mảng,
// chữ "hieuban.com" và mã QR (lib/qr.ts, không thư viện) trỏ về đúng trang công cụ kèm ?tu=ta.<ngẫu nhiên> để người
// quét ảnh được gán nguồn (share_clicked → referral_signup). Lượt tải ghi share_created{kind: "tai_anh"}.
import { ghi, maNgauNhien } from "@/lib/do-luong";
import { maHoaQr, veQrCanvas } from "@/lib/qr";
import { GOC_QR, TEN_MIEN } from "@/lib/the-chia-se";

export interface TuyChonChan {
  /** Dòng tên trên dải chân (mặc định theo trang: "Lá số Tử vi", "Lá số Bát tự"…). */
  tieuDe?: string;
  /** Đường dẫn trang công cụ cho mã QR (mặc định: trang đang mở). */
  duong?: string;
}

const TIEU_DE_THEO_TRANG: Record<string, string> = {
  "/tu-vi": "Lá số Tử vi", "/bat-tu": "Lá số Bát tự", "/than-so": "Thần số học", "/kinh-dich": "Kinh Dịch", "/phong-thuy": "Phong thuỷ",
};

/** "rgb(1 2 3)" / "rgb(1, 2, 3)" / "rgba(…)" / "#rrggbb" → [r, g, b, a]; không đọc được → null. */
export function docMau(s: string): [number, number, number, number] | null {
  const t = s.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(t);
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    return [n >> 16, (n >> 8) & 255, n & 255, 1];
  }
  const m = /^rgba?\(([^)]+)\)$/i.exec(t);
  if (!m) return null;
  const p = m[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
  if (p.length < 3 || p.some((x) => Number.isNaN(x))) return null;
  return [p[0]!, p[1]!, p[2]!, p[3] ?? 1];
}

/** Màu nền thật của phần tử (đi ngược lên cha khi nền trong suốt). */
export function nenCuaPhanTu(el: Element): string {
  for (let e: Element | null = el; e; e = e.parentElement) {
    const c = docMau(getComputedStyle(e).backgroundColor);
    if (c && c[3] > 0.5) return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }
  return "rgb(10, 10, 23)";
}

const doSang = ([r, g, b]: [number, number, number, number]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** Vẽ ảnh gốc (w×h, đơn vị CSS px) vào khung + dải chân; trả canvas đã nhân `tiLe`. */
export function dungAnhCoChan(
  anh: CanvasImageSource, w: number, h: number, tiLe: number, mauNen: string, tuyChon: TuyChonChan = {},
): HTMLCanvasElement {
  const nen = docMau(mauNen) ?? [10, 10, 23, 1];
  const sang = doSang(nen) > 0.55;   // Giấy cổ
  const mau = sang
    ? { nen: "rgb(239, 228, 204)", vien: "rgb(160, 120, 60)", chu: "rgb(43, 33, 24)", mo: "rgb(115, 98, 77)", nhan: "rgb(160, 44, 28)", qrNen: "rgb(255, 250, 238)", qrToi: "rgb(30, 24, 20)" }
    : { nen: "rgb(10, 10, 23)", vien: "rgba(233, 196, 106, 0.55)", chu: "rgb(236, 235, 247)", mo: "rgb(150, 148, 186)", nhan: "rgb(233, 196, 106)", qrNen: "rgb(244, 239, 226)", qrToi: "rgb(10, 10, 23)" };

  const le = Math.max(16, Math.round(w * 0.03));
  const qrCanh = Math.max(96, Math.min(150, Math.round(w * 0.16)));
  const chanCao = qrCanh + le * 2;
  const W = w + le * 2, H = h + le * 2 + chanCao;

  const duong = tuyChon.duong ?? (typeof location !== "undefined" ? location.pathname : "/");
  const tu = `ta.${maNgauNhien(10)}`;
  const qr = maHoaQr(`${GOC_QR}${duong === "/" ? "/" : duong}?tu=${tu}`);
  const tieuDe = tuyChon.tieuDe ?? TIEU_DE_THEO_TRANG[duong] ?? "Hiểu Bản Thân";
  const phong = typeof document !== "undefined" ? getComputedStyle(document.body).fontFamily : "system-ui, sans-serif";

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * tiLe);
  canvas.height = Math.round(H * tiLe);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ canvas");
  ctx.scale(tiLe, tiLe);

  ctx.fillStyle = mau.nen;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(anh, le, le, w, h);
  // Viền kép kiểu khung tranh: nét ngoài mảnh, nét trong đậm hơn.
  ctx.strokeStyle = mau.vien;
  ctx.lineWidth = 1;
  ctx.strokeRect(le / 3, le / 3, W - (le * 2) / 3, H - (le * 2) / 3);
  ctx.lineWidth = 2;
  ctx.strokeRect(le - 4, le - 4, w + 8, h + 8);

  // Dải chân: bên trái tên mảng + thương hiệu, bên phải hieuban.com + mã QR.
  const y0 = h + le * 2;
  const qrX = W - le - qrCanh, qrY = y0 + (chanCao - qrCanh) / 2 - le / 3;
  ctx.fillStyle = mau.qrNen;
  ctx.fillRect(qrX, qrY, qrCanh, qrCanh);
  const o = qrCanh / (qr.kichThuoc + 8);   // vùng yên tĩnh đúng chuẩn: 4 ô mỗi phía
  veQrCanvas(ctx, qr, qrX + o * 4, qrY + o * 4, o * qr.kichThuoc, mau.qrToi);

  const giua = qrY + qrCanh / 2;
  const coLon = Math.round(qrCanh * 0.24), coNho = Math.round(qrCanh * 0.13);
  const chu = (t: string, x: number, y: number, co: number, mauChu: string, dam: boolean, canh: CanvasTextAlign) => {
    ctx.font = `${dam ? "600 " : ""}${co}px ${phong}`;
    ctx.fillStyle = mauChu;
    ctx.textAlign = canh;
    ctx.fillText(t, x, y);
  };
  ctx.textBaseline = "middle";
  ctx.font = `600 ${coLon}px ${phong}`;
  const rongTrai = Math.max(ctx.measureText(tieuDe).width, ctx.measureText("Hiểu Bản Thân").width);
  const rongPhai = ctx.measureText(TEN_MIEN).width;
  if (le + rongTrai + 32 + rongPhai + 22 <= qrX) {
    chu(tieuDe, le, giua - coNho, coLon, mau.nhan, true, "left");
    chu("Hiểu Bản Thân", le, giua + coLon * 0.55, coNho, mau.mo, false, "left");
    chu(TEN_MIEN, qrX - 22, giua - coNho, coLon, mau.chu, true, "right");
    chu("Quét để xem của bạn", qrX - 22, giua + coLon * 0.55, coNho, mau.mo, false, "right");
  } else {
    // Ảnh hẹp (điện thoại): ba dòng bên trái mã.
    chu(tieuDe, le, giua - coLon, coLon * 0.85, mau.nhan, true, "left");
    chu(TEN_MIEN, le, giua + 2, coLon * 0.85, mau.chu, true, "left");
    chu("Quét để xem của bạn", le, giua + coLon, coNho, mau.mo, false, "left");
  }

  ghi("share_created", { kind: "tai_anh", ma_moi: tu });
  return canvas;
}
