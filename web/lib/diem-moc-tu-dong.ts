// ANH-3 — tìm điểm mốc gương mặt TỰ ĐỘNG, ngay trên máy người dùng (WebAssembly, tệp tự phục vụ ở /mediapipe/<phiên bản>/).
// Ảnh không rời máy; chỉ ra toạ độ 0..1 các điểm mốc như khi người dùng tự chấm → web gửi engine (sau thoả thuận dm1) như cũ.
// Chỉ nạp khi người dùng đã chọn ảnh (import động — trang khác không tải gì thêm). Mọi phép đo tướng vẫn ở engine.
import cfg from "./bo-do-mat.json";
import { trichXuatDacTrung3D, type BlendshapeItem, type Diem3D } from "./dac-trung-mat-3d";
import { timChanToc, tuLuoi, uocLuongChanToc, type Anh, type Diem } from "./diem-moc";

export type KetQuaTim =
  | { trang_thai: "xong"; diem: Record<string, Diem>; thieu: string[]; dac_trung_3d?: Record<string, number> }
  | { trang_thai: "khong_thay" | "nhieu_mat" | "loi" };

type BoDo = {
  detect: (anh: HTMLCanvasElement) => {
    faceLandmarks: Diem3D[][];
    faceBlendshapes?: { categories?: BlendshapeItem[] }[];
  };
};
const GOC = `/mediapipe/${cfg.phien_ban}`;
let napBo: Promise<BoDo> | null = null;

function boDo(): Promise<BoDo> {
  napBo ??= (async () => {
    const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
    const fs = await FilesetResolver.forVisionTasks(`${GOC}/wasm`);
    const baseOpts = {
      // CPU: một ảnh tĩnh ~0,1–0,5 giây, chạy đều trên mọi máy (WebGL trên điện thoại cũ hay lỗi)
      baseOptions: { modelAssetPath: `${GOC}/${cfg.mo_hinh}`, delegate: "CPU" as const },
      runningMode: "IMAGE" as const,
      numFaces: 2,
    };
    try {
      return (await FaceLandmarker.createFromOptions(fs, {
        ...baseOpts,
        outputFaceBlendshapes: true,
      })) as unknown as BoDo;
    } catch {
      // Mô hình cũ không có blendshapes → nạp lại không bật outputFaceBlendshapes
      return (await FaceLandmarker.createFromOptions(fs, baseOpts)) as unknown as BoDo;
    }
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

/** Tìm 19 điểm từ lưới + chân tóc (dò màu, có ước lượng dự phòng) + đặc trưng 3D/blendshapes/ROI pixel. */
export async function timDiemMoc(img: HTMLImageElement): Promise<KetQuaTim> {
  try {
    const c = veLai(img);
    if (!c) return { trang_thai: "loi" };
    const bo = await boDo();
    const res = bo.detect(c);
    const mat = res.faceLandmarks;
    if (mat.length === 0) return { trang_thai: "khong_thay" };
    if (mat.length > 1) return { trang_thai: "nhieu_mat" };
    const luoi = mat[0]!;
    const diem = tuLuoi(luoi, c.width, c.height);
    if (!diem) return { trang_thai: "khong_thay" };
    const g = c.getContext("2d", { willReadFrequently: true })!;
    const imgData: Anh = { data: g.getImageData(0, 0, c.width, c.height).data, width: c.width, height: c.height };
    const ct = timChanToc(luoi, imgData);
    const thieu: string[] = [];
    let chanTocUocLuong = false;
    if (ct) {
      diem.chan_toc = ct;
    } else {
      const est = uocLuongChanToc(luoi, c.width, c.height);
      if (est) {
        diem.chan_toc = est;
        chanTocUocLuong = true;
      } else {
        thieu.push("chan_toc");
      }
    }
    const blendshapes = res.faceBlendshapes?.[0]?.categories;
    const dac_trung_3d = trichXuatDacTrung3D(luoi, blendshapes, imgData, { chanTocUocLuong });
    return { trang_thai: "xong", diem, thieu, dac_trung_3d };
  } catch {
    return { trang_thai: "loi" };
  }
}
