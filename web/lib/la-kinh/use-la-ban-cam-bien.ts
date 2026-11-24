"use client";
// LK-1 — đọc la bàn điện thoại. Bộ nghe cảm biến CHỈ tồn tại trong lúc ngắm / đo: dừng khi đo xong, khi bấm Dừng, khi
// rời trang, khi tab bị ẩn, khi máy không trả số nào sau 2,5 giây. Lúc ngắm chỉ đưa ra số NGUYÊN đã làm mượt để vẽ kim
// (≤ ~8 lần / giây, bỏ qua khi số không đổi). Một lần đo = "giữ yên 1,5 giây": thu MẪU THÔ rồi trả cho nơi gọi gửi
// engine — hook không tính số độ được chốt.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  THOI_GIAN_GIU_MS, TOI_DA_MAU, doHienThi, giaiMa, kimMuot, lamTronMau, nguonSuKien, saiSoXauNhat, type MauGiaiMa, type SuKienTho,
} from "@/lib/la-kinh/hop-nhat";

export type LoiCamBien = "khong_la_ban" | "quyen" | "xin_quyen" | "khong_tra";
/** nghi: không nghe cảm biến · ngam: kim chạy theo máy · giu: đang thu mẫu 1,5 giây. */
export type PhaCamBien = "nghi" | "ngam" | "giu";
/** Mẫu thô của MỘT lần đo (gửi engine nguyên vẹn). `sai_so`: iOS webkitCompassAccuracy xấu nhất đã thấy (âm = chưa hiệu chỉnh). */
export interface LanDo { mau: number[]; sai_so?: number }
/** ok: có mẫu · nghieng: suốt lúc đo máy dựng quá nên không thu được mẫu nào · khong: máy không trả số · null: bị huỷ. */
export type KetQuaGiu = { loai: "ok"; lan: LanDo } | { loai: "nghieng" } | { loai: "khong" } | null;

type CoXinQuyen = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
interface DangThu {
  mau: number[]; saiSo: number | null; coNghieng: boolean;
  xong: (k: KetQuaGiu) => void; hen: number; nhip: number;
}

const NHIP_VE_MS = 125;          // ≤ 8 lần cập nhật giao diện mỗi giây
const CHO_SO_DAU_MS = 2500;      // quá lâu không có số nào → coi như máy không có la bàn
const SO_MAU_KIM = 5;            // kim lúc ngắm = trung bình vòng của bấy nhiêu mẫu gần nhất (chỉ để vẽ)

function gocManHinh(): number {
  try {
    const a = window.screen?.orientation?.angle;
    if (typeof a === "number") return a;
    const cu = (window as unknown as { orientation?: unknown }).orientation;
    return typeof cu === "number" ? cu : 0;
  } catch { return 0; }
}

