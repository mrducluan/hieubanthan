// QBG-1 — bộ tìm điểm mốc ở chế độ VIDEO cho "Quét 3 góc" (cùng tệp tự phục vụ /mediapipe/<phiên bản>/ của ANH-3, cùng CSP:
// chỉ dịch WebAssembly, mọi kết nối ra ngoài của thư viện bị chặn). Khung hình camera chỉ ở trong trình duyệt.
// Thử GPU trước (nhanh, mượt trên điện thoại mới), lỗi thì CPU. Chỉ nạp khi người dùng bấm "Quét" (import động).
import cfg from "./bo-do-mat.json";

export type BoDoVideo = {
  detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks: { x: number; y: number; z: number }[][] };
  close: () => void;
};
const GOC = `/mediapipe/${cfg.phien_ban}`;

export async function napBoDoVideo(): Promise<BoDoVideo> {
  const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
  const fs = await FilesetResolver.forVisionTasks(`${GOC}/wasm`);
  const tao = (delegate: "GPU" | "CPU") => FaceLandmarker.createFromOptions(fs, {
    baseOptions: { modelAssetPath: `${GOC}/${cfg.mo_hinh}`, delegate },
    runningMode: "VIDEO", numFaces: 2,
  });
  try { return (await tao("GPU")) as unknown as BoDoVideo; } catch { return (await tao("CPU")) as unknown as BoDoVideo; }
}
