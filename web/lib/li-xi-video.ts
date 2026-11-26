// LX-2027 — Quay VIDEO Story 9:16 (~10 giây) của bao lì xì: nền gấm theo thiệp, tranh linh vật / hoa xuân, lời chúc hiện từng chữ,
// pháo hoa nổ phía trên và chữ "2027 / PHÚC" xếp bằng hạt. Vẽ bằng canvas rồi MediaRecorder ghi tại chỗ — video KHÔNG rời máy
// (không tải lên, không dịch vụ ngoài). Chỉ dùng dữ kiện người dùng đang xem (tên + lời chúc đã qua bộ lọc), không dữ liệu cá nhân.
import {
  ANH_NEN_GAM_EP_KIM,
  mauThiepTheoMa,
  thongTinHoaTiet,
  type HoaTietTet,
  type MauThiep,
} from "@/lib/li-xi-tet";
import { taoPhaoHoa } from "@/lib/phao-hoa";
import { taoAmThanh } from "@/lib/phao-hoa-am";

const W = 720;
const H = 1280;
const TONG_MS = 10_500;
// Có âm thanh: nêu rõ mã âm (mp4a / opus) để trình duyệt chọn đúng bộ mã hoá; không hỗ trợ thì rơi về danh sách không tiếng.
const KIEU_CO_TIENG = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus"];
const KIEU_UU_TIEN = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

export function hoTroQuayVideo(): boolean {
  try {
    return typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement !== "undefined"
      && typeof HTMLCanvasElement.prototype.captureStream === "function" && Boolean(chonKieu());
  } catch { return false; }
}

function chonKieu(coTieng = false): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  if (coTieng) { const k = KIEU_CO_TIENG.find((x) => MediaRecorder.isTypeSupported(x)); if (k) return k; }
  return KIEU_UU_TIEN.find((k) => MediaRecorder.isTypeSupported(k)) ?? null;
}

function taiAnh(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const a = new Image();
    a.onload = () => ok(a);
    a.onerror = () => ok(null);
    a.src = src;
  });
}

const luiTre = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const kep = (v: number) => Math.min(1, Math.max(0, v));

