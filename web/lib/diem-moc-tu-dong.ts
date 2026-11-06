// ANH-3 — tìm điểm mốc gương mặt TỰ ĐỘNG, ngay trên máy người dùng (WebAssembly, tệp tự phục vụ ở /mediapipe/<phiên bản>/).
// Ảnh không rời máy; chỉ ra toạ độ 0..1 các điểm mốc như khi người dùng tự chấm → web gửi engine (sau thoả thuận dm1) như cũ.
// Chỉ nạp khi người dùng đã chọn ảnh (import động — trang khác không tải gì thêm). Mọi phép đo tướng vẫn ở engine.
import cfg from "./bo-do-mat.json";
import { timChanToc, tuLuoi, type Diem } from "./diem-moc";

export type KetQuaTim =
  | { trang_thai: "xong"; diem: Record<string, Diem>; thieu: string[] }
  | { trang_thai: "khong_thay" | "nhieu_mat" | "loi" };

type BoDo = { detect: (anh: HTMLCanvasElement) => { faceLandmarks: { x: number; y: number }[][] } };
const GOC = `/mediapipe/${cfg.phien_ban}`;
let napBo: Promise<BoDo> | null = null;

function boDo(): Promise<BoDo> {
  napBo ??= (async () => {
    const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
    const fs = await FilesetResolver.forVisionTasks(`${GOC}/wasm`);
    return (await FaceLandmarker.createFromOptions(fs, {
      // CPU: một ảnh tĩnh ~0,1–0,5 giây, chạy đều trên mọi máy (WebGL trên điện thoại cũ hay lỗi)
      baseOptions: { modelAssetPath: `${GOC}/${cfg.mo_hinh}`, delegate: "CPU" },
      runningMode: "IMAGE", numFaces: 2,
    })) as unknown as BoDo;
  })().catch((e) => { napBo = null; throw e; });
  return napBo;
}

/** Ảnh đang hiện (đã xoay đúng chiều theo EXIF như trên màn hình) → khung vẽ ≤ 1280 px để đo và dò màu chân tóc. */
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

/** Tìm 19 điểm từ lưới + chân tóc (dò màu). Điểm nào không chắc thì để trong `thieu` cho người dùng tự chấm. */
export async function timDiemMoc(img: HTMLImageElement): Promise<KetQuaTim> {
  try {
    const c = veLai(img);
    if (!c) return { trang_thai: "loi" };
    const bo = await boDo();
    const mat = bo.detect(c).faceLandmarks;
    if (mat.length === 0) return { trang_thai: "khong_thay" };
    if (mat.length > 1) return { trang_thai: "nhieu_mat" };
    const luoi = mat[0]!;
    const diem = tuLuoi(luoi, c.width, c.height);
    if (!diem) return { trang_thai: "khong_thay" };
    const g = c.getContext("2d", { willReadFrequently: true })!;
    const ct = timChanToc(luoi, { data: g.getImageData(0, 0, c.width, c.height).data, width: c.width, height: c.height });
    const thieu: string[] = [];
    if (ct) diem.chan_toc = ct; else thieu.push("chan_toc");
    return { trang_thai: "xong", diem, thieu };
  } catch {
    return { trang_thai: "loi" };
  }
}