export function useLaBanCamBien() {
  const [pha, setPha] = useState<PhaCamBien>("nghi");
  const [doSong, setDoSong] = useState<number | null>(null);
  const [nghieng, setNghieng] = useState(false);
  const [tienDo, setTienDo] = useState(0);
  const [loi, setLoi] = useState<LoiCamBien | null>(null);

  const theHe = useRef(0);                       // tăng mỗi lần bắt đầu / dừng → kết quả `await` cũ tự bỏ
  const conSong = useRef(true);
  const phaRef = useRef<PhaCamBien>("nghi");
  const go = useRef<(() => void) | null>(null);  // gỡ bộ nghe + hẹn giờ của lượt đang chạy
  const thu = useRef<DangThu | null>(null);
  const cuoi = useRef<MauGiaiMa | null>(null);   // sự kiện mới nhất (kể cả nghiêng)
  const gan = useRef<number[]>([]);
  const daVe = useRef<{ luc: number; do: number | null; nghieng: boolean }>({ luc: -Infinity, do: null, nghieng: false });

  const datPha = useCallback((p: PhaCamBien) => { phaRef.current = p; if (conSong.current) setPha(p); }, []);

  /** Gỡ bộ nghe; lần đo dở (nếu có) kết thúc với `ketQua`. */
  const ngat = useCallback((ketQua: (t: DangThu) => KetQuaGiu) => {
    theHe.current += 1;
    go.current?.();
    go.current = null;
    const t = thu.current;
    thu.current = null;
    if (t) {
      window.clearTimeout(t.hen);
      window.clearInterval(t.nhip);
      t.xong(ketQua(t));
    }
    datPha("nghi");
    if (conSong.current) { setTienDo(0); setNghieng(false); }
  }, [datPha]);

  const dung = useCallback(() => ngat(() => null), [ngat]);

  useEffect(() => {
    conSong.current = true;
    return () => { conSong.current = false; ngat(() => null); };
  }, [ngat]);

  /** Bắt đầu ngắm: xin quyền (iOS), gắn bộ nghe. Trả true khi kim đã sẵn sàng chạy. */
  const batDau = useCallback(async (): Promise<boolean> => {
    ngat(() => null);
    const luot = theHe.current;
    cuoi.current = null; gan.current = []; daVe.current = { luc: -Infinity, do: null, nghieng: false };
    setLoi(null); setDoSong(null);
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) { setLoi("khong_la_ban"); return false; }
    const DOE = window.DeviceOrientationEvent as CoXinQuyen;
    if (typeof DOE.requestPermission === "function") {
      let quyen: string;
      try { quyen = await DOE.requestPermission(); }
      catch {
        if (luot === theHe.current && conSong.current) setLoi("xin_quyen");
        return false;
      }
      if (luot !== theHe.current || !conSong.current) return false;   // đã bấm lại / rời trang giữa lúc chờ
      if (quyen !== "granted") { setLoi("quyen"); return false; }
    }
    // Nghe CẢ HAI loại sự kiện: `deviceorientationabsolute` (Android: alpha tính từ Bắc) và `deviceorientation` (iOS: có
    // `webkitCompassHeading`). Không đoán hệ máy qua `requestPermission` — Chrome mới cũng có hàm này, đoán nhầm là mất số.
    // `nguonSuKien` chọn: sự kiện tương đối (alpha tính từ lúc mở trang) bị bỏ — đọc nó là lệch tuỳ ý so với Bắc.
    const coTuyetDoi = "ondeviceorientationabsolute" in window;
    let daNhan = false;
    let daThayTuyetDoi = false;
    const nghe = (e: Event) => {
      const sk = e as unknown as SuKienTho;
      const nguon = nguonSuKien(e.type, sk, daThayTuyetDoi);
      if (!nguon) return;
      if (e.type === "deviceorientationabsolute") daThayTuyetDoi = true;
      const m = giaiMa(sk, nguon === "tuyet_doi", gocManHinh());
      if (!m) return;
      daNhan = true;
      cuoi.current = m;
      const t = thu.current;
      if (t) {
        t.saiSo = saiSoXauNhat(t.saiSo, m.saiSo);
        if (m.nghieng) t.coNghieng = true;
        else if (t.mau.length < TOI_DA_MAU) t.mau.push(lamTronMau(m.do));
      }
      if (!m.nghieng) gan.current = [...gan.current.slice(-(SO_MAU_KIM - 1)), m.do];
      const k = kimMuot(gan.current);
      const hien = k == null ? null : doHienThi(k);
      const v = daVe.current, luc = performance.now();
      if (luc - v.luc < NHIP_VE_MS || (hien === v.do && m.nghieng === v.nghieng)) return;
      daVe.current = { luc, do: hien, nghieng: m.nghieng };
      if (hien != null) setDoSong(hien);
      setNghieng(m.nghieng);
    };
    const khiAn = () => { if (document.hidden) ngat(() => null); };
    const cho = window.setTimeout(() => {
      if (daNhan || luot !== theHe.current) return;
      ngat(() => ({ loai: "khong" }));
      if (conSong.current) setLoi("khong_tra");
    }, CHO_SO_DAU_MS);
    if (coTuyetDoi) window.addEventListener("deviceorientationabsolute", nghe);
    window.addEventListener("deviceorientation", nghe);
    document.addEventListener("visibilitychange", khiAn);
    go.current = () => {
      window.removeEventListener("deviceorientationabsolute", nghe);
      window.removeEventListener("deviceorientation", nghe);
      document.removeEventListener("visibilitychange", khiAn);
      window.clearTimeout(cho);
    };
    datPha("ngam");
    return true;
  }, [ngat, datPha]);

  /** "Giữ yên 1,5 giây": thu mẫu thô rồi DỪNG cảm biến. Chỉ gọi được khi đang ngắm. */
  const giuYen = useCallback((): Promise<KetQuaGiu> => {
    if (phaRef.current !== "ngam" || thu.current) return Promise.resolve(null);
    return new Promise<KetQuaGiu>((xong) => {
      const t0 = performance.now();
      const c = cuoi.current;
      const ketThuc = () => ngat((t) => {
        if (t.mau.length) {
          const ss = t.saiSo == null ? undefined : t.saiSo < 0 ? -1 : Math.min(360, t.saiSo);
          return { loai: "ok", lan: { mau: t.mau, ...(ss === undefined ? {} : { sai_so: ss }) } };
        }
        return { loai: t.coNghieng ? "nghieng" : "khong" };
      });
      thu.current = {
        // Số đang thấy lúc bấm là mẫu đầu (máy đứng yên có khi không bắn thêm sự kiện nào) — trừ khi máy đang dựng.
        mau: c && !c.nghieng ? [lamTronMau(c.do)] : [],
        saiSo: c ? c.saiSo : null,
        coNghieng: Boolean(c?.nghieng),
        xong,
        hen: window.setTimeout(ketThuc, THOI_GIAN_GIU_MS),
        nhip: window.setInterval(() => {
          if (conSong.current) setTienDo(Math.min(1, (performance.now() - t0) / THOI_GIAN_GIU_MS));
        }, NHIP_VE_MS),
      };
      setTienDo(0);
      datPha("giu");
    });
  }, [ngat, datPha]);

  return { pha, doSong, nghieng, tienDo, loi, batDau, giuYen, dung };
}

export type TrangThaiCamBien = ReturnType<typeof useLaBanCamBien>;