function hinhBoGoc(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Xuống dòng theo bề rộng; trả mảng dòng, mỗi dòng là mảng {chu, x} (toạ độ tương đối) để từng chữ hiện riêng. */
function chiaDong(g: CanvasRenderingContext2D, chuc: string, rongToiDa: number) {
  const tu = chuc.split(/\s+/).filter(Boolean);
  const dong: { chu: string; x: number; i: number }[][] = [];
  let cur: { chu: string; x: number; i: number }[] = [];
  let x = 0;
  const rongCach = g.measureText(" ").width;
  tu.forEach((chu, i) => {
    const rong = g.measureText(chu).width;
    if (cur.length && x + rong > rongToiDa) { dong.push(cur); cur = []; x = 0; }
    cur.push({ chu, x, i });
    x += rong + rongCach;
  });
  if (cur.length) dong.push(cur);
  const rongDong = dong.map((d) => { const l = d[d.length - 1]!; return l.x + g.measureText(l.chu).width; });
  return { dong, rongDong, soTu: tu.length };
}

export interface TuyChonVideo {
  mau: MauThiep;
  hoa: HoaTietTet;
  nenGam: boolean;
  tenNguoiTang?: string | null;
  loiChuc: string;
  /** Kèm tiếng pháo + nhạc Năm mới (tổng hợp tại máy, ghi vào video; không phát ra loa). */
  kemTieng?: boolean;
  onTienDo?: (phanTram: number) => void;
}
export interface KetQuaVideo { blob: Blob; duoi: "mp4" | "webm"; mime: string; coTieng: boolean }

export async function quayVideoLiXi(o: TuyChonVideo): Promise<KetQuaVideo> {
  const am = o.kemTieng ? taoAmThanh(true) : null;
  const kc = am?.luongVideo ? chonKieu(true) : null;
  const coTieng = Boolean(kc && /mp4a|opus/.test(kc));
  const kieu = chonKieu(coTieng);
  if (am && !coTieng) am.dong();
  if (!kieu || !hoTroQuayVideo()) throw new Error("Trình duyệt này chưa hỗ trợ quay video.");
  const t = mauThiepTheoMa(o.mau);
  const tt = thongTinHoaTiet(o.hoa, o.mau);
  try { await document.fonts?.ready; } catch { /* bỏ qua */ }
  const [anhHoa, anhGam] = await Promise.all([tt.anh ? taiAnh(tt.anh) : Promise.resolve(null), o.nenGam ? taiAnh(ANH_NEN_GAM_EP_KIM) : Promise.resolve(null)]);

  const ra = document.createElement("canvas");
  ra.width = W; ra.height = H;
  const g = ra.getContext("2d")!;
  const fw = document.createElement("canvas");
  const bangMau = [t.nhan, "#fda4af", "#fde047", "#fff7d6", "#f97316"];
  const vung = { tam: W / 2, rong: W * 0.78, day: H * 0.44, dinh: H * 0.07 };
  const phao = taoPhaoHoa({ am: coTieng ? am : null, canvas: fw, rong: W, cao: H, dpr: 1, heSo: 1, bangMau, vung: () => vung, chu: ["2027", "PHÚC"] });

  const chuc = o.loiChuc.trim() || "Chúc năm Đinh Mùi 2027 vạn sự hanh thông, tâm an trí sáng.";
  const ten = o.tenNguoiTang?.trim();
  const FONT_CHUC = '600 28px Georgia, "Times New Roman", serif';
  g.font = FONT_CHUC;
  const khoiChuc = chiaDong(g, chuc, 480);
  const DONG_CAO = 40;
  const chThiep = Math.max(290, 96 + (khoiChuc.dong.length - 1) * DONG_CAO + 84);

  // Hạt sao nền cố định (không Math.random trong lúc vẽ → hình ổn định giữa các khung).
  const sao = Array.from({ length: 46 }, (_, i) => ({ x: (i * 97 + 31) % W, y: (i * 173 + 57) % (H * 0.5), pha: i * 1.7, r: 0.8 + (i % 3) * 0.5 }));

  const ve = (ms: number) => {
    // nền
    const nen = g.createRadialGradient(W * 0.3, H * 0.15, 60, W / 2, H / 2, H * 0.8);
    nen.addColorStop(0, t.nenChinh); nen.addColorStop(1, t.nenPhu);
    g.globalAlpha = 1; g.fillStyle = nen; g.fillRect(0, 0, W, H);
    if (anhGam) { g.globalAlpha = 0.28; g.drawImage(anhGam, 0, 0, W, H); g.globalAlpha = 1; }
    for (const s of sao) {
      g.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(ms / 700 + s.pha));
      g.fillStyle = "#fff3c4"; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.3); g.fill();
    }
    g.globalAlpha = 1;

    // khung viền kép ép kim
    g.strokeStyle = t.vien; g.lineWidth = 3; g.globalAlpha = 0.85;
    hinhBoGoc(g, 28, 28, W - 56, H - 56, 44); g.stroke();
    g.lineWidth = 1; g.globalAlpha = 0.45; hinhBoGoc(g, 44, 44, W - 88, H - 88, 34); g.stroke();
    g.globalAlpha = 1;

    // pháo hoa (canvas riêng, vẽ phía sau thẻ để chữ không bị chói)
    g.drawImage(fw, 0, 0);

    // tiêu đề
    const vao = luiTre(ms / 900);
    g.globalAlpha = vao; g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.fillStyle = t.nhan; g.font = '700 22px system-ui, "Be Vietnam Pro", sans-serif';
    g.fillText("L Ì   X Ì   T Ế T   ·   Đ I N H   M Ù I   2 0 2 7", W / 2, 118 - (1 - vao) * 18);
    g.globalAlpha = 1;

    // medallion tranh (hoặc ấn son nếu không có tranh)
    const cy = 640, r = 118 * (0.82 + 0.18 * luiTre((ms - 200) / 900));
    g.save();
    g.shadowColor = "rgba(255,200,90,0.55)"; g.shadowBlur = 38 + 14 * Math.sin(ms / 420);
    g.beginPath(); g.arc(W / 2, cy, r + 8, 0, 6.3); g.fillStyle = t.vien; g.fill();
    g.restore();
    g.save();
    g.beginPath(); g.arc(W / 2, cy, r, 0, 6.3); g.clip();
    if (anhHoa) {
      const k = Math.max((2 * r) / anhHoa.width, (2 * r) / anhHoa.height);
      g.drawImage(anhHoa, W / 2 - (anhHoa.width * k) / 2, cy - (anhHoa.height * k) / 2, anhHoa.width * k, anhHoa.height * k);
    } else {
      g.fillStyle = t.nenPhu; g.fillRect(W / 2 - r, cy - r, 2 * r, 2 * r);
      g.fillStyle = t.nhan; g.textAlign = "center"; g.font = '700 120px Georgia, serif'; g.fillText("福", W / 2, cy + 40);
    }
    g.restore();

    // thiệp lời chúc trượt lên
    const tTh = luiTre((ms - 1100) / 700);
    if (tTh > 0) {
      const cw = 540, ch = chThiep, cx = (W - cw) / 2, cyT = 800 + (1 - tTh) * 70;
      g.globalAlpha = tTh;
      g.save(); g.shadowColor = "rgba(0,0,0,0.45)"; g.shadowBlur = 36; g.shadowOffsetY = 12;
      hinhBoGoc(g, cx, cyT, cw, ch, 26); g.fillStyle = "#fffaf0"; g.fill(); g.restore();
      g.strokeStyle = t.vien; g.lineWidth = 2; hinhBoGoc(g, cx, cyT, cw, ch, 26); g.stroke();
      g.fillStyle = "#9a3412"; g.textAlign = "left"; g.font = '700 17px system-ui, "Be Vietnam Pro", sans-serif';
      g.fillText("THIỆP LÌ XÌ TẾT 2027", cx + 30, cyT + 44);
      // lời chúc: từng chữ hiện dần
      g.font = FONT_CHUC; g.fillStyle = "#2b1610";
      const dongCao = DONG_CAO, y0 = cyT + 96, x0 = cx + (cw - 480) / 2;
      khoiChuc.dong.forEach((d, di) => {
        d.forEach((w) => {
          const a = kep((ms - (1800 + w.i * 95)) / 420);
          if (a <= 0) return;
          g.globalAlpha = tTh * a;
          g.fillText(w.chu, x0 + w.x, y0 + di * dongCao + (1 - a) * 10);
        });
      });
      g.globalAlpha = tTh;
      const hetChu = 1800 + khoiChuc.soTu * 95 + 420;
      const aTen = kep((ms - hetChu) / 500);
      g.globalAlpha = tTh * aTen; g.textAlign = "right"; g.fillStyle = "#7c2d12"; g.font = '600 22px Georgia, serif';
      g.fillText(`— ${ten ? `Từ ${ten}` : "Gửi tặng bạn từ Hiểu Bản Thân"}`, cx + cw - 30, cyT + ch - 26);
      g.globalAlpha = 1;
    }

    // chân trang
    const aCuoi = kep((ms - 1500) / 800);
    g.globalAlpha = 0.9 * aCuoi; g.textAlign = "center"; g.fillStyle = t.nhan; g.font = '600 24px system-ui, "Be Vietnam Pro", sans-serif';
    g.fillText("hieuban.com", W / 2, H - 78);
    g.globalAlpha = 1;
  };

  ve(0);
  const luong = ra.captureStream(30);
  if (coTieng) am!.luongVideo!.getAudioTracks().forEach((tr) => luong.addTrack(tr));
  const mrec = new MediaRecorder(luong, { mimeType: kieu, videoBitsPerSecond: 4_000_000 });
  const manh: BlobPart[] = [];
  mrec.ondataavailable = (e) => { if (e.data.size) manh.push(e.data); };
  const xong = new Promise<void>((ok, loi) => { mrec.onstop = () => ok(); mrec.onerror = () => loi(new Error("Quay video bị gián đoạn.")); });

  mrec.start(250);
  const bat = performance.now();
  if (coTieng) { await am!.ctx.resume().catch(() => undefined); am!.nhac(am!.ctx.currentTime + 0.15, 0.46); }
  phao.banMan();
  await new Promise<void>((ok) => {
    const khung = (now: number) => {
      const ms = now - bat;
      ve(Math.min(ms, TONG_MS));
      o.onTienDo?.(Math.round(kep(ms / TONG_MS) * 100));
      if (ms < TONG_MS) requestAnimationFrame(khung); else ok();
    };
    requestAnimationFrame(khung);
  });
  phao.dung();
  mrec.stop();
  await xong;
  luong.getTracks().forEach((tr) => tr.stop());
  am?.dong();
  const mime = kieu.split(";")[0]!;
  return { blob: new Blob(manh, { type: mime }), duoi: mime === "video/mp4" ? "mp4" : "webm", mime, coTieng };
}
