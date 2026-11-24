// CT-2 — tìm 21 điểm mốc BÀN TAY ngay trên máy người dùng (MediaPipe Hand Landmarker, WebAssembly, tệp tự phục vụ ở
// /mediapipe/<phiên bản>/ như bộ gương mặt ANH-3). Ảnh không rời máy; chỉ ra toạ độ 0..1 của 21 điểm (thứ tự MediaPipe Hand:
// 0 cổ tay, 1–4 ngón cái, 5–8 trỏ, 9–12 giữa, 13–16 áp út, 17–20 út) + worldLandmarks 3D + tín hiệu đường chỉ ROI tham khảo
// + tỉ lệ khung ảnh → web gửi engine `/v1/chi-tay/do-tay` hoặc `/v1/chi-tay/luan-giai-hai-tay` sau thoả thuận `ct2`.
// Chỉ nạp khi người dùng đã chọn ảnh (import động — trang khác không tải gì thêm).
import cfg from "./bo-do-mat.json";
import { trichXuatDuongChi, type KetQuaDuongChiCV } from "./duong-chi-tay-cv";

export type DiemTay = [number, number];
export type DiemTay3D = [number, number, number];
export type KetQuaTimTay =
  | {
      trang_thai: "xong";
      diem: DiemTay[];
      diem_3d?: DiemTay3D[];
      ty_le: number;
      tay_mp: "Left" | "Right";
      duong_chi_goi_y?: KetQuaDuongChiCV | null;
    }
  | { trang_thai: "khong_thay" | "nhieu_tay" | "ngoai_khung" | "loi" };

type BoDoTay = {
  detect: (anh: HTMLCanvasElement) => {
    landmarks: { x: number; y: number }[][];
    worldLandmarks?: { x: number; y: number; z: number }[][];
    handedness?: { categoryName: string }[][];
  };
};
const GOC = `/mediapipe/${cfg.phien_ban}`;
let napBo: Promise<BoDoTay> | null = null;

function boDo(): Promise<BoDoTay> {
  napBo ??= (async () => {
    const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
    const fs = await FilesetResolver.forVisionTasks(`${GOC}/wasm`);
    return (await HandLandmarker.createFromOptions(fs, {
      // CPU: một ảnh tĩnh chạy đều trên mọi máy (WebGL trên điện thoại cũ hay lỗi) — như bộ gương mặt
      baseOptions: { modelAssetPath: `${GOC}/${cfg.tay.mo_hinh}`, delegate: "CPU" },
      runningMode: "IMAGE", numHands: 2,
    })) as unknown as BoDoTay;
  })().catch((e) => { napBo = null; throw e; });
  return napBo;
}

/** Ảnh đang hiện (đã xoay đúng chiều theo EXIF như trên màn hình) → khung vẽ ≤ 1280 px để đo. */
function veLai(img: HTMLImageElement): HTMLCanvasElement | null {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) return null;
  const k = Math.min(1, 1280 / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/** Lệch ra ngoài khung một chút (mép ngón chạm mép ảnh) thì kẹp lại; ra ngoài nhiều = bàn tay không nằm trọn trong ảnh. */
const LE = 0.02;

export async function timBanTay(img: HTMLImageElement): Promise<KetQuaTimTay> {
  try {
    const c = veLai(img);
    if (!c) return { trang_thai: "loi" };
    const bo = await boDo();
    const kq = bo.detect(c);
    const tay = kq.landmarks;
    if (tay.length === 0) return { trang_thai: "khong_thay" };
    if (tay.length > 1) return { trang_thai: "nhieu_tay" };
    const ds = tay[0]!;
    if (ds.length !== 21) return { trang_thai: "khong_thay" };
    if (ds.some((p) => p.x < -LE || p.x > 1 + LE || p.y < -LE || p.y > 1 + LE)) return { trang_thai: "ngoai_khung" };
    const kep = (v: number) => Number(Math.min(1, Math.max(0, v)).toFixed(4));
    const diem = ds.map((p) => [kep(p.x), kep(p.y)] as DiemTay);

    const wds = kq.worldLandmarks?.[0];
    const diem_3d =
      wds && wds.length === 21
        ? wds.map((p) => [Number(p.x.toFixed(5)), Number(p.y.toFixed(5)), Number(p.z.toFixed(5))] as DiemTay3D)
        : undefined;

    let duong_chi_goi_y: KetQuaDuongChiCV | null = null;
    try {
      duong_chi_goi_y = trichXuatDuongChi(c, diem);
    } catch {
      duong_chi_goi_y = null;
    }

    const ten = kq.handedness?.[0]?.[0]?.categoryName;
    return {
      trang_thai: "xong",
      diem,
      ...(diem_3d ? { diem_3d } : {}),
      ty_le: Number((c.width / c.height).toFixed(4)),
      tay_mp: ten === "Left" ? "Left" : "Right",
      duong_chi_goi_y,
    };
  } catch {
    return { trang_thai: "loi" };
  }
}
